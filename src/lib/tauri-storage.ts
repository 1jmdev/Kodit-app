import { invoke } from "@tauri-apps/api/core";
import type { Message, Project, Thread } from "@/store/types";

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
    fileChanges: [],
    totalAdditions: 0,
    totalDeletions: 0,
    unstagedCount: 0,
    stagedCount: 0,
  };
}

function mapMessage(message: BackendMessage): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
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
  const message = await invoke<BackendMessage>("add_message", {
    input: {
      thread_id: params.threadId,
      role: params.role,
      content: params.content,
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
