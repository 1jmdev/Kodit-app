export type MessageRole = "user" | "assistant" | "system";

export interface FileEdit {
  id: string;
  filePath: string;
  additions: number;
  deletions: number;
  status: "edited" | "created" | "deleted";
}

export interface DiffHunk {
  filePath: string;
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "context" | "addition" | "deletion" | "header";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface FileChange {
  filePath: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  collapsed?: boolean;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  fileEdits?: FileEdit[];
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: string;
  result?: string;
  status: "pending" | "running" | "completed" | "failed";
}

export interface Thread {
  id: string;
  title: string;
  projectName: string;
  messages: Message[];
  fileChanges: FileChange[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  totalAdditions: number;
  totalDeletions: number;
  unstagedCount: number;
  stagedCount: number;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  branch: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  qualityLevel: "Low" | "Medium" | "High" | "Extra High";
}

export interface SettingsConfig {
  openRouterApiKey: string;
}

export interface AppState {
  threads: Thread[];
  activeThreadId: string | null;
  projects: Project[];
  activeProjectId: string | null;
  availableModels: ModelConfig[];
  selectedModel: ModelConfig;
  settings: SettingsConfig;
  modelsLoading: boolean;
  modelsError: string | null;
  sidebarCollapsed: boolean;
  diffPanelOpen: boolean;
}
