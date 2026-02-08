/**
 * Central mapping of every markdown element to its React component.
 *
 * Each component is a standalone file in this directory — edit any single
 * element's look and behaviour without touching the rest.
 *
 * react-markdown passes the raw HTML-equivalent props to each override,
 * so the signatures here deliberately accept (and forward) the props
 * that matter for each element.
 */

import type { Components } from "react-markdown";
import { CodeBlock } from "./CodeBlock";
import { InlineCode } from "./InlineCode";
import { Heading } from "./Heading";
import { Link } from "./Link";
import { UnorderedList, OrderedList, ListItem } from "./List";
import { Blockquote } from "./Blockquote";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "./Table";
import { Paragraph } from "./Paragraph";
import { HorizontalRule } from "./HorizontalRule";
import { Image } from "./Image";

export const markdownComponents: Components = {
  // ── Code ──
  code({ className, children, ...rest }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const isBlock =
      typeof children === "string" &&
      (children.includes("\n") || match !== null);

    if (isBlock) {
      const code = String(children).replace(/\n$/, "");
      return <CodeBlock language={match?.[1] ?? null}>{code}</CodeBlock>;
    }

    return <InlineCode className={className} {...rest}>{children}</InlineCode>;
  },

  pre({ children }) {
    // CodeBlock already renders its own <pre>, so unwrap.
    return <>{children}</>;
  },

  // ── Headings ──
  h1: ({ children }) => <Heading level={1}>{children}</Heading>,
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  h4: ({ children }) => <Heading level={4}>{children}</Heading>,
  h5: ({ children }) => <Heading level={5}>{children}</Heading>,
  h6: ({ children }) => <Heading level={6}>{children}</Heading>,

  // ── Links & images ──
  a: ({ href, children }) => <Link href={href}>{children}</Link>,
  img: ({ src, alt }) => <Image src={src} alt={alt} />,

  // ── Lists ──
  ul: ({ children }) => <UnorderedList>{children}</UnorderedList>,
  ol: ({ children }) => <OrderedList>{children}</OrderedList>,
  li: ({ children }) => <ListItem>{children}</ListItem>,

  // ── Block elements ──
  p: ({ children }) => <Paragraph>{children}</Paragraph>,
  blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
  hr: () => <HorizontalRule />,

  // ── Table ──
  table: ({ children }) => <Table>{children}</Table>,
  thead: ({ children }) => <TableHead>{children}</TableHead>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children, style }) => <TableHeader style={style}>{children}</TableHeader>,
  td: ({ children, style }) => <TableCell style={style}>{children}</TableCell>,
};
