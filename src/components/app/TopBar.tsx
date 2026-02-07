import { useAppStore } from "@/store/app-store";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  ChevronDown,
  GitMerge,
  ExternalLink,
  Copy,
  Settings,
} from "lucide-react";

export function TopBar() {
  const { state } = useAppStore();
  const navigate = useNavigate();
  const activeThread = state.threads.find((t) => t.id === state.activeThreadId);
  const activeProject = state.projects.find((project) => project.id === activeThread?.projectId);

  if (!activeThread) return null;

  return (
    <div
      className="flex h-12 items-center justify-between border-b border-border/40 px-4 bg-background"
      data-tauri-drag-region
    >
      {/* Left: Thread title + project */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-[13px] font-semibold truncate">{activeThread.title}</h1>
        <span className="text-[12px] text-muted-foreground/60 shrink-0">{activeProject?.name || "Unknown project"}</span>
        <span className="text-muted-foreground/30 text-xs">...</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Run / Open */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs font-medium px-2.5">
                <Play className="size-3" />
                <span>Open</span>
                <ChevronDown className="size-3 text-muted-foreground/60" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Open in editor</DropdownMenuItem>
            <DropdownMenuItem>Open in terminal</DropdownMenuItem>
            <DropdownMenuItem>Open in browser</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Commit */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs font-medium px-2.5">
                <GitMerge className="size-3" />
                <span>Commit</span>
                <ChevronDown className="size-3 text-muted-foreground/60" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Commit all changes</DropdownMenuItem>
            <DropdownMenuItem>Commit staged only</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Amend last commit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Stats badge */}
        {activeThread.totalAdditions > 0 && (
          <Badge variant="outline" className="font-mono text-[10px] gap-1 px-2 h-7 border-border/50 rounded-md">
            <span className="text-emerald-400">+{activeThread.totalAdditions}</span>
            <span className="text-red-400">-{activeThread.totalDeletions}</span>
          </Badge>
        )}

        {/* Icon buttons */}
        <div className="flex items-center gap-0 ml-0.5">
          <Button variant="ghost" size="icon-xs" className="text-muted-foreground/60 hover:text-foreground">
            <ExternalLink className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" className="text-muted-foreground/60 hover:text-foreground">
            <Copy className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground/60 hover:text-foreground"
            onClick={() => navigate("/settings")}
          >
            <Settings className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
