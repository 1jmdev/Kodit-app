import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface AppearanceSettingsProps {
    showWindowControls: boolean;
    onToggleWindowControls: (show: boolean) => void;
}

export function AppearanceSettings({
    showWindowControls,
    onToggleWindowControls,
}: AppearanceSettingsProps) {
    return (
        <Card className="overflow-visible">
            <CardHeader>
                <CardTitle>Window Controls</CardTitle>
                <CardDescription>
                    Customize how window controls (minimize, maximize, close)
                    appear in the title bar.
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
                        checked={showWindowControls}
                        onCheckedChange={onToggleWindowControls}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
