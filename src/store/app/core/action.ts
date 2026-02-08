import type {
    AppState,
    FileChange,
    Message,
    ModelConfig,
    Question,
    Thread,
    TodoItem,
    WindowSettings,
} from "../../types";

export type AppAction =
    | { type: "SET_STORAGE_LOADING"; loading: boolean }
    | { type: "SET_STORAGE_ERROR"; error: string | null }
    | { type: "SET_PROJECTS"; projects: AppState["projects"] }
    | { type: "SET_THREADS"; threads: Thread[] }
    | { type: "SET_THREAD_MESSAGES"; threadId: string; messages: Message[] }
    | {
          type: "SET_THREAD_DIFF_STATE";
          threadId: string;
          fileChanges: FileChange[];
          totalAdditions: number;
          totalDeletions: number;
          unstagedCount: number;
          stagedCount: number;
      }
    | { type: "UPSERT_THREAD"; thread: Thread }
    | {
          type: "REPLACE_MESSAGE";
          threadId: string;
          messageId: string;
          nextMessage: Message;
      }
    | { type: "SET_ACTIVE_THREAD"; threadId: string | null }
    | { type: "DELETE_THREAD"; threadId: string }
    | { type: "ADD_MESSAGE"; threadId: string; message: Message }
    | { type: "SET_THREAD_TODOS"; threadId: string; todos: TodoItem[] }
    | {
          type: "UPDATE_MESSAGE";
          threadId: string;
          messageId: string;
          content?: string;
          reasoning?: string;
          isStreaming?: boolean;
          toolCalls?: Message["toolCalls"];
          todos?: TodoItem[];
          questions?: Question[];
      }
    | { type: "SET_ACTIVE_PROJECT"; projectId: string }
    | { type: "SET_AVAILABLE_MODELS"; models: ModelConfig[] }
    | { type: "SET_PROVIDER_API_KEY"; providerId: string; apiKey: string }
    | {
          type: "SET_MODEL_PROFILES";
          profiles: ModelConfig[];
          selectedModelId?: string;
      }
    | { type: "SET_MODELS_LOADING"; loading: boolean }
    | { type: "SET_MODELS_ERROR"; error: string | null }
    | { type: "SET_MODEL"; model: ModelConfig }
    | { type: "TOGGLE_SIDEBAR" }
    | { type: "TOGGLE_DIFF_PANEL" }
    | { type: "SET_DIFF_PANEL"; open: boolean }
    | { type: "SET_WINDOW_SETTINGS"; settings: WindowSettings }
    | { type: "SET_WINDOW_CONTROLS_POSITION"; position: "left" | "right" }
    | { type: "SET_SHOW_WINDOW_CONTROLS"; show: boolean };
