import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_PROVIDER_ID, getProviderPreset, providerPresets } from "@/lib/ai/providers";
import { fetchProviderModels, validateProviderApiKey } from "@/lib/ai";
import { saveStoredSettings } from "@/lib/settings-storage";
import { saveAuthApiKey } from "@/lib/auth/auth-storage";

export function SettingsPage() {
  const { state, dispatch } = useAppStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [apiKeyInputByProvider, setApiKeyInputByProvider] = useState<Record<string, string>>(
    state.settings.apiKeys,
  );

  const activeProvider = useMemo(() => getProviderPreset(DEFAULT_PROVIDER_ID), []);

  async function refreshModels(providerId: string, apiKey: string) {
    dispatch({ type: "SET_MODELS_LOADING", loading: true });
    dispatch({ type: "SET_MODELS_ERROR", error: null });

    try {
      const models = await fetchProviderModels(providerId, apiKey);
      dispatch({ type: "SET_AVAILABLE_MODELS", models });
      dispatch({ type: "SET_MODELS_ERROR", error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load models";
      dispatch({ type: "SET_MODELS_ERROR", error: message });
    } finally {
      dispatch({ type: "SET_MODELS_LOADING", loading: false });
    }
  }

  async function handleSaveApiKey(providerId: string) {
    const preset = getProviderPreset(providerId);
    const apiKey = (apiKeyInputByProvider[providerId] ?? "").trim();
    const validation = validateProviderApiKey(providerId, apiKey);

    if (!validation.success) {
      setLocalError(validation.message || preset.apiKeyHint);
      return;
    }

    dispatch({ type: "SET_PROVIDER_API_KEY", providerId, apiKey });

    const nextApiKeys = {
      ...state.settings.apiKeys,
      [providerId]: apiKey,
    };

    saveStoredSettings({
      apiKeys: nextApiKeys,
      window: state.settings.window,
    });

    await saveAuthApiKey(providerId, apiKey);

    setApiKeyInputByProvider((prev) => ({
      ...prev,
      [providerId]: apiKey,
    }));

    setLocalError(null);
    if (providerId === DEFAULT_PROVIDER_ID) {
      await refreshModels(providerId, apiKey);
    }
  }

  async function handleRefreshModels() {
    const providerId = DEFAULT_PROVIDER_ID;
    const apiKey = state.settings.apiKeys[providerId] ?? "";
    const validation = validateProviderApiKey(providerId, apiKey);

    if (!validation.success) {
      setLocalError(validation.message || getProviderPreset(providerId).apiKeyHint);
      return;
    }

    setLocalError(null);
    await refreshModels(providerId, apiKey);
  }

  function handleToggleWindowControls(show: boolean) {
    dispatch({ type: "SET_SHOW_WINDOW_CONTROLS", show });
    saveStoredSettings({
      apiKeys: state.settings.apiKeys,
      window: { ...state.settings.window, showWindowControls: show },
    });
  }

  return (
    <div className="flex flex-1 overflow-auto px-6 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure provider presets, sync models, and customize your workspace.
          </p>
        </div>

        <Card>
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

        {providerPresets.map((preset) => (
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
                <div className="flex gap-2">
                  <Input
                    id={`${preset.id}-api-key`}
                    value={apiKeyInputByProvider[preset.id] ?? state.settings.apiKeys[preset.id] ?? ""}
                    onChange={(event) =>
                      setApiKeyInputByProvider((prev) => ({
                        ...prev,
                        [preset.id]: event.target.value,
                      }))
                    }
                    placeholder={preset.id === "openrouter" ? "sk-or-v1-..." : "Enter API key"}
                    autoComplete="off"
                    spellCheck={false}
                    type="password"
                  />
                  <Button onClick={() => void handleSaveApiKey(preset.id)} disabled={state.modelsLoading}>
                    Save key
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{preset.apiKeyHint}</p>
                {(localError || state.modelsError) && (
                  <p className="text-xs text-destructive">{localError || state.modelsError}</p>
                )}
              </div>

              {preset.id === activeProvider.id && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void handleRefreshModels()}
                    disabled={state.modelsLoading}
                  >
                    {state.modelsLoading ? "Refreshing models..." : "Refresh models"}
                  </Button>
                  <Badge variant="outline">{state.availableModels.length} models loaded</Badge>
                  <Badge variant="outline">Selected: {state.selectedModel.name}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Available Models</CardTitle>
            <CardDescription>
              The prompt composer uses this list when you choose a model for generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {state.availableModels.slice(0, 30).map((model) => (
                <div
                  key={model.id}
                  className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div className="truncate text-sm font-medium">{model.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{model.id}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
