import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiffPanelHeaderProps {
    fileCount: number;
    additions: number;
    deletions: number;
    unstagedCount: number;
    stagedCount: number;
}

export function DiffPanelHeader({
    fileCount,
    additions,
    deletions,
    unstagedCount,
    stagedCount,
}: DiffPanelHeaderProps) {
    return (
        <div className="border-b border-border/50 px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-xs font-medium text-foreground/85">
                        Tracked changes
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground/50" />
                    <span className="rounded border border-border/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {fileCount} files
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                    <span
                        className={cn(
                            "text-emerald-500 dark:text-emerald-400",
                            additions === 0 && "opacity-50",
                        )}
                    >
                        +{additions}
                    </span>
                    <span
                        className={cn(
                            "text-red-500 dark:text-red-400",
                            deletions === 0 && "opacity-50",
                        )}
                    >
                        -{deletions}
                    </span>
                </div>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>Unstaged: {unstagedCount}</span>
                <span>Staged: {stagedCount}</span>
            </div>
        </div>
    );
}
