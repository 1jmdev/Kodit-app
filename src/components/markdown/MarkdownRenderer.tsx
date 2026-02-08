import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./components";

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
}: {
  content: string;
}) {
  return (
    <div className="leading-[1.6] break-words [&>*:first-child]:!mt-0 [&>*:last-child]:!mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
