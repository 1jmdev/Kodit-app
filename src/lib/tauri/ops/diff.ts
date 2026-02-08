import { invoke } from "@tauri-apps/api/core";
import { mapDiff } from "../code/map";
import type { BackendDiffRecord, DiffRecord } from "../types/model";

export async function saveDiff(params: {
    threadId: string;
    messageId?: string | null;
    summary?: string | null;
    files: Array<{
        filePath: string;
        oldContent?: string | null;
        newContent?: string | null;
    }>;
}): Promise<DiffRecord> {
    const diff = await invoke<BackendDiffRecord>("save_diff", {
        input: {
            thread_id: params.threadId,
            message_id: params.messageId ?? null,
            summary: params.summary ?? null,
            files: params.files.map((file) => ({
                file_path: file.filePath,
                old_content: file.oldContent ?? null,
                new_content: file.newContent ?? null,
            })),
        },
    });

    return mapDiff(diff);
}

export async function listDiffs(threadId: string): Promise<DiffRecord[]> {
    const diffs = await invoke<BackendDiffRecord[]>("list_diffs", { threadId });
    return diffs.map(mapDiff);
}

export async function clearDiffs(threadId: string): Promise<void> {
    await invoke("clear_diffs", { threadId });
}
