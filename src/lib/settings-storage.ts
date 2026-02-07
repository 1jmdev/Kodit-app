import { z } from "zod";

const STORAGE_KEY = "kodit.settings";

const windowSettingsSchema = z.object({
  showWindowControls: z.boolean().default(true),
});

const settingsSchema = z.object({
  openRouterApiKey: z.string().default(""),
  window: windowSettingsSchema.default({
    showWindowControls: true,
  }),
});

export type StoredSettings = z.infer<typeof settingsSchema>;

export const defaultWindowSettings = {
  showWindowControls: true,
};

const defaultSettings: StoredSettings = {
  openRouterApiKey: "",
  window: defaultWindowSettings,
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

  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    return defaultSettings;
  }

  return parsed.data;
}

export function saveStoredSettings(settings: StoredSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsSchema.parse(settings)));
}
