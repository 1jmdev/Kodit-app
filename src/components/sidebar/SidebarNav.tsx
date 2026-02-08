import type { MouseEvent } from "react";
import { Plus, Sparkles, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

interface SidebarNavProps {
    onNewThread: () => void;
    onPrimaryMouseDown: (
        event: MouseEvent<HTMLButtonElement>,
        action: () => void,
    ) => void;
    onKeyboardClick: (
        event: MouseEvent<HTMLButtonElement>,
        action: () => void,
    ) => void;
}

const navItems = [
    { id: "new", label: "New thread", icon: Plus },
    { id: "automations", label: "Automations", icon: Zap },
    { id: "skills", label: "Skills", icon: Sparkles },
] as const;

export function SidebarNav({
    onNewThread,
    onPrimaryMouseDown,
    onKeyboardClick,
}: SidebarNavProps) {
    return (
        <div className="flex flex-col gap-0.5 px-2 py-1">
            {navItems.map((item) => {
                const action = item.id === "new" ? onNewThread : undefined;
                return (
                    <button
                        key={item.id}
                        onMouseDown={
                            action
                                ? (event) => onPrimaryMouseDown(event, action)
                                : undefined
                        }
                        onClick={
                            action
                                ? (event) => onKeyboardClick(event, action)
                                : undefined
                        }
                        className={cn(
                            "flex items-center gap-2 rounded-md px-2.5 py-[7px] text-[13px] transition-colors",
                            item.id === "new"
                                ? "font-medium text-foreground"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                        )}
                    >
                        <item.icon className="size-4" />
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
