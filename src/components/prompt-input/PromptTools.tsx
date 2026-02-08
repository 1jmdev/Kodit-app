import type { ComponentType, Dispatch } from "react";
import { AtSign, ChevronDown, Globe, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AppAction } from "@/store/app-store";
import type { ModelConfig } from "@/store/types";

interface PromptToolsProps {
    selectedModel: ModelConfig;
    modelProfiles: ModelConfig[];
    dispatch: Dispatch<AppAction>;
}

function IconTool({
    label,
    icon: Icon,
}: {
    label: string;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground/70 hover:text-foreground"
                    />
                }
            >
                <Icon className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

export function PromptTools({
    selectedModel,
    modelProfiles,
    dispatch,
}: PromptToolsProps) {
    return (
        <div className="flex items-center gap-0.5">
            <IconTool label="Attach file" icon={Paperclip} />
            <IconTool label="Mention" icon={AtSign} />
            <IconTool label="Search web" icon={Globe} />

            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <button className="ml-1.5 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                            <span className="font-medium">
                                {selectedModel.name}
                            </span>
                            <ChevronDown className="size-3 text-muted-foreground/50" />
                        </button>
                    }
                />
                <DropdownMenuContent
                    align="start"
                    side="top"
                    sideOffset={8}
                    className="max-h-72 w-80 overflow-y-auto"
                >
                    {modelProfiles.map((model) => (
                        <DropdownMenuItem
                            key={`${model.providerId}:${model.id}`}
                            onClick={() =>
                                dispatch({ type: "SET_MODEL", model })
                            }
                        >
                            <div className="flex items-center justify-between w-full gap-4">
                                <span className="font-medium truncate">
                                    {model.name}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {model.provider}
                                </span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
