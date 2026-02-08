import type { ProviderPreset } from "@/lib/ai/types";
import { openRouterProviderPreset } from "@/lib/ai/providers/openrouter";

const presets = [openRouterProviderPreset] as const;

export const providerPresets: ProviderPreset[] = [...presets];

export const DEFAULT_PROVIDER_ID = "openrouter";

export function getProviderPreset(providerId: string): ProviderPreset {
  const preset = providerPresets.find((item) => item.id === providerId);
  if (!preset) {
    throw new Error(`Unknown provider preset: ${providerId}`);
  }
  return preset;
}
