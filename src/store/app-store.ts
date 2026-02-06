import { createContext, useContext } from "react";
import type { AppState, Thread, Message, ModelConfig } from "./types";
import { mockThreads, mockProjects, defaultModel } from "./mock-data";

export const initialState: AppState = {
  threads: mockThreads,
  activeThreadId: "thread-1",
  projects: mockProjects,
  activeProjectId: "proj-1",
  selectedModel: defaultModel,
  sidebarCollapsed: false,
  diffPanelOpen: true,
};

export type AppAction =
  | { type: "SET_ACTIVE_THREAD"; threadId: string | null }
  | { type: "CREATE_THREAD"; thread: Thread }
  | { type: "DELETE_THREAD"; threadId: string }
  | { type: "ADD_MESSAGE"; threadId: string; message: Message }
  | { type: "SET_ACTIVE_PROJECT"; projectId: string }
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
    case "SET_ACTIVE_PROJECT":
      return { ...state, activeProjectId: action.projectId };
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
