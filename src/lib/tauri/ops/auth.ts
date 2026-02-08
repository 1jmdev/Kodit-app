import { invoke } from "@tauri-apps/api/core";
import type { AuthConfig, BackendAuthConfig } from "../types/model";

export async function readAuthConfig(): Promise<AuthConfig> {
    const config = await invoke<BackendAuthConfig>("read_auth_config");
    return { apiKeys: config.api_keys ?? {} };
}

export async function writeAuthConfig(config: AuthConfig): Promise<AuthConfig> {
    const next = await invoke<BackendAuthConfig>("write_auth_config", {
        input: { api_keys: config.apiKeys },
    });

    return { apiKeys: next.api_keys ?? {} };
}
