import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Plus,
  Zap,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  LayoutGrid,
  MessageSquare,
  Clipboard,
  Bookmark,
  Monitor,
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

  function handleNewThread() {
    dispatch({ type: "SET_ACTIVE_THREAD", threadId: null });
    navigate("/");
  }

  function handleSelectThread(threadId: string) {
    dispatch({ type: "SET_ACTIVE_THREAD", threadId });
    navigate(`/chat/${threadId}`);
  }

  function handleToggleSidebar() {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  }

  const navItems = [
    { id: "new", label: "New thread", icon: Plus, action: handleNewThread },
    { id: "automations", label: "Automations", icon: Zap },
    { id: "skills", label: "Skills", icon: Sparkles },
  ];

  // Collapsed sidebar
  if (state.sidebarCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-border/50 bg-sidebar py-2 gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleToggleSidebar}
              />
            }
          >
            <PanelLeftOpen className="size-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>
        <div className="my-1 h-px w-6 bg-border/50" />
        {navItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={item.action}
                />
              }
            >
              <item.icon className="size-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full w-[260px] flex-col bg-sidebar border-r border-border/40 select-none">
      {/* macOS traffic light spacer + header */}
      <div className="flex items-center justify-between px-3 pt-9 pb-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleToggleSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          <PanelLeftClose className="size-4" />
        </Button>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
            <SlidersHorizontal className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
            <LayoutGrid className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 px-2 py-1.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors",
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

      {/* Threads label */}
      <div className="flex items-center justify-between px-4 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Threads
        </span>
      </div>

      {/* Thread list */}
      <ScrollArea className="flex-1 px-1.5">
        <div className="flex flex-col gap-px pb-2">
          {/* Pinned / special items */}
          <button className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors mx-0.5">
            <Bookmark className="size-3.5 opacity-60" />
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium">My Skills</span>
              <span className="ml-2 text-[11px] text-muted-foreground/50">skills</span>
            </div>
          </button>
          <button className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors mx-0.5">
            <Monitor className="size-3.5 opacity-60" />
            <span className="text-[13px] font-medium">Desktop</span>
          </button>

          {/* Thread items */}
          {state.threads.map((thread) => {
            const isActive = thread.id === state.activeThreadId && location.pathname.includes("/chat/");
            return (
              <button
                key={thread.id}
                onClick={() => handleSelectThread(thread.id)}
                className={cn(
                  "group flex items-start gap-2 rounded-lg px-2.5 py-[7px] text-left transition-all mx-0.5",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                )}
              >
                <MessageSquare className="size-3.5 mt-0.5 shrink-0 opacity-50" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium leading-tight">
                      {thread.title}
                    </span>
                    {thread.totalAdditions > 0 && (
                      <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-mono">
                        <span className="text-emerald-400">+{thread.totalAdditions}</span>
                        <span className="text-red-400">-{thread.totalDeletions}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {thread.isActive && (
                      <Clipboard className="size-2.5 opacity-40" />
                    )}
                    <span className="text-[11px] opacity-50">
                      {formatTimeAgo(thread.updatedAt)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Bottom projects */}
      <div className="mx-3 my-0.5 h-px bg-border/40" />
      <div className="px-1.5 py-2 space-y-px">
        {state.projects.slice(0, 5).map((project) => (
          <button
            key={project.id}
            onClick={() => dispatch({ type: "SET_ACTIVE_PROJECT", projectId: project.id })}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-[6px] text-[13px] w-full text-left transition-colors mx-0.5",
              project.id === state.activeProjectId
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            <div className={cn(
              "size-2 rounded-full shrink-0",
              project.id === state.activeProjectId ? "bg-emerald-400" : "bg-muted-foreground/25"
            )} />
            <span className="truncate">{project.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
