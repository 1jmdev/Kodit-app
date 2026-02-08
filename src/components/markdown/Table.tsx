import { memo, type ReactNode } from "react";

export const Table = memo(function Table({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-[0.8125rem]">{children}</table>
    </div>
  );
});

export const TableHead = memo(function TableHead({
  children,
}: {
  children: ReactNode;
}) {
  return <thead>{children}</thead>;
});

export const TableBody = memo(function TableBody({
  children,
}: {
  children: ReactNode;
}) {
  return <tbody>{children}</tbody>;
});

export const TableRow = memo(function TableRow({
  children,
}: {
  children: ReactNode;
}) {
  return <tr>{children}</tr>;
});

export const TableHeader = memo(function TableHeader({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={style}
      className="font-semibold text-left px-3 py-2 border-b-2 border-border text-foreground bg-muted"
    >
      {children}
    </th>
  );
});

export const TableCell = memo(function TableCell({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={style}
      className="px-3 py-1.5 border-b border-border last:[tr>&]:border-b-0"
    >
      {children}
    </td>
  );
});
