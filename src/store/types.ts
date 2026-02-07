export type MessageRole = "user" | "agent" | "system";

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
  model?: string;
  provider?: string;
  mode?: "build";
  parentId?: string | null;
  tokens?: {
    input: number;
    output: number;
    reasoning: number;
    cacheRead: number;
    cacheWrite: number;
  };
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
  projectId: string;
  messages: Message[];
  fileChanges: FileChange[];
  createdAt: number;
  updatedAt: number;
  totalAdditions: number;
  totalDeletions: number;
  unstagedCount: number;
  stagedCount: number;
}

export interface Project {
  id: string;
  name: string;
  workspacePath: string;
  createdAt: number;
  updatedAt: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  qualityLevel: "Low" | "Medium" | "High" | "Extra High";
}

export interface WindowSettings {
  showWindowControls: boolean;
}

export interface SettingsConfig {
  openRouterApiKey: string;
  window: WindowSettings;
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
  storageLoading: boolean;
  storageError: string | null;
  sidebarCollapsed: boolean;
  diffPanelOpen: boolean;
}
