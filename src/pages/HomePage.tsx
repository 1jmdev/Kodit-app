import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { pickFolder } from "@/lib/tauri-storage";
import { PromptInput } from "@/components/prompt-input/PromptInput";
import type { PendingProject } from "@/components/prompt-input/types";
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
  const [pendingProject, setPendingProject] = useState<PendingProject | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(state.activeProjectId);

  useEffect(() => {
    if (state.activeThreadId !== null) {
      dispatch({ type: "SET_ACTIVE_THREAD", threadId: null });
    }
  }, [state.activeThreadId, dispatch]);

  useEffect(() => {
    if (pendingProject) return;
    setSelectedProjectId(state.activeProjectId);
  }, [pendingProject, state.activeProjectId]);

  const selectedProject = useMemo(() => {
    if (pendingProject && selectedProjectId === null) {
      return pendingProject;
    }

    return state.projects.find((project) => project.id === selectedProjectId) || null;
  }, [pendingProject, selectedProjectId, state.projects]);

  async function handleOpenFolder() {
    const workspacePath = await pickFolder();
    if (!workspacePath) return;

    const name = workspacePath.split(/[/\\]/).filter(Boolean).pop() || "workspace";
    setPendingProject({ name, workspacePath });
    setSelectedProjectId(null);
    dispatch({ type: "SET_ACTIVE_THREAD", threadId: null });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-32">
      <div className="w-full max-w-2xl space-y-6">
        {/* Project selector */}
        <div className="flex items-center justify-center gap-3">
          {(state.projects.length > 0 || pendingProject) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2 min-w-[200px] justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-emerald-400" />
                      <span>{selectedProject?.name || "Select project"}</span>
                    </div>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="center" sideOffset={4}>
                {pendingProject && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedProjectId(null);
                      dispatch({ type: "SET_ACTIVE_THREAD", threadId: null });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-amber-400" />
                      <span>{pendingProject.name}</span>
                      <span className="text-muted-foreground text-xs ml-1">{pendingProject.workspacePath}</span>
                    </div>
                  </DropdownMenuItem>
                )}
                {state.projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => {
                      setPendingProject(null);
                      setSelectedProjectId(project.id);
                      dispatch({ type: "SET_ACTIVE_PROJECT", projectId: project.id });
                    }}
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
          )}

          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => void handleOpenFolder()}>
            <FolderOpen className="size-3.5" />
            Open folder
          </Button>
        </div>

        {/* Input */}
        <PromptInput
          variant="home"
          pendingProject={selectedProjectId === null ? pendingProject : null}
          onPendingProjectSaved={() => setPendingProject(null)}
        />

        {/* Quick actions hint */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
          <span>Press <kbd className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-mono bg-muted/30">Enter</kbd> to send</span>
          <span>Press <kbd className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-mono bg-muted/30">Shift+Enter</kbd> for new line</span>
        </div>
      </div>
    </div>
  );
}
