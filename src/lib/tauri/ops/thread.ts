import { invoke } from "@tauri-apps/api/core";
import { mapMessage, mapThread } from "../code/map";
import { encode } from "../code/meta";
import type {
    AddMessageInput,
    BackendMessage,
    BackendThread,
    Message,
    Thread,
} from "../types/model";

export async function listThreads(projectId: string): Promise<Thread[]> {
    const threads = await invoke<BackendThread[]>("list_threads", { projectId });
    return threads.map(mapThread);
}

export async function createThread(params: {
    projectId: string;
    title: string;
    mode?: "build";
}): Promise<Thread> {
    const thread = await invoke<BackendThread>("upsert_thread", {
        input: {
            project_id: params.projectId,
            title: params.title,
            mode: params.mode ?? "build",
        },
    });
    return mapThread(thread);
}

export async function listMessages(threadId: string): Promise<Message[]> {
    const messages = await invoke<BackendMessage[]>("list_messages", { threadId });
    return messages.map(mapMessage);
}

export async function addMessage(params: AddMessageInput): Promise<Message> {
    const content = encode({
        content: params.content,
        reasoning: params.reasoning,
        toolCalls: params.toolCalls,
        todos: params.todos,
        questions: params.questions,
    });

    const message = await invoke<BackendMessage>("add_message", {
        input: {
            thread_id: params.threadId,
            role: params.role,
            content,
            model: params.model,
            provider: params.provider,
            mode: params.mode ?? "build",
            parent_id: params.parentId ?? null,
            tokens: {
                input: params.tokens?.input ?? 0,
                output: params.tokens?.output ?? 0,
                reasoning: params.tokens?.reasoning ?? 0,
                cache_read: params.tokens?.cacheRead ?? 0,
                cache_write: params.tokens?.cacheWrite ?? 0,
            },
        },
    });

    return mapMessage(message);
}
