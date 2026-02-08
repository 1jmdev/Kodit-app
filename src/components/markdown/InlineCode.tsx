import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const InlineCode = memo(function InlineCode({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <code
            className={cn(
                "bg-muted border border-border rounded px-1.5 py-0.5 text-[0.8em] font-mono text-foreground",
                className,
            )}
        >
            {children}
        </code>
    );
});
