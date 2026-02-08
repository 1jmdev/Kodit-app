import { memo, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Message, FileEdit, ToolCall } from "@/store/types";
import {
  FileCode,
  ChevronRight,
  Terminal,
  Search,
  Undo2,
} from "lucide-react";

const ToolCallItem = memo(function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        {toolCall.name.startsWith("Edited") ? (
          <FileCode className="size-3.5 text-amber-400" />
        ) : toolCall.name.startsWith("Ran") ? (
          <Terminal className="size-3.5 text-blue-400" />
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
  const paragraphs = useMemo(() => message.content.split("\n\n"), [message.content]);

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

        {/* Content */}
        <div className={cn(
          "text-sm leading-relaxed",
          isUser ? "text-foreground" : "text-foreground/90"
        )}>
          {paragraphs.map((paragraph, i) => {
            // Check if it's a list
            if (paragraph.startsWith("- ") || paragraph.startsWith("* ")) {
              const items = paragraph.split("\n").filter(Boolean);
              return (
                <ul key={i} className="my-2 space-y-1 list-disc list-inside">
                  {items.map((item, j) => (
                    <li key={j} className="text-sm leading-relaxed">
                      <span dangerouslySetInnerHTML={{
                        __html: item
                          .replace(/^[-*]\s+/, "")
                          .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
                          .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>')
                      }} />
                    </li>
                  ))}
                </ul>
              );
            }

            // Check for headers
            if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
              return (
                <h3 key={i} className="font-semibold text-foreground mt-4 mb-2">
                  {paragraph.replace(/\*\*/g, "")}
                </h3>
              );
            }

            // Check for numbered list
            if (/^\d+\./.test(paragraph)) {
              const items = paragraph.split("\n").filter(Boolean);
              return (
                <ol key={i} className="my-2 space-y-1 list-decimal list-inside">
                  {items.map((item, j) => (
                    <li key={j} className="text-sm leading-relaxed">
                      <span dangerouslySetInnerHTML={{
                        __html: item
                          .replace(/^\d+\.\s+/, "")
                          .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>')
                      }} />
                    </li>
                  ))}
                </ol>
              );
            }

            return (
              <p key={i} className={cn("my-2", i === 0 && "mt-0")}>
                <span dangerouslySetInnerHTML={{
                  __html: paragraph
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
                    .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs font-mono">$1</code>')
                }} />
              </p>
            );
          })}
          {message.isStreaming && !isUser && <span className="inline-block h-4 w-1 animate-pulse rounded-sm bg-foreground/70 align-middle" />}
        </div>

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
