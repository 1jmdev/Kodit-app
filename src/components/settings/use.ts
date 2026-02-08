import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProviderPreset } from "@/lib/ai/providers";
import { fetchProviderModels, validateProviderApiKey } from "@/lib/ai";
import { saveStoredSettings } from "@/lib/settings-storage";
import { saveAuthApiKey } from "@/lib/auth/auth-storage";
import type { AppAction } from "@/store/app-store";
import type { AppState, ModelConfig } from "@/store/types";
import type { SettingsPageId } from "@/components/settings/Nav";
import { filterModels, getModelKey } from "@/components/settings/utils";

interface UseSettingsPageInput {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}

export function useSettingsPage({ state, dispatch }: UseSettingsPageInput) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [refreshingByProvider, setRefreshingByProvider] = useState<
        Record<string, boolean>
    >({});
    const [providerErrorById, setProviderErrorById] = useState<
        Record<string, string | null>
    >({});
    const [modelSearch, setModelSearch] = useState("");
    const [apiKeyInputByProvider, setApiKeyInputByProvider] = useState<
        Record<string, string>
    >(state.settings.apiKeys);

    const page: SettingsPageId =
        searchParams.get("page") === "appearance" ? "appearance" : "models";
    const filteredModels = useMemo(
        () => filterModels(state.availableModels, modelSearch),
        [modelSearch, state.availableModels],
    );

    function setPage(nextPage: SettingsPageId) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("page", nextPage);
        setSearchParams(nextParams, { replace: true });
    }

    function persistSettings(next: {
        apiKeys?: Record<string, string>;
        window?: typeof state.settings.window;
        modelProfiles?: ModelConfig[];
        selectedModelId?: string;
    }) {
        saveStoredSettings({
            apiKeys: next.apiKeys ?? state.settings.apiKeys,
            window: next.window ?? state.settings.window,
            modelProfiles: next.modelProfiles ?? state.settings.modelProfiles,
            selectedModelId:
                next.selectedModelId ?? state.settings.selectedModelId,
        });
    }

    async function refreshModels(providerId: string, apiKey: string) {
        setRefreshingByProvider((prev) => ({ ...prev, [providerId]: true }));
        setProviderErrorById((prev) => ({ ...prev, [providerId]: null }));

        try {
            const models = await fetchProviderModels(providerId, apiKey);
            const remainingModels = state.availableModels.filter(
                (model) => model.providerId !== providerId,
            );
            dispatch({
                type: "SET_AVAILABLE_MODELS",
                models: [...remainingModels, ...models],
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to load models";
            setProviderErrorById((prev) => ({ ...prev, [providerId]: message }));
        } finally {
            setRefreshingByProvider((prev) => ({ ...prev, [providerId]: false }));
        }
    }

    async function handleSaveApiKey(providerId: string) {
        const preset = getProviderPreset(providerId);
        const apiKey = (apiKeyInputByProvider[providerId] ?? "").trim();
        const validation = validateProviderApiKey(providerId, apiKey);

        if (!validation.success) {
            setProviderErrorById((prev) => ({
                ...prev,
                [providerId]: validation.message || preset.apiKeyHint,
            }));
            return;
        }

        dispatch({ type: "SET_PROVIDER_API_KEY", providerId, apiKey });
        const nextApiKeys = { ...state.settings.apiKeys, [providerId]: apiKey };

        persistSettings({ apiKeys: nextApiKeys });
        await saveAuthApiKey(providerId, apiKey);

        setApiKeyInputByProvider((prev) => ({ ...prev, [providerId]: apiKey }));
        setProviderErrorById((prev) => ({ ...prev, [providerId]: null }));
        await refreshModels(providerId, apiKey);
    }

    async function handleRefreshModels(providerId: string) {
        const apiKey = state.settings.apiKeys[providerId] ?? "";
        const validation = validateProviderApiKey(providerId, apiKey);

        if (!validation.success) {
            setProviderErrorById((prev) => ({
                ...prev,
                [providerId]: validation.message || getProviderPreset(providerId).apiKeyHint,
            }));
            return;
        }

        setProviderErrorById((prev) => ({ ...prev, [providerId]: null }));
        await refreshModels(providerId, apiKey);
    }

    function handleToggleWindowControls(show: boolean) {
        dispatch({ type: "SET_SHOW_WINDOW_CONTROLS", show });
        persistSettings({
            window: { ...state.settings.window, showWindowControls: show },
        });
    }

    function handleAddModelProfile(model: ModelConfig) {
        if (state.settings.modelProfiles.some((p) => getModelKey(p) === getModelKey(model))) {
            return;
        }

        const nextProfiles = [...state.settings.modelProfiles, model];
        const nextSelectedModelId =
            state.settings.selectedModelId || getModelKey(model);

        dispatch({
            type: "SET_MODEL_PROFILES",
            profiles: nextProfiles,
            selectedModelId: nextSelectedModelId,
        });
        persistSettings({
            modelProfiles: nextProfiles,
            selectedModelId: nextSelectedModelId,
        });
    }

    function handleRemoveModelProfile(modelKey: string) {
        if (state.settings.modelProfiles.length <= 1) return;

        const nextProfiles = state.settings.modelProfiles.filter(
            (profile) => getModelKey(profile) !== modelKey,
        );
        const nextSelectedModelId =
            state.settings.selectedModelId === modelKey
                ? getModelKey(nextProfiles[0] ?? state.selectedModel)
                : state.settings.selectedModelId;

        dispatch({
            type: "SET_MODEL_PROFILES",
            profiles: nextProfiles,
            selectedModelId: nextSelectedModelId,
        });
        persistSettings({
            modelProfiles: nextProfiles,
            selectedModelId: nextSelectedModelId,
        });
    }

    function handleSelectModelProfile(model: ModelConfig) {
        dispatch({ type: "SET_MODEL", model });
        persistSettings({ selectedModelId: getModelKey(model) });
    }

    return {
        page,
        setPage,
        modelSearch,
        setModelSearch,
        filteredModels,
        refreshingByProvider,
        providerErrorById,
        apiKeyInputByProvider,
        setApiKeyInputByProvider,
        handleSaveApiKey,
        handleRefreshModels,
        handleToggleWindowControls,
        handleAddModelProfile,
        handleRemoveModelProfile,
        handleSelectModelProfile,
    };
}
