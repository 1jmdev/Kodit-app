import { z } from "zod";
import { defaultModel } from "@/store/mock-data";
import type { ModelConfig } from "@/store/types";

const STORAGE_KEY = "kodit.settings";

function getModelKey(model: ModelConfig): string {
  return `${model.providerId}:${model.id}`;
}

const windowSettingsSchema = z.object({
  showWindowControls: z.boolean().default(true),
});

const settingsSchema = z.object({
  apiKeys: z.record(z.string(), z.string()).default({}),
  window: windowSettingsSchema.default({
    showWindowControls: true,
  }),
  modelProfiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        providerId: z.string(),
        provider: z.string(),
      }),
    )
    .default([defaultModel]),
  selectedModelId: z.string().default(getModelKey(defaultModel)),
});

export type StoredSettings = z.infer<typeof settingsSchema>;

export const defaultWindowSettings = {
  showWindowControls: true,
};

const defaultSettings: StoredSettings = {
  apiKeys: {},
  window: defaultWindowSettings,
  modelProfiles: [defaultModel],
  selectedModelId: getModelKey(defaultModel),
};

export function loadStoredSettings(): StoredSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultSettings;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return defaultSettings;
  }

  const legacySchema = z.object({
    openRouterApiKey: z.string().optional(),
    window: windowSettingsSchema.optional(),
    modelProfiles: settingsSchema.shape.modelProfiles.optional(),
    selectedModelId: z.string().optional(),
  });

  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    const legacy = legacySchema.safeParse(json);
    if (!legacy.success) {
      return defaultSettings;
    }

    return {
      apiKeys: legacy.data.openRouterApiKey
        ? {
            openrouter: legacy.data.openRouterApiKey,
          }
        : {},
      window: legacy.data.window ?? defaultWindowSettings,
      modelProfiles: legacy.data.modelProfiles ?? [defaultModel],
      selectedModelId:
        legacy.data.selectedModelId ??
        getModelKey(legacy.data.modelProfiles?.[0] ?? defaultModel),
    };
  }

  if (parsed.data.modelProfiles.length === 0) {
    return { ...parsed.data, modelProfiles: [defaultModel], selectedModelId: getModelKey(defaultModel) };
  }

  const normalizedSelectedModelId = parsed.data.selectedModelId.includes(":")
    ? parsed.data.selectedModelId
    : getModelKey(
        parsed.data.modelProfiles.find((model) => model.id === parsed.data.selectedModelId) ??
          parsed.data.modelProfiles[0],
      );

  if (!parsed.data.modelProfiles.some((model) => getModelKey(model) === normalizedSelectedModelId)) {
    return { ...parsed.data, selectedModelId: getModelKey(parsed.data.modelProfiles[0]) };
  }

  return { ...parsed.data, selectedModelId: normalizedSelectedModelId };
}

export function saveStoredSettings(settings: StoredSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsSchema.parse(settings)));
}
