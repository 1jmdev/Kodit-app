import { memo, useMemo } from "react";
import { Prism, hasGrammar } from "@/components/markdown/prism-languages";
import { cn } from "@/lib/utils";
import type { DiffLine } from "@/store/types";

interface DiffLineRowProps {
  line: DiffLine;
  language: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const DiffLineRow = memo(function DiffLineRow({ line, language }: DiffLineRowProps) {
  const highlighted = useMemo(() => {
    if (line.type === "header") {
      return Prism.highlight(line.content, Prism.languages.diff, "diff");
    }

    const rawCode = line.content.slice(1);
    if (!language || !hasGrammar(language)) {
      return escapeHtml(rawCode);
    }

    return Prism.highlight(rawCode, Prism.languages[language], language);
  }, [line.content, line.type, language]);

  const linePrefix = line.type === "header" ? "" : line.content.slice(0, 1);

  return (
    <div
      className={cn(
        "group/line flex min-w-max text-[12px] font-mono leading-5",
        line.type === "addition" && "bg-emerald-500/8",
        line.type === "deletion" && "bg-red-500/8",
        line.type === "header" && "bg-accent/35 text-muted-foreground",
      )}
    >
      <div className="flex shrink-0 select-none text-muted-foreground/50">
        <span className="w-11 px-2 text-right">{line.oldLineNumber ?? ""}</span>
        <span className="w-11 px-2 text-right">{line.newLineNumber ?? ""}</span>
      </div>
      <div className="flex-1">
        <code
          className={cn(
            "block w-max min-w-full whitespace-pre px-2 py-0",
            line.type === "header" ? "language-diff" : language ? `language-${language}` : "",
          )}
        >
          {line.type !== "header" && (
            <span
              className={cn(
                "inline-block w-[1ch]",
                line.type === "context" && "text-muted-foreground/70",
                line.type === "addition" && "text-emerald-300",
                line.type === "deletion" && "text-red-300",
              )}
            >
              {linePrefix}
            </span>
          )}
          <span
            className={cn(
              line.type === "context" && "text-foreground/80",
              line.type === "addition" && "text-foreground/90",
              line.type === "deletion" && "text-foreground/90",
            )}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </code>
      </div>
    </div>
  );
});
