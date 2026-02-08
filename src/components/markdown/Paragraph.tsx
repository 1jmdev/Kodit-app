import { memo, type ReactNode } from "react";

export const Paragraph = memo(function Paragraph({
    children,
}: {
    children: ReactNode;
}) {
    return <p className="my-2">{children}</p>;
});
