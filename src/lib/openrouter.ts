import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { ToolLoopAgent, stepCountIs, tool } from "ai";
import { z } from "zod";
import { agentReadFile, agentRunCommand, agentWriteFile } from "@/lib/tauri-storage";
import type { Message, ModelConfig, ToolCall } from "@/store/types";

const modelSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  context_length: z.number().nullable().optional(),
});

const modelsResponseSchema = z.object({
  data: z.array(modelSchema),
});

const apiKeySchema = z
  .string()
  .trim()
  .min(1, "OpenRouter API key is required")
  .regex(/^sk-or-v1-/, "OpenRouter API key must start with sk-or-v1-");

export const OPENROUTER_API_KEY_HINT = "OpenRouter API key must start with sk-or-v1-";

const KODIT_SYSTEM_PROMPT = `You are Kodit, an agentic coding assistant in Kodit CLI.

You are precise, safe, and concise. Solve coding tasks by using available tools when needed.

Tool policy:
- Use read_file to inspect relevant files before proposing edits.
- Use write_file for focused changes only.
- Use run_command for diagnostics, build, test, and git checks.
- Keep command workdir inside the project workspace.
- Never run destructive commands unless the user explicitly requests them.

When uncertain, prefer reading files or running safe checks over guessing.
Explain outcomes briefly and clearly.`;

function getQualityLevel(contextLength?: number): ModelConfig["qualityLevel"] {
  if (!contextLength) {
    return "Medium";
  }

  if (contextLength >= 200000) {
    return "Extra High";
  }

  if (contextLength >= 64000) {
    return "High";
  }

  if (contextLength >= 16000) {
    return "Medium";
  }

  return "Low";
}

function mapToModelConfig(model: z.infer<typeof modelSchema>): ModelConfig {
  const provider = model.id.includes("/") ? model.id.split("/")[0] : "openrouter";

  return {
    id: model.id,
    name: model.name || model.id,
    provider: provider.charAt(0).toUpperCase() + provider.slice(1),
    qualityLevel: getQualityLevel(model.context_length ?? undefined),
  };
}

export function validateOpenRouterApiKey(apiKey: string) {
  return apiKeySchema.safeParse(apiKey);
}

export async function fetchOpenRouterModels(apiKey: string): Promise<ModelConfig[]> {
  const validApiKey = apiKeySchema.parse(apiKey).trim();
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${validApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Could not load models (${response.status})`);
  }

  const json = await response.json();
  const parsed = modelsResponseSchema.parse(json);

  return parsed.data
    .map(mapToModelConfig)
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface StreamMessageParams {
  apiKey: string;
  modelId: string;
  messages: Message[];
  workspacePath: string;
  onChunk: (chunk: string) => void;
  onToolCalls?: (toolCalls: ToolCall[]) => void;
}

function truncateValue(value: unknown, maxLength = 500): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) {
    return "";
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function toToolLabel(toolName: string, input: unknown): string {
  const args = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const path = typeof args.path === "string" ? args.path : "file";
  const command = typeof args.command === "string" ? args.command : "command";

  if (toolName === "write_file") {
    return `Edited ${path}`;
  }
  if (toolName === "run_command") {
    return `Ran ${command}`;
  }
  if (toolName === "read_file") {
    return `Read ${path}`;
  }
  return toolName;
}

export async function streamOpenRouterText({
  apiKey,
  modelId,
  messages,
  workspacePath,
  onChunk,
  onToolCalls,
}: StreamMessageParams): Promise<string> {
  const validApiKey = apiKeySchema.parse(apiKey).trim();
  const openrouter = createOpenRouter({ apiKey: validApiKey });

  const toolCallState = new Map<string, ToolCall>();

  const agent = new ToolLoopAgent({
    model: openrouter.chat(modelId),
    stopWhen: stepCountIs(20),
    instructions: KODIT_SYSTEM_PROMPT,
    tools: {
      read_file: tool({
        description: "Read a text file from the workspace",
        inputSchema: z.object({
          path: z.string().min(1).describe("File path to read, relative or absolute"),
          offset: z.number().int().min(0).optional().describe("0-based line offset"),
          limit: z.number().int().min(1).max(4000).optional().describe("Max lines to read"),
        }),
        execute: async ({ path, offset, limit }) => {
          return agentReadFile({
            workspacePath,
            path,
            offset,
            limit,
          });
        },
      }),
      write_file: tool({
        description: "Write complete text content into a file in the workspace",
        inputSchema: z.object({
          path: z.string().min(1).describe("File path to write, relative or absolute"),
          content: z.string().describe("Full file contents to write"),
          create_dirs: z.boolean().optional().describe("Create missing parent directories"),
        }),
        execute: async ({ path, content, create_dirs }) => {
          return agentWriteFile({
            workspacePath,
            path,
            content,
            createDirs: create_dirs,
          });
        },
      }),
      run_command: tool({
        description: "Run a shell command in workspace",
        inputSchema: z.object({
          command: z.string().min(1).describe("Shell command to execute"),
          workdir: z.string().optional().describe("Working directory inside workspace"),
          timeout_ms: z.number().int().min(100).max(120000).optional().describe("Timeout in milliseconds"),
        }),
        execute: async ({ command, workdir, timeout_ms }) => {
          return agentRunCommand({
            workspacePath,
            command,
            workdir,
            timeoutMs: timeout_ms,
          });
        },
      }),
    },
  });

  const result = await agent.stream({
    messages: messages.map((message) => ({
      role: message.role === "agent" ? "assistant" : message.role,
      content: message.content,
    })),
    onStepFinish: (step) => {
      for (const call of step.toolCalls) {
        const existing = toolCallState.get(call.toolCallId);
        const label = toToolLabel(call.toolName, call.input);

        toolCallState.set(call.toolCallId, {
          id: call.toolCallId,
          name: label,
          args: truncateValue(call.input, 220),
          status: existing?.status === "completed" ? "completed" : "running",
          result: existing?.result,
        });
      }

      for (const toolResult of step.toolResults) {
        const existing = toolCallState.get(toolResult.toolCallId);
        if (!existing) {
          continue;
        }

        toolCallState.set(toolResult.toolCallId, {
          ...existing,
          status: "completed",
          result: truncateValue(toolResult.output),
        });
      }

      onToolCalls?.(Array.from(toolCallState.values()));
    },
  });

  let fullText = "";
  for await (const chunk of result.textStream) {
    fullText += chunk;
    onChunk(fullText);
  }

  if (toolCallState.size > 0) {
    const finalized = Array.from(toolCallState.values()).map((toolCall) => ({
      ...toolCall,
      status: toolCall.status === "running" ? "completed" : toolCall.status,
    }));
    onToolCalls?.(finalized);
  }

  return fullText;
}
