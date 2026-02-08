import { useAppStore } from "@/store/app-store";
import { providerPresets } from "@/lib/ai/providers";
import { SettingsNav } from "@/components/settings/Nav";
import { ModelsSettings } from "@/components/settings/Models";
import { AppearanceSettings } from "@/components/settings/Appearance";
import { useSettingsPage } from "@/components/settings/use";

export function SettingsPage() {
    const { state, dispatch } = useAppStore();
    const vm = useSettingsPage({ state, dispatch });

    return (
        <div className="h-full overflow-y-auto px-6 py-8">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-16">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        Configure model providers and appearance.
                    </p>
                </div>

                <SettingsNav page={vm.page} onChange={vm.setPage} />

                {vm.page === "models" ? (
                    <ModelsSettings
                        providerPresets={providerPresets}
                        availableModels={state.availableModels}
                        apiKeys={state.settings.apiKeys}
                        apiKeyInputByProvider={vm.apiKeyInputByProvider}
                        refreshingByProvider={vm.refreshingByProvider}
                        providerErrorById={vm.providerErrorById}
                        modelSearch={vm.modelSearch}
                        filteredModels={vm.filteredModels}
                        modelProfiles={state.settings.modelProfiles}
                        selectedModelId={state.settings.selectedModelId}
                        onInputChange={(providerId, value) =>
                            vm.setApiKeyInputByProvider((prev) => ({
                                ...prev,
                                [providerId]: value,
                            }))
                        }
                        onSaveApiKey={(providerId) => {
                            void vm.handleSaveApiKey(providerId);
                        }}
                        onRefreshModels={(providerId) => {
                            void vm.handleRefreshModels(providerId);
                        }}
                        onModelSearchChange={vm.setModelSearch}
                        onAddModelProfile={vm.handleAddModelProfile}
                        onSelectModelProfile={vm.handleSelectModelProfile}
                        onRemoveModelProfile={vm.handleRemoveModelProfile}
                    />
                ) : (
                    <AppearanceSettings
                        showWindowControls={state.settings.window.showWindowControls}
                        onToggleWindowControls={vm.handleToggleWindowControls}
                    />
                )}
            </div>
        </div>
    );
}
