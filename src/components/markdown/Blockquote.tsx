import { memo, type ReactNode } from "react";

export const Blockquote = memo(function Blockquote({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <blockquote className="my-2.5 py-1.5 px-3.5 border-l-[3px] border-border text-muted-foreground [&>p]:my-1">
            {children}
        </blockquote>
    );
});
