import { ToolLoopAgent, stepCountIs } from "ai";
import { koditSystemPrompt } from "@/lib/ai/prompts/kodit-system";
import { getProviderPreset } from "@/lib/ai/providers";
import {
  createWorkspaceTools,
  serializeToolArg,
  serializeToolResult,
  toToolLabel,
} from "@/lib/ai/tools/workspace-tools";
import type { Message, ModelConfig, ToolCall } from "@/store/types";

interface StreamTextParams {
  providerId: string;
  apiKey: string;
  modelId: string;
  messages: Message[];
  workspacePath: string;
  onChunk: (chunk: string) => void;
  onToolCalls?: (toolCalls: ToolCall[]) => void;
}

export function validateProviderApiKey(providerId: string, apiKey: string) {
  return getProviderPreset(providerId).validateApiKey(apiKey);
}

export function getProviderApiKeyHint(providerId: string): string {
  return getProviderPreset(providerId).apiKeyHint;
}

export async function fetchProviderModels(providerId: string, apiKey: string): Promise<ModelConfig[]> {
  return getProviderPreset(providerId).fetchModels(apiKey);
}

export async function streamProviderText({
  providerId,
  apiKey,
  modelId,
  messages,
  workspacePath,
  onChunk,
  onToolCalls,
}: StreamTextParams): Promise<string> {
  const providerPreset = getProviderPreset(providerId);
  const keyValidation = providerPreset.validateApiKey(apiKey);
  if (!keyValidation.success) {
    throw new Error(keyValidation.message || providerPreset.apiKeyHint);
  }

  const toolCallState = new Map<string, ToolCall>();

  const agent = new ToolLoopAgent({
    model: providerPreset.createModel(apiKey, modelId),
    stopWhen: stepCountIs(20),
    instructions: koditSystemPrompt.text,
    tools: createWorkspaceTools(workspacePath),
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
          args: serializeToolArg(call.input),
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
          result: serializeToolResult(toolResult.output),
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
