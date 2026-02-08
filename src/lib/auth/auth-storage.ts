import { readAuthConfig, writeAuthConfig } from "@/lib/tauri-storage";

export async function loadAuthApiKeys(): Promise<Record<string, string>> {
    try {
        const config = await readAuthConfig();
        return config.apiKeys;
    } catch {
        return {};
    }
}

export async function saveAuthApiKey(
    providerId: string,
    apiKey: string,
): Promise<Record<string, string>> {
    const current = await loadAuthApiKeys();
    const nextApiKeys = {
        ...current,
        [providerId]: apiKey,
    };

    const saved = await writeAuthConfig({ apiKeys: nextApiKeys });
    return saved.apiKeys;
}
