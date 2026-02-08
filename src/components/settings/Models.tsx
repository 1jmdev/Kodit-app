import type { ProviderPreset } from "@/lib/ai/types";
import type { ModelConfig } from "@/store/types";
import { ProvidersSettings } from "@/components/settings/Providers";
import { ProfilesSettings } from "@/components/settings/Profiles";

interface ModelsSettingsProps {
    providerPresets: ProviderPreset[];
    availableModels: ModelConfig[];
    apiKeys: Record<string, string>;
    apiKeyInputByProvider: Record<string, string>;
    refreshingByProvider: Record<string, boolean>;
    providerErrorById: Record<string, string | null>;
    modelSearch: string;
    filteredModels: ModelConfig[];
    modelProfiles: ModelConfig[];
    selectedModelId: string;
    onInputChange: (providerId: string, value: string) => void;
    onSaveApiKey: (providerId: string) => void;
    onRefreshModels: (providerId: string) => void;
    onModelSearchChange: (value: string) => void;
    onAddModelProfile: (model: ModelConfig) => void;
    onSelectModelProfile: (model: ModelConfig) => void;
    onRemoveModelProfile: (modelKey: string) => void;
}

export function ModelsSettings(props: ModelsSettingsProps) {
    return (
        <>
            <ProvidersSettings
                providerPresets={props.providerPresets}
                availableModels={props.availableModels}
                apiKeys={props.apiKeys}
                apiKeyInputByProvider={props.apiKeyInputByProvider}
                refreshingByProvider={props.refreshingByProvider}
                providerErrorById={props.providerErrorById}
                onInputChange={props.onInputChange}
                onSaveApiKey={props.onSaveApiKey}
                onRefreshModels={props.onRefreshModels}
            />
            <ProfilesSettings
                modelSearch={props.modelSearch}
                filteredModels={props.filteredModels}
                modelProfiles={props.modelProfiles}
                selectedModelId={props.selectedModelId}
                onModelSearchChange={props.onModelSearchChange}
                onAddModelProfile={props.onAddModelProfile}
                onSelectModelProfile={props.onSelectModelProfile}
                onRemoveModelProfile={props.onRemoveModelProfile}
            />
        </>
    );
}
