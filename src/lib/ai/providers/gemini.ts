import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import type { ModelConfig } from "@/store/types";
import type { ProviderPreset } from "@/lib/ai/types";

const apiKeySchema = z
  .string()
  .trim()
  .min(1, "Gemini API key is required")
  .regex(/^AIza[0-9A-Za-z_-]{20,}$/, "Gemini API key must look like AIza...");

const geminiModelSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  supportedGenerationMethods: z.array(z.string()).optional(),
});

const modelsResponseSchema = z.object({
  models: z.array(geminiModelSchema).default([]),
});

function mapToModelConfig(model: z.infer<typeof geminiModelSchema>): ModelConfig {
  const modelId = model.name.replace(/^models\//, "");

  return {
    id: modelId,
    name: model.displayName || modelId,
    providerId: "gemini",
    provider: "Gemini",
  };
}

export const geminiProviderPreset: ProviderPreset = {
  id: "gemini",
  label: "Gemini",
  apiKeyHint: "Gemini API key should start with AIza...",
  validateApiKey: (apiKey) => {
    const result = apiKeySchema.safeParse(apiKey);
    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      message: result.error.issues[0]?.message || "Invalid Gemini API key",
    };
  },
  fetchModels: async (apiKey) => {
    const validApiKey = apiKeySchema.parse(apiKey).trim();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(validApiKey)}`,
    );

    if (!response.ok) {
      throw new Error(`Could not load Gemini models (${response.status})`);
    }

    const json = await response.json();
    const parsed = modelsResponseSchema.parse(json);

    return parsed.models
      .filter((model) => model.supportedGenerationMethods?.includes("generateContent") ?? false)
      .map(mapToModelConfig)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  createModel: (apiKey, modelId) => {
    const validApiKey = apiKeySchema.parse(apiKey).trim();
    const google = createGoogleGenerativeAI({ apiKey: validApiKey });
    return google.chat(modelId);
  },
};
