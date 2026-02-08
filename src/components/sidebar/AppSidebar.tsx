import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppStore } from "@/store/app-store";
import { ProjectThreadsSection } from "@/components/sidebar/ProjectThreadsSection";
import { SidebarNav } from "@/components/sidebar/SidebarNav";
import { SidebarSettingsButton } from "@/components/sidebar/SidebarSettingsButton";
import {
    handleKeyboardClick,
    handlePrimaryMouseDown,
} from "@/components/sidebar/sidebar-utils";

export function AppSidebar() {
    const { state, dispatch } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedProjects, setExpandedProjects] = useState<
        Record<string, boolean>
    >({});
    const [visibleThreadCount, setVisibleThreadCount] = useState<
        Record<string, number>
    >({});

    useEffect(() => {
        setExpandedProjects((prev) => {
            const next = { ...prev };
            for (const project of state.projects) {
                if (next[project.id] === undefined) next[project.id] = true;
            }
            return next;
        });

        setVisibleThreadCount((prev) => {
            const next = { ...prev };
            for (const project of state.projects) {
                if (next[project.id] === undefined) next[project.id] = 4;
            }
            return next;
        });
    }, [state.projects]);

    function handleSelectThread(threadId: string) {
        const thread = state.threads.find((item) => item.id === threadId);
        dispatch({ type: "SET_ACTIVE_THREAD", threadId });
        if (thread && thread.projectId !== state.activeProjectId) {
            dispatch({
                type: "SET_ACTIVE_PROJECT",
                projectId: thread.projectId,
            });
        }
        navigate(`/chat/${threadId}`);
    }

    return (
        <div className="flex h-full w-[260px] flex-col bg-sidebar select-none rounded-tr-[24px]">
            <div data-tauri-drag-region className="h-[10px] flex-shrink-0" />
            <SidebarNav
                onNewThread={() => navigate("/")}
                onPrimaryMouseDown={handlePrimaryMouseDown}
                onKeyboardClick={handleKeyboardClick}
            />

            <div className="mx-3 my-1 h-px bg-border/40" />
            <div className="flex items-center justify-between px-4 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Threads
                </span>
            </div>

            <ProjectThreadsSection
                projects={state.projects}
                threads={state.threads}
                activeThreadId={state.activeThreadId}
                location={location}
                expandedProjects={expandedProjects}
                visibleThreadCount={visibleThreadCount}
                setExpandedProjects={setExpandedProjects}
                setVisibleThreadCount={setVisibleThreadCount}
                navigate={navigate}
                onSelectProject={(projectId) =>
                    dispatch({ type: "SET_ACTIVE_PROJECT", projectId })
                }
                onPrimaryMouseDown={handlePrimaryMouseDown}
                onKeyboardClick={handleKeyboardClick}
                onSelectThread={handleSelectThread}
            />

            <div className="mx-3 my-1 h-px bg-border/40" />
            <SidebarSettingsButton
                onOpenSettings={() => navigate("/settings")}
                onPrimaryMouseDown={handlePrimaryMouseDown}
                onKeyboardClick={handleKeyboardClick}
            />
        </div>
    );
}
