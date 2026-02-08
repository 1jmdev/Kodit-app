import type { AppState } from "../../types";
import type { AppAction } from "../core/action";
import { getModelKey } from "../core/key";

export function appReducer2(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case "SET_ACTIVE_PROJECT":
            return {
                ...state,
                activeProjectId: action.projectId,
                activeThreadId: (() => {
                    if (!state.activeThreadId) return null;
                    const activeThread = state.threads.find(
                        (thread) => thread.id === state.activeThreadId,
                    );
                    if (!activeThread) return null;
                    return activeThread.projectId === action.projectId
                        ? state.activeThreadId
                        : null;
                })(),
            };
        case "SET_AVAILABLE_MODELS":
            return { ...state, availableModels: action.models };
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
            const deduped = action.profiles.filter(
                (model, index, models) =>
                    models.findIndex(
                        (candidate) => getModelKey(candidate) === getModelKey(model),
                    ) === index,
            );
            const selectedId = action.selectedModelId ?? state.settings.selectedModelId;
            const selected =
                deduped.find((model) => getModelKey(model) === selectedId) ??
                deduped[0] ??
                state.selectedModel;

            return {
                ...state,
                selectedModel: selected,
                settings: {
                    ...state.settings,
                    modelProfiles: deduped,
                    selectedModelId: getModelKey(selected),
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
                    window: {
                        ...state.settings.window,
                        showWindowControls: action.show,
                    },
                },
            };
        default:
            return state;
    }
}
