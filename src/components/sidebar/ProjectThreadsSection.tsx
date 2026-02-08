import type { Dispatch, MouseEvent, SetStateAction } from "react";
import type { Location, NavigateFunction } from "react-router-dom";
import type { Project, Thread } from "@/store/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    Circle,
    Folder,
    MessageSquare,
} from "lucide-react";

import { formatTimeAgo } from "./sidebar-utils";

interface ProjectThreadsSectionProps {
    projects: Project[];
    threads: Thread[];
    activeThreadId: string | null;
    location: Location;
    expandedProjects: Record<string, boolean>;
    visibleThreadCount: Record<string, number>;
    setExpandedProjects: Dispatch<SetStateAction<Record<string, boolean>>>;
    setVisibleThreadCount: Dispatch<SetStateAction<Record<string, number>>>;
    navigate: NavigateFunction;
    onSelectProject: (projectId: string) => void;
    onPrimaryMouseDown: (
        event: MouseEvent<HTMLButtonElement>,
        action: () => void,
    ) => void;
    onKeyboardClick: (
        event: MouseEvent<HTMLButtonElement>,
        action: () => void,
    ) => void;
    onSelectThread: (threadId: string) => void;
}

export function ProjectThreadsSection({
    projects,
    threads,
    activeThreadId,
    location,
    expandedProjects,
    visibleThreadCount,
    setExpandedProjects,
    setVisibleThreadCount,
    navigate,
    onSelectProject,
    onPrimaryMouseDown,
    onKeyboardClick,
    onSelectThread,
}: ProjectThreadsSectionProps) {
    const threadsByProject = projects.map((project) => ({
        project,
        threads: threads
            .filter((thread) => thread.projectId === project.id)
            .sort((a, b) => b.updatedAt - a.updatedAt),
    }));

    return (
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
                                        setExpandedProjects((prev) => ({
                                            ...prev,
                                            [project.id]: !expanded,
                                        }))
                                    }
                                    className="px-2 py-1.5 shrink-0"
                                    aria-label={
                                        expanded
                                            ? `Collapse ${project.name}`
                                            : `Expand ${project.name}`
                                    }
                                >
                                    {expanded ? (
                                        <ChevronDown className="size-3 text-muted-foreground/60 shrink-0" />
                                    ) : (
                                        <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />
                                    )}
                                </button>
                                <button
                                    onMouseDown={(event) =>
                                        onPrimaryMouseDown(event, () => {
                                            onSelectProject(project.id);
                                            navigate("/");
                                        })
                                    }
                                    onClick={(event) =>
                                        onKeyboardClick(event, () => {
                                            onSelectProject(project.id);
                                            navigate("/");
                                        })
                                    }
                                    className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left"
                                >
                                    <Folder className="size-3.5 text-muted-foreground/70 shrink-0" />
                                    <span className="truncate text-[13px] font-medium text-foreground/95">
                                        {project.name}
                                    </span>
                                    <span className="ml-auto text-[11px] text-muted-foreground/65">
                                        {threads.length}
                                    </span>
                                </button>
                            </div>

                            {expanded && (
                                <div className="pb-1 pl-6">
                                    {shownThreads.map((thread) => {
                                        const isActive =
                                            thread.id === activeThreadId &&
                                            location.pathname.includes(
                                                "/chat/",
                                            );
                                        return (
                                            <button
                                                key={thread.id}
                                                onMouseDown={(event) =>
                                                    onPrimaryMouseDown(
                                                        event,
                                                        () =>
                                                            onSelectThread(
                                                                thread.id,
                                                            ),
                                                    )
                                                }
                                                onClick={(event) =>
                                                    onKeyboardClick(event, () =>
                                                        onSelectThread(
                                                            thread.id,
                                                        ),
                                                    )
                                                }
                                                className={cn(
                                                    "group flex w-full items-start gap-2 rounded-md px-2 py-[6px] text-left transition-all",
                                                    isActive
                                                        ? "text-foreground"
                                                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                                                )}
                                            >
                                                {isActive ? (
                                                    <Circle className="size-2 mt-1.5 shrink-0 fill-sky-500 text-sky-500" />
                                                ) : (
                                                    <MessageSquare className="size-3.5 mt-0.5 shrink-0 opacity-45" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <span className="truncate text-[13px] font-medium leading-tight">
                                                        {thread.title}
                                                    </span>
                                                    <div className="mt-0.5 text-[11px] opacity-50">
                                                        {formatTimeAgo(
                                                            thread.updatedAt,
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {threads.length > visible && (
                                        <button
                                            onClick={() =>
                                                setVisibleThreadCount(
                                                    (prev) => ({
                                                        ...prev,
                                                        [project.id]:
                                                            (prev[project.id] ??
                                                                4) + 10,
                                                    }),
                                                )
                                            }
                                            className="mt-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                                        >
                                            Show 10 more
                                        </button>
                                    )}

                                    {visible > 4 && (
                                        <button
                                            onClick={() =>
                                                setVisibleThreadCount(
                                                    (prev) => ({
                                                        ...prev,
                                                        [project.id]: Math.max(
                                                            4,
                                                            (prev[project.id] ??
                                                                4) - 10,
                                                        ),
                                                    }),
                                                )
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
    );
}
