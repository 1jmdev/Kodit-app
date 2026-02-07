import type { ModelConfig } from "./types";

export const mockModels: ModelConfig[] = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", qualityLevel: "Medium" },
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI", qualityLevel: "High" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", qualityLevel: "Extra High" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", provider: "Meta", qualityLevel: "High" },
  { id: "mistralai/mistral-small", name: "Mistral Small", provider: "Mistral", qualityLevel: "Medium" },
];

export const defaultModel: ModelConfig = mockModels[0];
