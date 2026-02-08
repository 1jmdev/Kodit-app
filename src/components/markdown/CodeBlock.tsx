import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Prism, resolveLanguage, getLanguageLabel, hasGrammar } from "./prism-languages";
import { Check, Copy } from "lucide-react";

export const CodeBlock = memo(function CodeBlock({
  language,
  children,
}: {
  language: string | null;
  children: string;
}) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const resolved = language ? resolveLanguage(language) : null;
  const hasLang = resolved !== null && hasGrammar(resolved);

  useEffect(() => {
    if (codeRef.current && hasLang) {
      Prism.highlightElement(codeRef.current);
    }
  }, [children, hasLang, resolved]);

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
            <span className="flex items-center gap-1"><Check className="size-3" /> Copied</span>
          ) : (
            <span className="flex items-center gap-1"><Copy className="size-3" /> Copy</span>
          )}
        </button>
      </div>
      <pre className="!m-0 !border-none !rounded-none bg-[hsl(220_10%_97%)] dark:bg-[hsl(220_18%_8%)]">
        <code
          ref={codeRef}
          className={`block px-4 py-3.5 overflow-x-auto text-[0.8125rem] leading-[1.6] font-mono [tab-size:2] text-[hsl(222_14%_20%)] dark:text-[hsl(220_10%_80%)] ${hasLang ? `language-${resolved}` : ""}`}
        >
          {children}
        </code>
      </pre>
    </div>
  );
});
