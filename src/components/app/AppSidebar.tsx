import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Plus,
  Zap,
  Sparkles,
  Settings,
  MessageSquare,
  Folder,
  ChevronDown,
  ChevronRight,
  Circle,
} from "lucide-react";

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

export function AppSidebar() {
  const { state, dispatch } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [visibleThreadCount, setVisibleThreadCount] = useState<Record<string, number>>({});

  const threadsByProject = useMemo(() => {
    return state.projects.map((project) => ({
      project,
      threads: state.threads
        .filter((thread) => thread.projectId === project.id)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    }));
  }, [state.projects, state.threads]);

  useEffect(() => {
    setExpandedProjects((prev) => {
      const next = { ...prev };
      for (const project of state.projects) {
        if (next[project.id] === undefined) {
          next[project.id] = true;
        }
      }
      return next;
    });

    setVisibleThreadCount((prev) => {
      const next = { ...prev };
      for (const project of state.projects) {
        if (next[project.id] === undefined) {
          next[project.id] = 4;
        }
      }
      return next;
    });
  }, [state.projects]);

  function handleNewThread() {
    dispatch({ type: "SET_ACTIVE_THREAD", threadId: null });
    navigate("/");
  }

  function handleSelectThread(threadId: string) {
    const thread = state.threads.find((item) => item.id === threadId);
    if (thread) {
      dispatch({ type: "SET_ACTIVE_PROJECT", projectId: thread.projectId });
    }
    dispatch({ type: "SET_ACTIVE_THREAD", threadId });
    navigate(`/chat/${threadId}`);
  }

  function handleOpenSettings() {
    navigate("/settings");
  }

  const navItems = [
    { id: "new", label: "New thread", icon: Plus, action: handleNewThread },
    { id: "automations", label: "Automations", icon: Zap },
    { id: "skills", label: "Skills", icon: Sparkles },
  ];

  return (
    <div className="flex h-full w-[260px] flex-col bg-sidebar select-none rounded-tr-[24px]">
      {/* Drag region for sidebar top */}
      <div 
        data-tauri-drag-region
        className="h-[10px] flex-shrink-0"
      />

      <div className="flex flex-col gap-0.5 px-2 py-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={cn(
              "flex items-center gap-2 rounded-md px-2.5 py-[7px] text-[13px] transition-colors",
              item.id === "new"
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="mx-3 my-1 h-px bg-border/40" />

      <div className="flex items-center justify-between px-4 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Threads
        </span>
      </div>

      {/* Thread folders */}
      <ScrollArea className="flex-1 px-1.5">
        <div className="flex flex-col gap-2 pb-2">
          {threadsByProject.map(({ project, threads }) => {
            const expanded = expandedProjects[project.id] ?? true;
            const visible = visibleThreadCount[project.id] ?? 4;
            const shownThreads = threads.slice(0, visible);

            return (
              <div key={project.id} className="mx-0.5">
                <div className="flex w-full items-center rounded-md text-left text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors">
                  <button
                    onClick={() =>
                      setExpandedProjects((prev) => ({ ...prev, [project.id]: !expanded }))
                    }
                    className="px-2 py-1.5 shrink-0"
                    aria-label={expanded ? `Collapse ${project.name}` : `Expand ${project.name}`}
                  >
                    {expanded ? (
                      <ChevronDown className="size-3 text-muted-foreground/60 shrink-0" />
                    ) : (
                      <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      dispatch({ type: "SET_ACTIVE_PROJECT", projectId: project.id });
                      dispatch({ type: "SET_ACTIVE_THREAD", threadId: null });
                      navigate("/");
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left"
                  >
                    <Folder className="size-3.5 text-muted-foreground/70 shrink-0" />
                    <span className="truncate text-[13px] font-medium text-foreground/95">{project.name}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground/65">{threads.length}</span>
                  </button>
                </div>

                {expanded && (
                  <div className="pb-1 pl-6">
                    {shownThreads.map((thread) => {
                      const isActive =
                        thread.id === state.activeThreadId && location.pathname.includes("/chat/");
                      return (
                        <button
                          key={thread.id}
                          onClick={() => handleSelectThread(thread.id)}
                          className={cn(
                            "group flex w-full items-start gap-2 rounded-md px-2 py-[6px] text-left transition-all",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                          )}
                        >
                          {isActive ? (
                            <Circle className="size-2 mt-1.5 shrink-0 fill-sky-500 text-sky-500" />
                          ) : (
                            <MessageSquare className="size-3.5 mt-0.5 shrink-0 opacity-45" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-[13px] font-medium leading-tight">
                                {thread.title}
                              </span>
                            </div>
                            <div className="mt-0.5">
                              <span className="text-[11px] opacity-50">
                                {formatTimeAgo(thread.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {threads.length > visible && (
                      <button
                        onClick={() =>
                          setVisibleThreadCount((prev) => ({
                            ...prev,
                            [project.id]: (prev[project.id] ?? 4) + 10,
                          }))
                        }
                        className="mt-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                      >
                        Show 10 more
                      </button>
                    )}

                    {visible > 4 && (
                      <button
                        onClick={() =>
                          setVisibleThreadCount((prev) => ({
                            ...prev,
                            [project.id]: Math.max(4, (prev[project.id] ?? 4) - 10),
                          }))
                        }
                        className="mt-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="mx-3 my-1 h-px bg-border/40" />
      <div className="px-2 pb-3 pt-1">
        <button
          onClick={handleOpenSettings}
          className="flex w-full items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-2.5 py-2 text-[13px] text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <Settings className="size-3.5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
