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
import type { TodoItem } from "@/lib/ai/tools/todo-store";

export type { QuestionInput, QuestionAnswer } from "@/lib/ai/question-bridge";
export type { TodoItem } from "@/lib/ai/tools/todo-store";

interface StreamTextParams {
  providerId: string;
  apiKey: string;
  modelId: string;
  messages: Message[];
  workspacePath: string;
  initialTodos?: TodoItem[];
  onChunk: (chunk: string) => void;
  onReasoning?: (reasoning: string) => void;
  onToolCalls?: (toolCalls: ToolCall[]) => void;
  onTodos?: (todos: TodoItem[]) => void;
}

interface StreamProviderTextResult {
  text: string;
  reasoning: string;
  toolCalls: ToolCall[];
  todos: TodoItem[];
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
  initialTodos = [],
  onChunk,
  onReasoning,
  onToolCalls,
  onTodos,
}: StreamTextParams): Promise<StreamProviderTextResult> {
  const providerPreset = getProviderPreset(providerId);
  const keyValidation = providerPreset.validateApiKey(apiKey);
  if (!keyValidation.success) {
    throw new Error(keyValidation.message || providerPreset.apiKeyHint);
  }

  const toolCallState = new Map<string, ToolCall>();
  const toolCallArgsState = new Map<string, string>();

  function emitToolCalls() {
    onToolCalls?.(Array.from(toolCallState.values()));
  }

  function upsertToolCall(toolCallId: string, next: Partial<ToolCall> & Pick<ToolCall, "id">) {
    const existing = toolCallState.get(toolCallId);
    const merged: ToolCall = {
      id: toolCallId,
      name: next.name ?? existing?.name ?? "Ran tool",
      args: next.args ?? existing?.args ?? "",
      status: next.status ?? existing?.status ?? "pending",
      result: next.result ?? existing?.result,
    };
    toolCallState.set(toolCallId, merged);
    emitToolCalls();
  }

  const { tools, context } = createWorkspaceTools(workspacePath, initialTodos);

  const agent = new ToolLoopAgent({
    model: providerPreset.createModel(apiKey, modelId),
    stopWhen: stepCountIs(20),
    instructions: koditSystemPrompt.text,
    tools,
  });

  const result = await agent.stream({
    messages: messages.map((message) => ({
      role: message.role === "agent" ? "assistant" : message.role,
      content: message.content,
    })),
  });

  let fullText = "";
  let fullReasoning = "";
  for await (const part of result.fullStream) {
    switch (part.type) {
      case "text-delta": {
        fullText += part.text;
        onChunk(fullText);
        break;
      }
      case "reasoning-delta": {
        fullReasoning += part.text;
        onReasoning?.(fullReasoning);
        break;
      }
      case "tool-input-start": {
        toolCallArgsState.set(part.id, "");
        upsertToolCall(part.id, {
          id: part.id,
          name: toToolLabel(part.toolName, undefined),
          args: "",
          status: "pending",
        });
        break;
      }
      case "tool-input-delta": {
        const nextArgs = `${toolCallArgsState.get(part.id) ?? ""}${part.delta}`;
        toolCallArgsState.set(part.id, nextArgs);
        upsertToolCall(part.id, {
          id: part.id,
          args: nextArgs,
          status: "pending",
        });
        break;
      }
      case "tool-call": {
        upsertToolCall(part.toolCallId, {
          id: part.toolCallId,
          name: toToolLabel(part.toolName, part.input),
          args: serializeToolArg(part.input),
          status: "running",
        });
        break;
      }
      case "tool-result": {
        upsertToolCall(part.toolCallId, {
          id: part.toolCallId,
          status: "completed",
          result: serializeToolResult(part.output),
        });

        // Emit todo updates whenever the todo store changes
        if (part.toolName === "todo_write" || part.toolName === "todo_read") {
          onTodos?.(context.todoStore.get());
        }
        break;
      }
      case "tool-error": {
        const errorMessage =
          part.error instanceof Error
            ? part.error.message
            : typeof part.error === "string"
              ? part.error
              : "Tool execution failed.";
        upsertToolCall(part.toolCallId, {
          id: part.toolCallId,
          name: toToolLabel(part.toolName, part.input),
          args: serializeToolArg(part.input),
          status: "failed",
          result: errorMessage,
        });
        break;
      }
      case "error": {
        const errorMessage =
          part.error instanceof Error
            ? part.error.message
            : typeof part.error === "string"
              ? part.error
              : "Streaming failed.";
        throw new Error(errorMessage);
      }
      default:
        break;
    }
  }

  const finalizedToolCalls =
    toolCallState.size > 0
      ? Array.from(toolCallState.values()).map((toolCall) => ({
      ...toolCall,
      status: toolCall.status === "running" ? "completed" : toolCall.status,
      }))
      : [];
  if (finalizedToolCalls.length > 0) {
    onToolCalls?.(finalizedToolCalls);
  }

  return {
    text: fullText,
    reasoning: fullReasoning,
    toolCalls: finalizedToolCalls,
    todos: context.todoStore.get(),
  };
}
