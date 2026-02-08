import { memo, type ReactNode } from "react";

export const UnorderedList = memo(function UnorderedList({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <ul className="my-2 pl-6 list-disc [&_ul]:list-[circle] [&_ul_ul]:list-square [&_ul]:my-0.5 [&_ol]:my-0.5">
            {children}
        </ul>
    );
});

export const OrderedList = memo(function OrderedList({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <ol className="my-2 pl-6 list-decimal [&_ul]:my-0.5 [&_ol]:my-0.5">
            {children}
        </ol>
    );
});

export const ListItem = memo(function ListItem({
    children,
}: {
    children: ReactNode;
}) {
    const childArray = Array.isArray(children) ? children : [children];
    const hasCheckbox = childArray.some(
        (child) =>
            typeof child === "object" &&
            child !== null &&
            "props" in child &&
            (child as { props?: { type?: string } }).props?.type === "checkbox",
    );

    return (
        <li
            className={
                hasCheckbox
                    ? "list-none -ml-6 [&_input[type=checkbox]]:mr-1.5 [&_input[type=checkbox]]:align-middle [&_input[type=checkbox]]:relative [&_input[type=checkbox]]:-top-px"
                    : "my-0.5 [&>p]:my-1"
            }
        >
            {children}
        </li>
    );
});
