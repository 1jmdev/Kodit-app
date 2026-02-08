import { memo, type ReactNode } from "react";

export const Link = memo(function Link({
    href,
    children,
}: {
    href?: string;
    children: ReactNode;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 no-underline hover:underline"
        >
            {children}
        </a>
    );
});
