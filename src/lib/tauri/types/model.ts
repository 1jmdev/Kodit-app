import type {
    Message,
    Project,
    Thread,
    ToolCall,
    TodoItem,
    Question,
} from "@/store/types";

export type BackendMessageRole = "user" | "agent" | "system";
export type BackendMode = "build";

export interface BackendTokenUsage {
    input: number;
    output: number;
    reasoning: number;
    cache_read: number;
    cache_write: number;
}

export interface BackendProject {
    id: string;
    name: string;
    workspace_path: string;
    created_at_ms: number;
    updated_at_ms: number;
}

export interface BackendThread {
    id: string;
    project_id: string;
    title: string;
    mode: BackendMode;
    created_at_ms: number;
    updated_at_ms: number;
}

export interface BackendMessage {
    id: string;
    thread_id: string;
    role: BackendMessageRole;
    content: string;
    model?: string | null;
    provider?: string | null;
    mode: BackendMode;
    tokens: BackendTokenUsage;
    parent_id?: string | null;
    created_at_ms: number;
    updated_at_ms: number;
    sequence: number;
}

export type BackendFileChangeType = "created" | "modified" | "deleted";

export interface BackendFileSnapshotChange {
    file_path: string;
    change_type: BackendFileChangeType;
    old_content?: string | null;
    new_content?: string | null;
}

export interface BackendDiffRecord {
    id: string;
    thread_id: string;
    message_id?: string | null;
    summary?: string | null;
    created_at_ms: number;
    files: BackendFileSnapshotChange[];
}

export interface PersistedMessageMetadata {
    version: 1;
    reasoning?: string;
    toolCalls?: ToolCall[];
    todos?: TodoItem[];
    questions?: Question[];
}

export interface BackendAuthConfig {
    api_keys: Record<string, string>;
}

export interface AuthConfig {
    apiKeys: Record<string, string>;
}

export type FileChangeType = BackendFileChangeType;

export interface FileSnapshotChange {
    filePath: string;
    changeType: FileChangeType;
    oldContent?: string | null;
    newContent?: string | null;
}

export interface DiffRecord {
    id: string;
    threadId: string;
    messageId?: string | null;
    summary?: string | null;
    createdAt: number;
    files: FileSnapshotChange[];
}

export interface AddMessageInput {
    threadId: string;
    role: BackendMessageRole;
    content: string;
    reasoning?: string;
    toolCalls?: ToolCall[];
    todos?: TodoItem[];
    questions?: Question[];
    model?: string;
    provider?: string;
    mode?: BackendMode;
    parentId?: string | null;
    tokens?: {
        input: number;
        output: number;
        reasoning: number;
        cacheRead: number;
        cacheWrite: number;
    };
}

export type { Message, Project, Thread, ToolCall, TodoItem, Question };
