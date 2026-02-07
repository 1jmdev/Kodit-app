import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { z } from "zod";
import type { Message, ModelConfig } from "@/store/types";

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
  onChunk: (chunk: string) => void;
}

export async function streamOpenRouterText({
  apiKey,
  modelId,
  messages,
  onChunk,
}: StreamMessageParams): Promise<string> {
  const validApiKey = apiKeySchema.parse(apiKey).trim();
  const openrouter = createOpenRouter({ apiKey: validApiKey });

  const result = streamText({
    model: openrouter.chat(modelId),
    messages: messages.map((message) => ({
      role: message.role === "agent" ? "assistant" : message.role,
      content: message.content,
    })),
  });

  let fullText = "";
  for await (const chunk of result.textStream) {
    fullText += chunk;
    onChunk(fullText);
  }

  return fullText;
}
