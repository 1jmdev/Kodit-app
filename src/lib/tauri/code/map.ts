import { decode } from "./meta";
import type {
    BackendDiffRecord,
    BackendMessage,
    BackendProject,
    BackendThread,
    DiffRecord,
    Message,
    Project,
    Thread,
} from "../types/model";

export function mapProject(project: BackendProject): Project {
    return {
        id: project.id,
        name: project.name,
        workspacePath: project.workspace_path,
        createdAt: project.created_at_ms,
        updatedAt: project.updated_at_ms,
    };
}

export function mapThread(thread: BackendThread): Thread {
    return {
        id: thread.id,
        title: thread.title,
        projectId: thread.project_id,
        createdAt: thread.created_at_ms,
        updatedAt: thread.updated_at_ms,
        messages: [],
        todos: [],
        fileChanges: [],
        totalAdditions: 0,
        totalDeletions: 0,
        unstagedCount: 0,
        stagedCount: 0,
    };
}

export function mapMessage(message: BackendMessage): Message {
    const decoded = decode(message.content);

    return {
        id: message.id,
        role: message.role,
        content: decoded.content,
        reasoning: decoded.metadata?.reasoning,
        timestamp: message.created_at_ms,
        model: message.model || undefined,
        provider: message.provider || undefined,
        mode: message.mode,
        parentId: message.parent_id ?? null,
        tokens: {
            input: message.tokens.input,
            output: message.tokens.output,
            reasoning: message.tokens.reasoning,
            cacheRead: message.tokens.cache_read,
            cacheWrite: message.tokens.cache_write,
        },
        toolCalls: decoded.metadata?.toolCalls,
        todos: decoded.metadata?.todos,
        questions: decoded.metadata?.questions,
    };
}

export function mapDiff(diff: BackendDiffRecord): DiffRecord {
    return {
        id: diff.id,
        threadId: diff.thread_id,
        messageId: diff.message_id ?? null,
        summary: diff.summary ?? null,
        createdAt: diff.created_at_ms,
        files: diff.files.map((file) => ({
            filePath: file.file_path,
            changeType: file.change_type,
            oldContent: file.old_content ?? null,
            newContent: file.new_content ?? null,
        })),
    };
}
