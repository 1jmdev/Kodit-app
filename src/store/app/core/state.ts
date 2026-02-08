import type { AppState } from "../../types";
import { defaultModel, mockModels } from "../../mock-data";
import { getModelKey } from "./key";

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
