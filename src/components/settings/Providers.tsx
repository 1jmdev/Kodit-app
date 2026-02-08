import type { ProviderPreset } from "@/lib/ai/types";
import type { ModelConfig } from "@/store/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getModelKey } from "@/components/settings/utils";

interface ProvidersSettingsProps {
    providerPresets: ProviderPreset[];
    availableModels: ModelConfig[];
    apiKeys: Record<string, string>;
    apiKeyInputByProvider: Record<string, string>;
    refreshingByProvider: Record<string, boolean>;
    providerErrorById: Record<string, string | null>;
    onInputChange: (providerId: string, value: string) => void;
    onSaveApiKey: (providerId: string) => void;
    onRefreshModels: (providerId: string) => void;
}

function getPlaceholder(providerId: string): string {
    if (providerId === "openrouter") return "sk-or-v1-...";
    if (providerId === "openai") return "sk-...";
    if (providerId === "gemini") return "AIza...";
    return "Enter API key";
}

export function ProvidersSettings({
    providerPresets,
    availableModels,
    apiKeys,
    apiKeyInputByProvider,
    refreshingByProvider,
    providerErrorById,
    onInputChange,
    onSaveApiKey,
    onRefreshModels,
}: ProvidersSettingsProps) {
    return (
        <>
            {providerPresets.map((preset) => {
                const providerModels = availableModels.filter(
                    (model) => model.providerId === preset.id,
                );

                return (
                    <Card key={preset.id}>
                        <CardHeader>
                            <CardTitle>{preset.label}</CardTitle>
                            <CardDescription>
                                API keys are stored in{" "}
                                <code>~/.config/com.1jmdev.kodit/auth.json</code>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`${preset.id}-api-key`}>API key</Label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input
                                        id={`${preset.id}-api-key`}
                                        value={
                                            apiKeyInputByProvider[preset.id] ??
                                            apiKeys[preset.id] ??
                                            ""
                                        }
                                        onChange={(event) =>
                                            onInputChange(preset.id, event.target.value)
                                        }
                                        placeholder={getPlaceholder(preset.id)}
                                        autoComplete="off"
                                        spellCheck={false}
                                        type="password"
                                    />
                                    <Button
                                        className="sm:shrink-0"
                                        onClick={() => onSaveApiKey(preset.id)}
                                        disabled={refreshingByProvider[preset.id]}
                                    >
                                        Save key
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {preset.apiKeyHint}
                                </p>
                                {providerErrorById[preset.id] && (
                                    <p className="text-xs text-destructive">
                                        {providerErrorById[preset.id]}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => onRefreshModels(preset.id)}
                                        disabled={refreshingByProvider[preset.id]}
                                    >
                                        {refreshingByProvider[preset.id]
                                            ? "Refreshing models..."
                                            : `Refresh ${preset.label} models`}
                                    </Button>
                                    <Badge variant="outline">
                                        {providerModels.length} synced models
                                    </Badge>
                                </div>

                                <div className="max-h-36 overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2">
                                    {providerModels.length === 0 ? (
                                        <p className="px-2 py-1 text-xs text-muted-foreground">
                                            No synced models for this provider yet.
                                        </p>
                                    ) : (
                                        providerModels.slice(0, 30).map((model) => (
                                            <div
                                                key={getModelKey(model)}
                                                className="truncate px-2 py-1 text-xs text-muted-foreground"
                                            >
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
        </>
    );
}
