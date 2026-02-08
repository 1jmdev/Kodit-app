import { Button } from "@/components/ui/button";

export type SettingsPageId = "models" | "appearance";

interface SettingsNavProps {
    page: SettingsPageId;
    onChange: (page: SettingsPageId) => void;
}

export function SettingsNav({ page, onChange }: SettingsNavProps) {
    return (
        <div className="flex flex-wrap gap-2">
            <Button
                variant={page === "models" ? "default" : "outline"}
                onClick={() => onChange("models")}
            >
                Models
            </Button>
            <Button
                variant={page === "appearance" ? "default" : "outline"}
                onClick={() => onChange("appearance")}
            >
                Appearance
            </Button>
        </div>
    );
}
