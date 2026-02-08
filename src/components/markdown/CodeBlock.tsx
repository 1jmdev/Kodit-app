import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
    Prism,
    resolveLanguage,
    getLanguageLabel,
    hasGrammar,
} from "./prism-languages";
import { Check, Copy } from "lucide-react";

/**
 * Highlight code using Prism's grammar directly (synchronous, no DOM mutation).
 * Returns an HTML string. Falls back to plain-text if the grammar isn't loaded.
 */
function highlightCode(code: string, lang: string | null): string | null {
    if (!lang) return null;
    const resolved = resolveLanguage(lang);
    if (!hasGrammar(resolved)) return null;
    return Prism.highlight(code, Prism.languages[resolved], resolved);
}

export const CodeBlock = memo(function CodeBlock({
    language,
    children,
}: {
    language: string | null;
    children: string;
}) {
    const [copied, setCopied] = useState(false);
    const resolved = language ? resolveLanguage(language) : null;

    // Debounce highlighting — during streaming the content changes on every token.
    // We highlight immediately on mount / when streaming stops, but debounce
    // intermediate updates to avoid running Prism on every keystroke.
    const [highlighted, setHighlighted] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const prevChildrenRef = useRef(children);

    useEffect(() => {
        const changed = children !== prevChildrenRef.current;
        prevChildrenRef.current = children;

        if (!changed) {
            // First mount or language changed — highlight immediately
            setHighlighted(highlightCode(children, language));
            return;
        }

        // Content changed (streaming) — debounce the highlight
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setHighlighted(highlightCode(children, language));
        }, 80);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [children, language]);

    // Always highlight synchronously when content stabilizes (e.g. streaming ends
    // and the parent memo kicks in with the final content)
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(children).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [children]);

    return (
        <div className="relative my-3 rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 text-xs font-mono text-muted-foreground border-b border-border bg-[hsl(220_10%_94%)] dark:bg-[hsl(220_16%_11%)]">
                <span>{resolved ? getLanguageLabel(resolved) : ""}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? "Copied" : "Copy code"}
                    className="cursor-pointer bg-transparent border-none text-muted-foreground px-1.5 py-0.5 rounded text-[0.6875rem] transition-all hover:bg-accent hover:text-foreground"
                >
                    {copied ? (
                        <span className="flex items-center gap-1">
                            <Check className="size-3" /> Copied
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <Copy className="size-3" /> Copy
                        </span>
                    )}
                </button>
            </div>
            <pre className="!m-0 !border-none !rounded-none bg-[hsl(220_10%_97%)] dark:bg-[hsl(220_18%_8%)]">
                {highlighted ? (
                    <code
                        className={`block px-4 py-3.5 overflow-x-auto text-[0.8125rem] leading-[1.6] font-mono [tab-size:2] text-[hsl(222_14%_20%)] dark:text-[hsl(220_10%_80%)] language-${resolved}`}
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                    />
                ) : (
                    <code className="block px-4 py-3.5 overflow-x-auto text-[0.8125rem] leading-[1.6] font-mono [tab-size:2] text-[hsl(222_14%_20%)] dark:text-[hsl(220_10%_80%)]">
                        {children}
                    </code>
                )}
            </pre>
        </div>
    );
});
