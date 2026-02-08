import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import type { TodoItem } from "@/store/types";
import { cn } from "@/lib/utils";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    ChevronDown,
    Circle,
    Clock,
    ListTodo,
    XCircle,
} from "lucide-react";

function TodoStatusIcon({ status }: { status: TodoItem["status"] }) {
    switch (status) {
        case "completed":
            return (
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
            );
        case "in_progress":
            return (
                <Clock className="size-3.5 text-blue-400 shrink-0 animate-pulse" />
            );
        case "cancelled":
            return <XCircle className="size-3.5 text-red-400 shrink-0" />;
        default:
            return (
                <Circle className="size-3.5 text-muted-foreground/50 shrink-0" />
            );
    }
}

export function ThreadTodoBar() {
    const { state } = useAppStore();
    const { threadId } = useParams<{ threadId: string }>();
    const [open, setOpen] = useState(true);

    const activeThread =
        (threadId ? state.threads.find((t) => t.id === threadId) : undefined) ??
        (state.activeThreadId
            ? state.threads.find((t) => t.id === state.activeThreadId)
            : undefined);
    const todos = activeThread?.todos ?? [];
    const completed = useMemo(
        () => todos.filter((t) => t.status === "completed").length,
        [todos],
    );

    if (!activeThread || todos.length === 0) {
        return null;
    }

    return (
        <div className="sticky top-0 z-20 border-b border-border/30 bg-background/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto max-w-3xl">
                <Collapsible open={open} onOpenChange={setOpen}>
                    <div className="rounded-xl border border-border/50 bg-card/30">
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2">
                                <ListTodo className="size-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-foreground/80">
                                    Chat Tasks
                                </span>
                                <span className="text-xs font-mono text-muted-foreground">
                                    {completed}/{todos.length}
                                </span>
                            </div>
                            <CollapsibleTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        aria-label={
                                            open
                                                ? "Collapse tasks"
                                                : "Expand tasks"
                                        }
                                    >
                                        <ChevronDown
                                            className={cn(
                                                "size-3.5 transition-transform",
                                                open && "rotate-180",
                                            )}
                                        />
                                    </Button>
                                }
                            />
                        </div>
                        <CollapsibleContent>
                            <div className="divide-y divide-border/20 border-t border-border/30">
                                {todos.map((todo) => (
                                    <div
                                        key={todo.id}
                                        className="flex items-start gap-2 px-3 py-1.5"
                                    >
                                        <div className="mt-0.5">
                                            <TodoStatusIcon
                                                status={todo.status}
                                            />
                                        </div>
                                        <span
                                            className={cn(
                                                "text-xs leading-relaxed",
                                                todo.status === "completed" &&
                                                    "line-through text-muted-foreground/60",
                                                todo.status === "cancelled" &&
                                                    "line-through text-muted-foreground/40",
                                                todo.status === "in_progress" &&
                                                    "text-foreground",
                                                todo.status === "pending" &&
                                                    "text-foreground/70",
                                            )}
                                        >
                                            {todo.content}
                                        </span>
                                        {todo.priority && (
                                            <span
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-auto",
                                                    todo.priority === "high" &&
                                                        "bg-red-500/15 text-red-400",
                                                    todo.priority ===
                                                        "medium" &&
                                                        "bg-amber-500/15 text-amber-400",
                                                    todo.priority === "low" &&
                                                        "bg-blue-500/15 text-blue-400",
                                                )}
                                            >
                                                {todo.priority}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            </div>
        </div>
    );
}
