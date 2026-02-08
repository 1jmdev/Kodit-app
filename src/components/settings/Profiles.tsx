import { X } from "lucide-react";
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

interface ProfilesSettingsProps {
    modelSearch: string;
    filteredModels: ModelConfig[];
    modelProfiles: ModelConfig[];
    selectedModelId: string;
    onModelSearchChange: (value: string) => void;
    onAddModelProfile: (model: ModelConfig) => void;
    onSelectModelProfile: (model: ModelConfig) => void;
    onRemoveModelProfile: (modelKey: string) => void;
}

export function ProfilesSettings({
    modelSearch,
    filteredModels,
    modelProfiles,
    selectedModelId,
    onModelSearchChange,
    onAddModelProfile,
    onSelectModelProfile,
    onRemoveModelProfile,
}: ProfilesSettingsProps) {
    return (
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
                        onChange={(event) => onModelSearchChange(event.target.value)}
                        placeholder="Search by model name or id"
                    />
                    <div className="max-h-62 overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-2">
                        {modelSearch.trim().length === 0 && (
                            <p className="px-2 py-1 text-xs text-muted-foreground">
                                Enter a search query and add models as profiles.
                            </p>
                        )}

                        {modelSearch.trim().length > 0 && filteredModels.length === 0 && (
                            <p className="px-2 py-1 text-xs text-muted-foreground">
                                No matching models found.
                            </p>
                        )}

                        {filteredModels.map((model) => {
                            const exists = modelProfiles.some(
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
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="max-w-28 truncate">
                                            {model.provider}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            className="w-16"
                                            variant="outline"
                                            disabled={exists}
                                            onClick={() => onAddModelProfile(model)}
                                        >
                                            {exists ? "Added" : "Add"}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Configured profiles</Label>
                    <div className="space-y-2">
                        {modelProfiles.map((profile) => {
                            const profileKey = getModelKey(profile);
                            const isSelected = selectedModelId === profileKey;
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
                                        <Badge variant="secondary" className="max-w-28 truncate">
                                            {profile.provider}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            className="w-16"
                                            variant={isSelected ? "default" : "outline"}
                                            onClick={() => onSelectModelProfile(profile)}
                                        >
                                            {isSelected ? "Using" : "Use"}
                                        </Button>
                                        <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            onClick={() => onRemoveModelProfile(profileKey)}
                                            disabled={modelProfiles.length <= 1}
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
    );
}
