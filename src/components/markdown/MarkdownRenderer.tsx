import { memo, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./components";

// Stable reference — avoids ReactMarkdown rebuilding the unified pipeline every render
const plugins = [remarkGfm];

/**
 * Find the byte-offset where the last "stable" top-level markdown block ends.
 *
 * A block is considered stable when it is followed by at least two newlines
 * (i.e. another block has started after it). The very last block is always
 * treated as *unstable* because during streaming it is still being appended to.
 *
 * Returns the index to split at, or 0 if nothing is stable yet.
 */
function findStableCut(content: string): number {
  // We look for the last double-newline that is NOT inside a fenced code block.
  // Walk the string keeping track of whether we're inside a fence.
  let insideFence = false;
  let lastCut = 0;

  const lines = content.split("\n");
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trimEnd())) {
      insideFence = !insideFence;
    }

    // A blank line outside a code fence after some content marks a potential cut
    if (!insideFence && line.trim() === "" && offset > 0) {
      // Check if the NEXT line is also blank or if this is a block boundary
      // A single blank line between paragraphs is a block boundary
      lastCut = offset + line.length + 1; // +1 for the \n
    }

    offset += line.length + 1; // +1 for the \n
  }

  return lastCut;
}

/**
 * Memoized block — renders a completed markdown chunk that will never change.
 * Keyed by its content string so React can skip reconciliation entirely.
 */
const StableMarkdown = memo(
  function StableMarkdown({ content }: { content: string }) {
    return (
      <ReactMarkdown remarkPlugins={plugins} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    );
  },
  (prev, next) => prev.content === next.content
);

/**
 * Active tail — the part of the message still being streamed.
 * No custom memo comparison so it re-renders on every change (which is fine,
 * it's only the small trailing chunk).
 */
function ActiveMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={plugins} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  isStreaming = false,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  // Cache the stable prefix so it doesn't shift on every token
  const stableRef = useRef<{ text: string; cut: number }>({ text: "", cut: 0 });

  const { stableContent, activeContent } = useMemo(() => {
    if (!isStreaming) {
      // Message is complete — everything is stable, single pass
      return { stableContent: content, activeContent: "" };
    }

    const cut = findStableCut(content);

    // Only grow the stable region — never shrink it (prevents flicker)
    if (cut > stableRef.current.cut) {
      stableRef.current = { text: content.slice(0, cut), cut };
    }

    return {
      stableContent: stableRef.current.text,
      activeContent: content.slice(stableRef.current.cut),
    };
  }, [content, isStreaming]);

  return (
    <div className="leading-[1.6] break-words [&>*:first-child]:!mt-0 [&>*:last-child]:!mb-0">
      {stableContent && <StableMarkdown content={stableContent} />}
      {activeContent && <ActiveMarkdown content={activeContent} />}
    </div>
  );
});
