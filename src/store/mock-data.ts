import type { ModelConfig } from "./types";

export const mockModels: ModelConfig[] = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", providerId: "openrouter", provider: "OpenRouter" },
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", providerId: "openrouter", provider: "OpenRouter" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", providerId: "openrouter", provider: "OpenRouter" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", providerId: "openai", provider: "OpenAI" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", providerId: "gemini", provider: "Gemini" },
];

export const defaultModel: ModelConfig = mockModels[0];
