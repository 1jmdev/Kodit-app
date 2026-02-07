import { useAppStore } from "@/store/app-store";
import { createProject } from "@/lib/tauri-storage";
import { PromptInput } from "@/components/app/PromptInput";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FolderOpen, ChevronDown } from "lucide-react";

export function HomePage() {
  const { state, dispatch } = useAppStore();
  const activeProject = state.projects.find((p) => p.id === state.activeProjectId);
  async function handleCreateProject() {
    const workspacePath = window.prompt("Workspace path", activeProject?.workspacePath || "");
    if (!workspacePath) return;

    const name = workspacePath.split("/").filter(Boolean).pop() || "workspace";
    const project = await createProject({ name, workspacePath });
    dispatch({ type: "SET_PROJECTS", projects: [project, ...state.projects.filter((p) => p.id !== project.id)] });
    dispatch({ type: "SET_ACTIVE_PROJECT", projectId: project.id });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-32">
      <div className="w-full max-w-2xl space-y-6">
        {/* Project selector */}
        <div className="flex items-center justify-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2 min-w-[200px] justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-400" />
                    <span>{activeProject?.name || "Select project"}</span>
                  </div>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="center" sideOffset={4}>
              {state.projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => dispatch({ type: "SET_ACTIVE_PROJECT", projectId: project.id })}
                >
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-400" />
                    <span>{project.name}</span>
                    <span className="text-muted-foreground text-xs ml-1">{project.workspacePath}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => void handleCreateProject()}>
            <FolderOpen className="size-3.5" />
            Open folder
          </Button>
        </div>

        {/* Input */}
        <PromptInput variant="home" />

        {/* Quick actions hint */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
          <span>Press <kbd className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-mono bg-muted/30">Enter</kbd> to send</span>
          <span>Press <kbd className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-mono bg-muted/30">Shift+Enter</kbd> for new line</span>
        </div>
      </div>
    </div>
  );
}
