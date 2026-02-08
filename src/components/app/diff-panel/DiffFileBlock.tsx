import { useState } from "react";
import { ChevronDown, ChevronRight, FileCode } from "lucide-react";
import type { FileChange } from "@/store/types";
import { DiffLineRow } from "@/components/app/diff-panel/DiffLineRow";
import { hasGrammar, resolveLanguage } from "@/components/markdown/prism-languages";

interface DiffFileBlockProps {
  file: FileChange;
}

export function DiffFileBlock({ file }: DiffFileBlockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const fileExtension = file.filePath.split(".").pop()?.toLowerCase();
  const resolvedLanguage = fileExtension ? resolveLanguage(fileExtension) : null;
  const lineLanguage = resolvedLanguage && hasGrammar(resolvedLanguage) ? resolvedLanguage : null;

  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="group flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-accent/20"
      >
        <div className="flex min-w-0 items-center gap-2">
          {collapsed ? (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
          ) : (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground/50" />
          )}
          <FileCode className="size-3.5 shrink-0 text-muted-foreground/65" />
          <span className="truncate text-xs font-medium text-foreground/85">{file.filePath}</span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">+{file.additions} -{file.deletions}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto overscroll-x-contain">
          {file.hunks.map((hunk, index) => (
            <div key={`${file.filePath}-hunk-${index}`}>
              {hunk.lines.map((line, lineIndex) => (
                <DiffLineRow
                  key={`${file.filePath}-line-${index}-${lineIndex}`}
                  line={line}
                  language={lineLanguage}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
