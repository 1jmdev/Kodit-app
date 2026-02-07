import { createContext, useContext } from "react";
import type { AppState, Thread, Message, ModelConfig } from "./types";
import { mockThreads, mockProjects, mockModels, defaultModel } from "./mock-data";

export const initialState: AppState = {
  threads: mockThreads,
  activeThreadId: "thread-1",
  projects: mockProjects,
  activeProjectId: "proj-1",
  availableModels: mockModels,
  selectedModel: defaultModel,
  settings: {
    openRouterApiKey: "",
  },
  modelsLoading: false,
  modelsError: null,
  sidebarCollapsed: false,
  diffPanelOpen: true,
};

export type AppAction =
  | { type: "SET_ACTIVE_THREAD"; threadId: string | null }
  | { type: "CREATE_THREAD"; thread: Thread }
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
  | { type: "SET_DIFF_PANEL"; open: boolean };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ACTIVE_THREAD":
      return { ...state, activeThreadId: action.threadId };
    case "CREATE_THREAD":
      return {
        ...state,
        threads: [action.thread, ...state.threads],
        activeThreadId: action.thread.id,
      };
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
      return { ...state, activeProjectId: action.projectId };
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
