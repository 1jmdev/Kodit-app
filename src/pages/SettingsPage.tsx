import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { ModelConfig } from "@/store/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getProviderPreset, providerPresets } from "@/lib/ai/providers";
import { fetchProviderModels, validateProviderApiKey } from "@/lib/ai";
import { saveStoredSettings } from "@/lib/settings-storage";
import { saveAuthApiKey } from "@/lib/auth/auth-storage";

export function SettingsPage() {
  const { state, dispatch } = useAppStore();
  const [refreshingByProvider, setRefreshingByProvider] = useState<Record<string, boolean>>({});
  const [providerErrorById, setProviderErrorById] = useState<Record<string, string | null>>({});
  const [modelSearch, setModelSearch] = useState("");
  const [apiKeyInputByProvider, setApiKeyInputByProvider] = useState<Record<string, string>>(
    state.settings.apiKeys,
  );

  function getModelKey(model: ModelConfig): string {
    return `${model.providerId}:${model.id}`;
  }

  function fuzzyScore(needle: string, haystack: string): number {
    if (!needle) {
      return 0;
    }

    let score = 0;
    let haystackIndex = 0;
    let previousMatchIndex = -1;

    for (let i = 0; i < needle.length; i += 1) {
      const char = needle[i];
      const foundIndex = haystack.indexOf(char, haystackIndex);
      if (foundIndex === -1) {
        return Number.NEGATIVE_INFINITY;
      }

      score += 1;
      if (previousMatchIndex !== -1 && foundIndex === previousMatchIndex + 1) {
        score += 2;
      }
      if (foundIndex === 0 || haystack[foundIndex - 1] === " " || haystack[foundIndex - 1] === "/" || haystack[foundIndex - 1] === "-") {
        score += 1;
      }

      previousMatchIndex = foundIndex;
      haystackIndex = foundIndex + 1;
    }

    return score;
  }

  const filteredModels = useMemo(() => {
    const query = modelSearch.trim().toLowerCase();
    if (!query) {
      return [];
    }
    const terms = query.split(/\s+/).filter(Boolean);

    return state.availableModels
      .map((model) => {
        const searchable = `${model.name} ${model.id} ${model.provider}`.toLowerCase();
        let score = 0;
        for (const term of terms) {
          const termScore = fuzzyScore(term, searchable);
          if (!Number.isFinite(termScore)) {
            return { model, score: Number.NEGATIVE_INFINITY };
          }
          score += termScore;
          if (searchable.includes(term)) {
            score += 3;
          }
        }

        return {
          model,
          score,
        };
      })
      .filter((entry) => Number.isFinite(entry.score))
      .sort((a, b) => b.score - a.score || a.model.name.localeCompare(b.model.name))
      .map((entry) => entry.model)
      .slice(0, 20);
  }, [modelSearch, state.availableModels]);

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
      selectedModelId: next.selectedModelId ?? state.settings.selectedModelId,
    });
  }

  async function refreshModels(providerId: string, apiKey: string) {
    setRefreshingByProvider((prev) => ({ ...prev, [providerId]: true }));
    setProviderErrorById((prev) => ({ ...prev, [providerId]: null }));

    try {
      const models = await fetchProviderModels(providerId, apiKey);
      const remainingModels = state.availableModels.filter((model) => model.providerId !== providerId);
      dispatch({ type: "SET_AVAILABLE_MODELS", models: [...remainingModels, ...models] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load models";
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
      setProviderErrorById((prev) => ({ ...prev, [providerId]: validation.message || preset.apiKeyHint }));
      return;
    }

    dispatch({ type: "SET_PROVIDER_API_KEY", providerId, apiKey });

    const nextApiKeys = {
      ...state.settings.apiKeys,
      [providerId]: apiKey,
    };

    persistSettings({ apiKeys: nextApiKeys });

    await saveAuthApiKey(providerId, apiKey);

    setApiKeyInputByProvider((prev) => ({
      ...prev,
      [providerId]: apiKey,
    }));

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
    persistSettings({ window: { ...state.settings.window, showWindowControls: show } });
  }

  function handleAddModelProfile(model: ModelConfig) {
    if (state.settings.modelProfiles.some((profile) => getModelKey(profile) === getModelKey(model))) {
      return;
    }

    const nextProfiles = [...state.settings.modelProfiles, model];
    const nextSelectedModelId = state.settings.selectedModelId || getModelKey(model);

    dispatch({
      type: "SET_MODEL_PROFILES",
      profiles: nextProfiles,
      selectedModelId: nextSelectedModelId,
    });
    persistSettings({ modelProfiles: nextProfiles, selectedModelId: nextSelectedModelId });
  }

  function handleRemoveModelProfile(modelKey: string) {
    if (state.settings.modelProfiles.length <= 1) {
      return;
    }

    const nextProfiles = state.settings.modelProfiles.filter((profile) => getModelKey(profile) !== modelKey);
    const nextSelectedModelId =
      state.settings.selectedModelId === modelKey
        ? getModelKey(nextProfiles[0] ?? state.selectedModel)
        : state.settings.selectedModelId;

    dispatch({
      type: "SET_MODEL_PROFILES",
      profiles: nextProfiles,
      selectedModelId: nextSelectedModelId,
    });
    persistSettings({ modelProfiles: nextProfiles, selectedModelId: nextSelectedModelId });
  }

  function handleSelectModelProfile(model: ModelConfig) {
    dispatch({ type: "SET_MODEL", model });
    persistSettings({ selectedModelId: getModelKey(model) });
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-16">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure provider presets, model profiles, and your workspace behavior.
          </p>
        </div>

        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Window Controls</CardTitle>
            <CardDescription>
              Customize how window controls (minimize, maximize, close) appear in the title bar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show window controls</Label>
                <p className="text-xs text-muted-foreground">
                  Display minimize, maximize, and close buttons
                </p>
              </div>
              <Switch
                checked={state.settings.window.showWindowControls}
                onCheckedChange={handleToggleWindowControls}
              />
            </div>
          </CardContent>
        </Card>

        {providerPresets.map((preset) => {
          const providerModels = state.availableModels.filter((model) => model.providerId === preset.id);

          return (
          <Card key={preset.id}>
            <CardHeader>
              <CardTitle>{preset.label}</CardTitle>
              <CardDescription>
                API keys are stored in <code>~/.config/com.1jmdev.kodit/auth.json</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${preset.id}-api-key`}>API key</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id={`${preset.id}-api-key`}
                    value={apiKeyInputByProvider[preset.id] ?? state.settings.apiKeys[preset.id] ?? ""}
                    onChange={(event) =>
                      setApiKeyInputByProvider((prev) => ({
                        ...prev,
                        [preset.id]: event.target.value,
                      }))
                    }
                    placeholder={
                      preset.id === "openrouter"
                        ? "sk-or-v1-..."
                        : preset.id === "openai"
                          ? "sk-..."
                          : preset.id === "gemini"
                            ? "AIza..."
                            : "Enter API key"
                    }
                    autoComplete="off"
                    spellCheck={false}
                    type="password"
                  />
                  <Button
                    className="sm:shrink-0"
                    onClick={() => void handleSaveApiKey(preset.id)}
                    disabled={refreshingByProvider[preset.id]}
                  >
                    Save key
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{preset.apiKeyHint}</p>
                {providerErrorById[preset.id] && (
                  <p className="text-xs text-destructive">{providerErrorById[preset.id]}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void handleRefreshModels(preset.id)}
                    disabled={refreshingByProvider[preset.id]}
                  >
                    {refreshingByProvider[preset.id] ? "Refreshing models..." : `Refresh ${preset.label} models`}
                  </Button>
                  <Badge variant="outline">{providerModels.length} synced models</Badge>
                </div>

                <div className="max-h-36 overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2">
                  {providerModels.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-muted-foreground">No synced models for this provider yet.</p>
                  ) : (
                    providerModels.slice(0, 30).map((model) => (
                      <div key={getModelKey(model)} className="truncate px-2 py-1 text-xs text-muted-foreground">
                        {model.id}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}

        <Card>
          <CardHeader>
            <CardTitle>Model Profiles</CardTitle>
            <CardDescription>
              The model selector now shows only profiles defined here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-search">Search synced models</Label>
              <Input
                id="model-search"
                value={modelSearch}
                onChange={(event) => setModelSearch(event.target.value)}
                placeholder="Search by model name or id"
              />
              <div className="max-h-[15.5rem] overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2">
                {modelSearch.trim().length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">
                    Enter a search query and add models as profiles.
                  </p>
                )}

                {modelSearch.trim().length > 0 && filteredModels.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">No matching models found.</p>
                )}

                {filteredModels.map((model) => {
                  const exists = state.settings.modelProfiles.some(
                    (profile) => getModelKey(profile) === getModelKey(model),
                  );
                  return (
                    <div
                      key={getModelKey(model)}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-background/40"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{model.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{model.id}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={exists}
                        onClick={() => handleAddModelProfile(model)}
                      >
                        {exists ? "Added" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Configured profiles</Label>
              <div className="space-y-2">
                {state.settings.modelProfiles.map((profile) => {
                  const profileKey = getModelKey(profile);
                  const isSelected = state.settings.selectedModelId === profileKey;
                  return (
                    <div
                      key={profileKey}
                      className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/10 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{profile.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{profile.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleSelectModelProfile(profile)}
                        >
                          {isSelected ? "Using" : "Use"}
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleRemoveModelProfile(profileKey)}
                          disabled={state.settings.modelProfiles.length <= 1}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
