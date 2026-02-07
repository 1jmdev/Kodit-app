import { createContext, useContext } from "react";
import type { AppState, Thread, Message, ModelConfig, WindowSettings } from "./types";
import { mockModels, defaultModel } from "./mock-data";

export const initialState: AppState = {
  threads: [],
  activeThreadId: null,
  projects: [],
  activeProjectId: null,
  availableModels: mockModels,
  selectedModel: defaultModel,
  settings: {
    openRouterApiKey: "",
    window: {
      showWindowControls: true,
      windowControlsPosition: "right",
    },
  },
  modelsLoading: false,
  modelsError: null,
  storageLoading: true,
  storageError: null,
  sidebarCollapsed: false,
  diffPanelOpen: true,
};

export type AppAction =
  | { type: "SET_STORAGE_LOADING"; loading: boolean }
  | { type: "SET_STORAGE_ERROR"; error: string | null }
  | { type: "SET_PROJECTS"; projects: AppState["projects"] }
  | { type: "SET_THREADS"; threads: Thread[] }
  | { type: "SET_THREAD_MESSAGES"; threadId: string; messages: Message[] }
  | { type: "UPSERT_THREAD"; thread: Thread }
  | { type: "REPLACE_MESSAGE"; threadId: string; messageId: string; nextMessage: Message }
  | { type: "SET_ACTIVE_THREAD"; threadId: string | null }
  | { type: "DELETE_THREAD"; threadId: string }
  | { type: "ADD_MESSAGE"; threadId: string; message: Message }
  | {
      type: "UPDATE_MESSAGE";
      threadId: string;
      messageId: string;
      content: string;
      isStreaming?: boolean;
    }
  | { type: "SET_ACTIVE_PROJECT"; projectId: string }
  | { type: "SET_AVAILABLE_MODELS"; models: ModelConfig[] }
  | { type: "SET_OPENROUTER_API_KEY"; apiKey: string }
  | { type: "SET_MODELS_LOADING"; loading: boolean }
  | { type: "SET_MODELS_ERROR"; error: string | null }
  | { type: "SET_MODEL"; model: ModelConfig }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "TOGGLE_DIFF_PANEL" }
  | { type: "SET_DIFF_PANEL"; open: boolean }
  | { type: "SET_WINDOW_SETTINGS"; settings: WindowSettings }
  | { type: "SET_WINDOW_CONTROLS_POSITION"; position: "left" | "right" }
  | { type: "SET_SHOW_WINDOW_CONTROLS"; show: boolean };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_STORAGE_LOADING":
      return { ...state, storageLoading: action.loading };
    case "SET_STORAGE_ERROR":
      return { ...state, storageError: action.error };
    case "SET_PROJECTS":
      return { ...state, projects: action.projects };
    case "SET_THREADS":
      return { ...state, threads: action.threads };
    case "SET_THREAD_MESSAGES":
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === action.threadId
            ? {
                ...thread,
                messages: action.messages,
                updatedAt:
                  action.messages.length > 0
                    ? action.messages[action.messages.length - 1].timestamp
                    : thread.updatedAt,
              }
            : thread,
        ),
      };
    case "UPSERT_THREAD": {
      const existing = state.threads.find((t) => t.id === action.thread.id);
      if (!existing) {
        return { ...state, threads: [action.thread, ...state.threads] };
      }
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === action.thread.id ? action.thread : thread
        ),
      };
    }
    case "REPLACE_MESSAGE":
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === action.threadId
            ? {
                ...thread,
                messages: thread.messages.map((message) =>
                  message.id === action.messageId ? action.nextMessage : message
                ),
                updatedAt: action.nextMessage.timestamp,
              }
            : thread
        ),
      };
    case "SET_ACTIVE_THREAD":
      return { ...state, activeThreadId: action.threadId };
    case "DELETE_THREAD":
      return {
        ...state,
        threads: state.threads.filter((t) => t.id !== action.threadId),
        activeThreadId:
          state.activeThreadId === action.threadId
            ? null
            : state.activeThreadId,
      };
    case "ADD_MESSAGE": {
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId
            ? { ...t, messages: [...t.messages, action.message], updatedAt: Date.now() }
            : t
        ),
      };
    }
    case "UPDATE_MESSAGE": {
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId
            ? {
                ...t,
                updatedAt: Date.now(),
                messages: t.messages.map((m) =>
                  m.id === action.messageId
                    ? {
                        ...m,
                        content: action.content,
                        isStreaming: action.isStreaming,
                      }
                    : m,
                ),
              }
            : t,
        ),
      };
    }
    case "SET_ACTIVE_PROJECT":
      return { ...state, activeProjectId: action.projectId, activeThreadId: null };
    case "SET_AVAILABLE_MODELS": {
      if (action.models.length === 0) {
        return state;
      }

      const selectedModel = action.models.find((model) => model.id === state.selectedModel.id) || action.models[0];
      return {
        ...state,
        availableModels: action.models,
        selectedModel,
      };
    }
    case "SET_OPENROUTER_API_KEY":
      return {
        ...state,
        settings: {
          ...state.settings,
          openRouterApiKey: action.apiKey,
        },
      };
    case "SET_MODELS_LOADING":
      return { ...state, modelsLoading: action.loading };
    case "SET_MODELS_ERROR":
      return { ...state, modelsError: action.error };
    case "SET_MODEL":
      return { ...state, selectedModel: action.model };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case "TOGGLE_DIFF_PANEL":
      return { ...state, diffPanelOpen: !state.diffPanelOpen };
    case "SET_DIFF_PANEL":
      return { ...state, diffPanelOpen: action.open };
    case "SET_WINDOW_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, window: action.settings },
      };
    case "SET_WINDOW_CONTROLS_POSITION":
      return {
        ...state,
        settings: {
          ...state.settings,
          window: { ...state.settings.window, windowControlsPosition: action.position },
        },
      };
    case "SET_SHOW_WINDOW_CONTROLS":
      return {
        ...state,
        settings: {
          ...state.settings,
          window: { ...state.settings.window, showWindowControls: action.show },
        },
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextType>({
  state: initialState,
  dispatch: () => {},
});

export function useAppStore() {
  return useContext(AppContext);
}
