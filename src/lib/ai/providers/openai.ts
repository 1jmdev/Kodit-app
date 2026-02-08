import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { ModelConfig } from "@/store/types";
import type { ProviderPreset } from "@/lib/ai/types";

const apiKeySchema = z
  .string()
  .trim()
  .min(1, "OpenAI API key is required")
  .regex(/^sk-/, "OpenAI API key must start with sk-");

const modelSchema = z.object({
  id: z.string(),
});

const modelsResponseSchema = z.object({
  data: z.array(modelSchema),
});

function mapToModelConfig(model: z.infer<typeof modelSchema>): ModelConfig {
  return {
    id: model.id,
    name: model.id,
    providerId: "openai",
    provider: "OpenAI",
  };
}

export const openAIProviderPreset: ProviderPreset = {
  id: "openai",
  label: "OpenAI",
  apiKeyHint: "OpenAI API key must start with sk-",
  validateApiKey: (apiKey) => {
    const result = apiKeySchema.safeParse(apiKey);
    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      message: result.error.issues[0]?.message || "Invalid OpenAI API key",
    };
  },
  fetchModels: async (apiKey) => {
    const validApiKey = apiKeySchema.parse(apiKey).trim();
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${validApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Could not load OpenAI models (${response.status})`);
    }

    const json = await response.json();
    const parsed = modelsResponseSchema.parse(json);

    return parsed.data
      .map(mapToModelConfig)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  createModel: (apiKey, modelId) => {
    const validApiKey = apiKeySchema.parse(apiKey).trim();
    const openai = createOpenAI({ apiKey: validApiKey });
    return openai.chat(modelId);
  },
};
