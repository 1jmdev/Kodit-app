import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FileChange, DiffLine } from "@/store/types";
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Plus,
  MoreHorizontal,
  FileCode,
  FolderOpen,
} from "lucide-react";

function DiffLineView({ line }: { line: DiffLine }) {
  return (
    <div
      className={cn(
        "flex text-xs font-mono leading-5 group/line",
        line.type === "addition" && "bg-emerald-500/10",
        line.type === "deletion" && "bg-red-500/10",
        line.type === "header" && "bg-accent/30 text-muted-foreground"
      )}
    >
      {/* Line numbers */}
      <div className="flex shrink-0 select-none text-muted-foreground/40">
        <span className="w-10 text-right px-2">
          {line.type !== "addition" && line.type !== "header" ? line.oldLineNumber : ""}
        </span>
        <span className="w-10 text-right px-2">
          {line.type !== "deletion" && line.type !== "header" ? line.newLineNumber : ""}
        </span>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <span
          className={cn(
            "whitespace-pre",
            line.type === "addition" && "text-emerald-300",
            line.type === "deletion" && "text-red-300",
            line.type === "context" && "text-foreground/60",
          )}
        >
          {line.content}
        </span>
      </div>
    </div>
  );
}

function CollapsedSection({ count }: { count: number }) {
  return (
    <button className="flex items-center gap-2 w-full px-4 py-1.5 text-xs text-muted-foreground/50 hover:bg-accent/20 transition-colors">
      <ChevronRight className="size-3" />
      <span>{count} unmodified lines</span>
    </button>
  );
}

function FileChangeBlock({ file }: { file: FileChange }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-b border-border/30 last:border-b-0">
      {/* File header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full px-4 py-2 hover:bg-accent/20 transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0">
          {collapsed ? (
            <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground/50 shrink-0" />
          )}
          <FileCode className="size-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-xs font-medium text-foreground/80 truncate">
            {file.filePath}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            +{file.additions} -{file.deletions}
          </span>
          {/* Dot indicator for unsaved */}
          <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
        </div>
      </button>

      {/* Diff content */}
      {!collapsed && (
        <div className="overflow-x-auto">
          {file.hunks.map((hunk, hunkIdx) => (
            <div key={hunkIdx}>
              {/* Show collapsed unmodified lines indicator */}
              {hunkIdx === 0 && hunk.oldStart > 1 && (
                <CollapsedSection count={hunk.oldStart - 1} />
              )}
              {hunk.lines.map((line, lineIdx) => (
                <DiffLineView key={lineIdx} line={line} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DiffPanel() {
  const { state } = useAppStore();
  const activeThread = state.threads.find((t) => t.id === state.activeThreadId);

  if (!activeThread) return null;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground/80">Uncommitted changes</span>
          <ChevronDown className="size-3 text-muted-foreground/50" />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Unstaged: {activeThread.unstagedCount}</span>
          <span>Staged: {activeThread.stagedCount}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" className="text-muted-foreground/60">
              <FolderOpen className="size-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" className="text-muted-foreground/60">
              <MoreHorizontal className="size-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Diff content */}
      <ScrollArea className="flex-1">
        <div>
          {activeThread.fileChanges.map((file, idx) => (
            <FileChangeBlock key={idx} file={file} />
          ))}
        </div>
      </ScrollArea>

      {/* Bottom actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-border/30">
        <Button variant="outline" size="xs" className="text-xs gap-1">
          <RotateCcw className="size-3" />
          Revert all
        </Button>
        <Button variant="outline" size="xs" className="text-xs gap-1">
          <Plus className="size-3" />
          Stage all
        </Button>
      </div>
    </div>
  );
}
