import { invoke } from "@tauri-apps/api/core";

export async function init(): Promise<void> {
    await invoke("storage_info");
}

export async function folder(): Promise<string | null> {
    return invoke<string | null>("pick_folder");
}
