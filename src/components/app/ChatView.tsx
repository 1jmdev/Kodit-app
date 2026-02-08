import { memo, useRef, useEffect, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Message, FileEdit, ToolCall, TodoItem } from "@/store/types";
import {
  FileCode,
  ChevronRight,
  Terminal,
  Search,
  Undo2,
  Brain,
  ListTodo,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown";

const ToolCallItem = memo(function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        {toolCall.name.startsWith("Edited") ? (
          <FileCode className="size-3.5 text-amber-400" />
        ) : toolCall.name.startsWith("Ran") ? (
          <Terminal className="size-3.5 text-blue-400" />
        ) : toolCall.name.startsWith("Updated TODO") || toolCall.name.startsWith("Read TODO") ? (
          <ListTodo className="size-3.5 text-green-400" />
        ) : toolCall.name.startsWith("Asked question") ? (
          <Circle className="size-3.5 text-orange-400" />
        ) : (
          <Search className="size-3.5 text-purple-400" />
        )}
        <span className="font-medium text-foreground/80">{toolCall.name}</span>
        {toolCall.args && (
          <>
            <span className="text-muted-foreground/50 text-xs font-mono">{toolCall.args}</span>
          </>
        )}
        <ChevronRight className="size-3 text-muted-foreground/40" />
      </div>
    </div>
  );
});

const TodoStatusIcon = memo(function TodoStatusIcon({ status }: { status: TodoItem["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />;
    case "in_progress":
      return <Clock className="size-3.5 text-blue-400 shrink-0 animate-pulse" />;
    case "cancelled":
      return <XCircle className="size-3.5 text-red-400 shrink-0" />;
    default:
      return <Circle className="size-3.5 text-muted-foreground/50 shrink-0" />;
  }
});

const TodoList = memo(function TodoList({ todos }: { todos: TodoItem[] }) {
  const completed = todos.filter((t) => t.status === "completed").length;

  return (
    <div className="mt-3 rounded-xl border border-border/50 bg-card/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <ListTodo className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground/80">Tasks</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {completed}/{todos.length}
        </span>
      </div>
      <div className="divide-y divide-border/20">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-start gap-2 px-4 py-1.5"
          >
            <div className="mt-0.5">
              <TodoStatusIcon status={todo.status} />
            </div>
            <span className={cn(
              "text-xs leading-relaxed",
              todo.status === "completed" && "line-through text-muted-foreground/60",
              todo.status === "cancelled" && "line-through text-muted-foreground/40",
              todo.status === "in_progress" && "text-foreground",
              todo.status === "pending" && "text-foreground/70",
            )}>
              {todo.content}
            </span>
            {todo.priority && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-auto",
                todo.priority === "high" && "bg-red-500/15 text-red-400",
                todo.priority === "medium" && "bg-amber-500/15 text-amber-400",
                todo.priority === "low" && "bg-blue-500/15 text-blue-400",
              )}>
                {todo.priority}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const FileEditSummary = memo(function FileEditSummary({ edits }: { edits: FileEdit[] }) {
  const totalAdditions = edits.reduce((sum, e) => sum + e.additions, 0);
  const totalDeletions = edits.reduce((sum, e) => sum + e.deletions, 0);

  return (
    <div className="mt-4 rounded-xl border border-border/50 bg-card/30 overflow-hidden">
      {/* Summary header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {edits.length} files changed
          </span>
          <span className="text-xs font-mono">
            <span className="text-emerald-400">+{totalAdditions}</span>
            {" "}
            <span className="text-red-400">-{totalDeletions}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Undo2 className="size-3" />
            Undo
          </button>
          <ChevronRight className="size-3.5 text-muted-foreground/40 rotate-90" />
        </div>
      </div>

      {/* File list */}
      <div className="divide-y divide-border/20">
        {edits.map((edit) => (
          <button
            key={edit.id}
            className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-accent/30 transition-colors"
          >
            <span className="text-sm text-foreground/80 truncate">{edit.filePath}</span>
            <span className="text-xs font-mono shrink-0 ml-3">
              <span className="text-emerald-400">+{edit.additions}</span>
              {" "}
              <span className="text-red-400">-{edit.deletions}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("max-w-none", isUser ? "flex justify-end" : "")}>
      <div className={cn(
        isUser
          ? "max-w-[85%] rounded-2xl bg-accent/60 px-4 py-3"
          : "w-full"
      )}>
        {/* Tool calls (above content for assistant) */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-3 space-y-0.5">
            {message.toolCalls.map((tc) => (
              <ToolCallItem key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Reasoning */}
        {!isUser && message.reasoning && (
          <div className="mb-3 rounded-lg border border-border/40 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground/75">
              <Brain className="size-3.5" />
              <span>Thinking</span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">{message.reasoning}</p>
          </div>
        )}

        {/* Content */}
        <div className={cn(
          "text-sm leading-relaxed",
          isUser ? "text-foreground" : "text-foreground/90"
        )}>
          <MarkdownRenderer content={message.content} isStreaming={message.isStreaming} />
          {message.isStreaming && !isUser && <span className="inline-block h-4 w-1 animate-pulse rounded-sm bg-foreground/70 align-middle" />}
        </div>

        {/* Todos */}
        {!isUser && message.todos && message.todos.length > 0 && (
          <TodoList todos={message.todos} />
        )}

        {/* File edits summary */}
        {!isUser && message.fileEdits && message.fileEdits.length > 0 && (
          <FileEditSummary edits={message.fileEdits} />
        )}
      </div>
    </div>
  );
});

export function ChatView() {
  const { state } = useAppStore();
  const { threadId } = useParams<{ threadId: string }>();
  const containerRef = useRef<HTMLDivElement>(null);

  const activeThread =
    (threadId ? state.threads.find((t) => t.id === threadId) : undefined) ??
    (state.activeThreadId ? state.threads.find((t) => t.id === state.activeThreadId) : undefined);

  useLayoutEffect(() => {
    const viewport = containerRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [activeThread?.id]);

  useEffect(() => {
    const viewport = containerRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [activeThread?.messages.length]);

  if (!activeThread) {
    return <div className="flex-1 min-h-0" />;
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden min-h-0">
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-3xl px-6 py-6 space-y-6">
          {activeThread.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
