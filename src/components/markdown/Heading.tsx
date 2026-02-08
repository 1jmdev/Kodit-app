import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Level = 1 | 2 | 3 | 4 | 5 | 6;

const styles: Record<Level, string> = {
    1: "text-2xl font-bold mt-5 mb-3 text-foreground tracking-tight border-b border-border pb-1.5",
    2: "text-xl font-semibold mt-4.5 mb-2.5 text-foreground tracking-tight border-b border-border pb-1",
    3: "text-lg font-semibold mt-4 mb-2 text-foreground",
    4: "text-base font-semibold mt-3.5 mb-1.5 text-foreground",
    5: "text-sm font-semibold mt-3 mb-1 text-foreground",
    6: "text-sm font-semibold mt-3 mb-1 text-foreground",
};

export const Heading = memo(function Heading({
    level,
    children,
}: {
    level: Level;
    children: ReactNode;
}) {
    const Tag = `h${level}` as const;
    return <Tag className={cn(styles[level])}>{children}</Tag>;
});
