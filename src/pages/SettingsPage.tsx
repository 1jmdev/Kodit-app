import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchOpenRouterModels,
  OPENROUTER_API_KEY_HINT,
  validateOpenRouterApiKey,
} from "@/lib/openrouter";
import { saveStoredSettings } from "@/lib/settings-storage";

export function SettingsPage() {
  const { state, dispatch } = useAppStore();
  const [apiKeyInput, setApiKeyInput] = useState(state.settings.openRouterApiKey);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setApiKeyInput(state.settings.openRouterApiKey);
  }, [state.settings.openRouterApiKey]);

  async function refreshModels(apiKey: string) {
    dispatch({ type: "SET_MODELS_LOADING", loading: true });
    dispatch({ type: "SET_MODELS_ERROR", error: null });

    try {
      const models = await fetchOpenRouterModels(apiKey);
      dispatch({ type: "SET_AVAILABLE_MODELS", models });
      dispatch({ type: "SET_MODELS_ERROR", error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load models";
      dispatch({ type: "SET_MODELS_ERROR", error: message });
    } finally {
      dispatch({ type: "SET_MODELS_LOADING", loading: false });
    }
  }

  async function handleSaveApiKey() {
    const validation = validateOpenRouterApiKey(apiKeyInput);
    if (!validation.success) {
      setLocalError(validation.error.issues[0]?.message || OPENROUTER_API_KEY_HINT);
      return;
    }

    const apiKey = apiKeyInput.trim();
    dispatch({ type: "SET_OPENROUTER_API_KEY", apiKey });
    saveStoredSettings({ openRouterApiKey: apiKey });
    setLocalError(null);
    await refreshModels(apiKey);
  }

  async function handleRefreshModels() {
    const validation = validateOpenRouterApiKey(state.settings.openRouterApiKey);
    if (!validation.success) {
      setLocalError(OPENROUTER_API_KEY_HINT);
      return;
    }

    setLocalError(null);
    await refreshModels(state.settings.openRouterApiKey);
  }

  return (
    <div className="flex flex-1 overflow-auto px-6 py-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Connect OpenRouter, sync models, and use the AI SDK streaming chat pipeline.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>OpenRouter</CardTitle>
            <CardDescription>
              Your API key is stored locally on this device and used for model discovery and chat generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openrouter-api-key">API key</Label>
              <div className="flex gap-2">
                <Input
                  id="openrouter-api-key"
                  value={apiKeyInput}
                  onChange={(event) => setApiKeyInput(event.target.value)}
                  placeholder="sk-or-v1-..."
                  autoComplete="off"
                  spellCheck={false}
                  type="password"
                />
                <Button onClick={() => void handleSaveApiKey()} disabled={state.modelsLoading}>
                  Save key
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{OPENROUTER_API_KEY_HINT}</p>
              {(localError || state.modelsError) && (
                <p className="text-xs text-destructive">{localError || state.modelsError}</p>
              )}
            </div>

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
          </CardContent>
        </Card>

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
