import type { ModelConfig } from "@/store/types";

export interface StreamMessage {
    role: "user" | "agent" | "system";
    content: string;
}

export interface ProviderPreset {
    id: string;
    label: string;
    apiKeyHint: string;
    validateApiKey: (apiKey: string) => { success: boolean; message?: string };
    fetchModels: (apiKey: string) => Promise<ModelConfig[]>;
    createModel: (apiKey: string, modelId: string) => any;
}

export interface PromptPreset {
    id: string;
    text: string;
}
