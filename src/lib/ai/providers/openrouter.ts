import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { ModelConfig } from "@/store/types";
import type { ProviderPreset } from "@/lib/ai/types";

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

function mapToModelConfig(model: z.infer<typeof modelSchema>): ModelConfig {
    return {
        id: model.id,
        name: model.name || model.id,
        providerId: "openrouter",
        provider: "OpenRouter",
    };
}

export const openRouterProviderPreset: ProviderPreset = {
    id: "openrouter",
    label: "OpenRouter",
    apiKeyHint: "OpenRouter API key must start with sk-or-v1-",
    validateApiKey: (apiKey) => {
        const result = apiKeySchema.safeParse(apiKey);
        if (result.success) {
            return { success: true };
        }
        return {
            success: false,
            message:
                result.error.issues[0]?.message || "Invalid OpenRouter API key",
        };
    },
    fetchModels: async (apiKey) => {
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
    },
    createModel: (apiKey, modelId) => {
        const validApiKey = apiKeySchema.parse(apiKey).trim();
        const openrouter = createOpenRouter({ apiKey: validApiKey });
        return openrouter.chat(modelId);
    },
};
