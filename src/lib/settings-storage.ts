import { z } from "zod";

const STORAGE_KEY = "kodit.settings";

const settingsSchema = z.object({
  openRouterApiKey: z.string().default(""),
});

export type StoredSettings = z.infer<typeof settingsSchema>;

export function loadStoredSettings(): StoredSettings {
  if (typeof window === "undefined") {
    return { openRouterApiKey: "" };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { openRouterApiKey: "" };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { openRouterApiKey: "" };
  }

  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    return { openRouterApiKey: "" };
  }

  return parsed.data;
}

export function saveStoredSettings(settings: StoredSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsSchema.parse(settings)));
}
