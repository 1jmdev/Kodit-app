import type { ProviderPreset } from "@/lib/ai/types";
import { openRouterProviderPreset } from "@/lib/ai/providers/openrouter";
import { openAIProviderPreset } from "@/lib/ai/providers/openai";
import { geminiProviderPreset } from "@/lib/ai/providers/gemini";

const presets = [openRouterProviderPreset, openAIProviderPreset, geminiProviderPreset] as const;

export const providerPresets: ProviderPreset[] = [...presets];

export const DEFAULT_PROVIDER_ID = "openrouter";

export function getProviderPreset(providerId: string): ProviderPreset {
  const preset = providerPresets.find((item) => item.id === providerId);
  if (!preset) {
    throw new Error(`Unknown provider preset: ${providerId}`);
  }
  return preset;
}
