import { createContext, useContext } from "react";
import type { AppState, Thread, Message, ModelConfig, WindowSettings, TodoItem, Question } from "./types";
import { mockModels, defaultModel } from "./mock-data";

function getModelKey(model: ModelConfig): string {
  return `${model.providerId}:${model.id}`;
}

export const initialState: AppState = {
  threads: [],
  activeThreadId: null,
  projects: [],
  activeProjectId: null,
  availableModels: mockModels,
  selectedModel: defaultModel,
  settings: {
    apiKeys: {},
    window: {
      showWindowControls: true,
    },
    modelProfiles: [defaultModel],
    selectedModelId: getModelKey(defaultModel),
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
  | { type: "SET_MODEL_PROFILES"; profiles: ModelConfig[]; selectedModelId?: string }
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
                  message.id === action.messageId
                    ? {
                        ...action.nextMessage,
                        toolCalls: action.nextMessage.toolCalls ?? message.toolCalls,
                      }
                    : message
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
            ? { ...t, messages: [...t.messages, action.message], updatedAt: action.message.timestamp }
            : t
        ),
      };
    }
    case "SET_THREAD_TODOS":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId
            ? { ...t, todos: action.todos }
            : t
        ),
      };
    case "UPDATE_MESSAGE": {
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === action.messageId
                    ? {
                        ...m,
                        content: action.content ?? m.content,
                        reasoning: action.reasoning ?? m.reasoning,
                        isStreaming: action.isStreaming ?? m.isStreaming,
                        toolCalls: action.toolCalls ?? m.toolCalls,
                        todos: action.todos ?? m.todos,
                        questions: action.questions ?? m.questions,
                      }
                    : m,
                ),
              }
            : t,
        ),
      };
    }
    case "SET_ACTIVE_PROJECT":
      return {
        ...state,
        activeProjectId: action.projectId,
        activeThreadId: (() => {
          if (!state.activeThreadId) {
            return null;
          }
          const activeThread = state.threads.find((thread) => thread.id === state.activeThreadId);
          if (!activeThread) {
            return null;
          }
          return activeThread.projectId === action.projectId ? state.activeThreadId : null;
        })(),
      };
    case "SET_AVAILABLE_MODELS": {
      return {
        ...state,
        availableModels: action.models,
      };
    }
    case "SET_PROVIDER_API_KEY":
      return {
        ...state,
        settings: {
          ...state.settings,
          apiKeys: {
            ...state.settings.apiKeys,
            [action.providerId]: action.apiKey,
          },
        },
      };
    case "SET_MODEL_PROFILES": {
      const dedupedProfiles = action.profiles.filter(
        (model, index, models) =>
          models.findIndex((candidate) => getModelKey(candidate) === getModelKey(model)) === index,
      );
      const nextSelectedModelId = action.selectedModelId ?? state.settings.selectedModelId;
      const selectedModel =
        dedupedProfiles.find((model) => getModelKey(model) === nextSelectedModelId) ??
        dedupedProfiles[0] ??
        state.selectedModel;

      return {
        ...state,
        selectedModel,
        settings: {
          ...state.settings,
          modelProfiles: dedupedProfiles,
          selectedModelId: getModelKey(selectedModel),
        },
      };
    }
    case "SET_MODELS_LOADING":
      return { ...state, modelsLoading: action.loading };
    case "SET_MODELS_ERROR":
      return { ...state, modelsError: action.error };
    case "SET_MODEL":
      return {
        ...state,
        selectedModel: action.model,
        settings: {
          ...state.settings,
          selectedModelId: getModelKey(action.model),
        },
      };
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
          window: { ...state.settings.window },
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
