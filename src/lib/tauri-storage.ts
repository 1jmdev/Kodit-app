import { invoke } from "@tauri-apps/api/core";
import type { Message, Project, Thread, ToolCall, TodoItem, Question } from "@/store/types";

type BackendMessageRole = "user" | "agent" | "system";
type BackendMode = "build";

interface BackendTokenUsage {
  input: number;
  output: number;
  reasoning: number;
  cache_read: number;
  cache_write: number;
}

interface BackendProject {
  id: string;
  name: string;
  workspace_path: string;
  created_at_ms: number;
  updated_at_ms: number;
}

interface BackendThread {
  id: string;
  project_id: string;
  title: string;
  mode: BackendMode;
  created_at_ms: number;
  updated_at_ms: number;
}

interface BackendMessage {
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

interface PersistedMessageMetadata {
  version: 1;
  reasoning?: string;
  toolCalls?: ToolCall[];
  todos?: TodoItem[];
  questions?: Question[];
}

const MESSAGE_METADATA_PREFIX = "\n\n[KODIT_META]";
const MESSAGE_METADATA_SUFFIX = "[/KODIT_META]";

function isToolCallStatus(value: unknown): value is ToolCall["status"] {
  return (
    value === "pending" ||
    value === "running" ||
    value === "completed" ||
    value === "failed"
  );
}

function decodeStoredMessageContent(rawContent: string): {
  content: string;
  metadata?: PersistedMessageMetadata;
} {
  const start = rawContent.lastIndexOf(MESSAGE_METADATA_PREFIX);
  if (start < 0) {
    return { content: rawContent };
  }

  const metadataStart = start + MESSAGE_METADATA_PREFIX.length;
  const end = rawContent.indexOf(MESSAGE_METADATA_SUFFIX, metadataStart);
  if (end < 0 || end + MESSAGE_METADATA_SUFFIX.length !== rawContent.length) {
    return { content: rawContent };
  }

  const metadataRaw = rawContent.slice(metadataStart, end);
  try {
    const parsed = JSON.parse(metadataRaw) as Partial<PersistedMessageMetadata>;
    if (parsed.version !== 1) {
      return { content: rawContent };
    }

    const toolCalls = Array.isArray(parsed.toolCalls)
      ? parsed.toolCalls.reduce<ToolCall[]>((acc, toolCall) => {
          if (!toolCall || typeof toolCall !== "object") {
            return acc;
          }
          const candidate = toolCall as Partial<ToolCall>;
          if (
            typeof candidate.id !== "string" ||
            typeof candidate.name !== "string" ||
            typeof candidate.args !== "string" ||
            !isToolCallStatus(candidate.status)
          ) {
            return acc;
          }

          acc.push({
            id: candidate.id,
            name: candidate.name,
            args: candidate.args,
            status: candidate.status,
            result: typeof candidate.result === "string" ? candidate.result : undefined,
          });

          return acc;
        }, [])
      : undefined;

    const todos = Array.isArray(parsed.todos)
      ? parsed.todos.reduce<TodoItem[]>((acc, item) => {
          if (!item || typeof item !== "object") return acc;
          const candidate = item as Partial<TodoItem>;
          if (
            typeof candidate.id !== "string" ||
            typeof candidate.content !== "string" ||
            !["pending", "in_progress", "completed", "cancelled"].includes(candidate.status as string)
          ) {
            return acc;
          }
          acc.push({
            id: candidate.id,
            content: candidate.content,
            status: candidate.status as TodoItem["status"],
            priority: ["high", "medium", "low"].includes(candidate.priority as string)
              ? (candidate.priority as TodoItem["priority"])
              : undefined,
          });
          return acc;
        }, [])
      : undefined;

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.reduce<Question[]>((acc, item) => {
          if (!item || typeof item !== "object") return acc;
          const candidate = item as Partial<Question>;
          if (
            typeof candidate.question !== "string" ||
            typeof candidate.header !== "string" ||
            !Array.isArray(candidate.options)
          ) {
            return acc;
          }
          acc.push({
            question: candidate.question,
            header: candidate.header,
            options: candidate.options,
            multiple: candidate.multiple,
            custom: candidate.custom,
            answers: Array.isArray(candidate.answers) ? candidate.answers : undefined,
          });
          return acc;
        }, [])
      : undefined;

    const metadata: PersistedMessageMetadata = {
      version: 1,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : undefined,
      toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      todos: todos && todos.length > 0 ? todos : undefined,
      questions: questions && questions.length > 0 ? questions : undefined,
    };

    return {
      content: rawContent.slice(0, start),
      metadata,
    };
  } catch {
    return { content: rawContent };
  }
}

function encodeStoredMessageContent(params: {
  content: string;
  reasoning?: string;
  toolCalls?: ToolCall[];
  todos?: TodoItem[];
  questions?: Question[];
}): string {
  const metadata: PersistedMessageMetadata = {
    version: 1,
    reasoning: params.reasoning?.trim() ? params.reasoning : undefined,
    toolCalls: params.toolCalls?.length ? params.toolCalls : undefined,
    todos: params.todos?.length ? params.todos : undefined,
    questions: params.questions?.length ? params.questions : undefined,
  };

  if (!metadata.reasoning && !metadata.toolCalls && !metadata.todos && !metadata.questions) {
    return params.content;
  }

  return `${params.content}${MESSAGE_METADATA_PREFIX}${JSON.stringify(
    metadata,
  )}${MESSAGE_METADATA_SUFFIX}`;
}

export interface AgentReadFileResult {
  path: string;
  content: string;
  startLine: number;
  endLine: number;
  totalLines: number;
  truncated: boolean;
}

export interface AgentWriteFileResult {
  path: string;
  bytesWritten: number;
}

export interface AgentRunCommandResult {
  command: string;
  workdir: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

interface BackendAuthConfig {
  api_keys: Record<string, string>;
}

export interface AuthConfig {
  apiKeys: Record<string, string>;
}

function mapProject(project: BackendProject): Project {
  return {
    id: project.id,
    name: project.name,
    workspacePath: project.workspace_path,
    createdAt: project.created_at_ms,
    updatedAt: project.updated_at_ms,
  };
}

function mapThread(thread: BackendThread): Thread {
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

function mapMessage(message: BackendMessage): Message {
  const decoded = decodeStoredMessageContent(message.content);

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

export async function initializeStorage(): Promise<void> {
  await invoke("storage_info");
}

export async function listProjects(): Promise<Project[]> {
  const projects = await invoke<BackendProject[]>("list_projects");
  return projects.map(mapProject);
}

export async function createProject(params: { name: string; workspacePath: string }): Promise<Project> {
  const created = await invoke<BackendProject>("upsert_project", {
    input: {
      name: params.name,
      workspace_path: params.workspacePath,
    },
  });
  return mapProject(created);
}

export async function createDefaultProjectIfNeeded(): Promise<Project> {
  return createProject({
    name: "Default Project",
    workspacePath: "default-workspace",
  });
}

export async function pickFolder(): Promise<string | null> {
  return invoke<string | null>("pick_folder");
}

export async function listThreads(projectId: string): Promise<Thread[]> {
  const threads = await invoke<BackendThread[]>("list_threads", { projectId });
  return threads.map(mapThread);
}

export async function createThread(params: {
  projectId: string;
  title: string;
  mode?: BackendMode;
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

export async function addMessage(params: {
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
}): Promise<Message> {
  const content = encodeStoredMessageContent({
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

export async function agentReadFile(params: {
  workspacePath: string;
  path: string;
  offset?: number;
  limit?: number;
}): Promise<AgentReadFileResult> {
  const result = await invoke<{
    path: string;
    content: string;
    start_line: number;
    end_line: number;
    total_lines: number;
    truncated: boolean;
  }>("agent_read_file", {
    workspacePath: params.workspacePath,
    path: params.path,
    offset: params.offset,
    limit: params.limit,
  });

  return {
    path: result.path,
    content: result.content,
    startLine: result.start_line,
    endLine: result.end_line,
    totalLines: result.total_lines,
    truncated: result.truncated,
  };
}

export async function agentWriteFile(params: {
  workspacePath: string;
  path: string;
  content: string;
  createDirs?: boolean;
}): Promise<AgentWriteFileResult> {
  const result = await invoke<{
    path: string;
    bytes_written: number;
  }>("agent_write_file", {
    workspacePath: params.workspacePath,
    path: params.path,
    content: params.content,
    createDirs: params.createDirs ?? false,
  });

  return {
    path: result.path,
    bytesWritten: result.bytes_written,
  };
}

export async function agentRunCommand(params: {
  workspacePath: string;
  command: string;
  workdir?: string;
  timeoutMs?: number;
}): Promise<AgentRunCommandResult> {
  const result = await invoke<{
    command: string;
    workdir: string;
    exit_code: number;
    stdout: string;
    stderr: string;
    timed_out: boolean;
  }>("agent_run_command", {
    workspacePath: params.workspacePath,
    command: params.command,
    workdir: params.workdir,
    timeoutMs: params.timeoutMs,
  });

  return {
    command: result.command,
    workdir: result.workdir,
    exitCode: result.exit_code,
    stdout: result.stdout,
    stderr: result.stderr,
    timedOut: result.timed_out,
  };
}

export async function readAuthConfig(): Promise<AuthConfig> {
  const config = await invoke<BackendAuthConfig>("read_auth_config");
  return {
    apiKeys: config.api_keys ?? {},
  };
}

export async function writeAuthConfig(config: AuthConfig): Promise<AuthConfig> {
  const next = await invoke<BackendAuthConfig>("write_auth_config", {
    input: {
      api_keys: config.apiKeys,
    },
  });

  return {
    apiKeys: next.api_keys ?? {},
  };
}
