import type {
    PersistedMessageMetadata,
    Question,
    TodoItem,
    ToolCall,
} from "../types/model";

const PREFIX = "\n\n[KODIT_META]";
const SUFFIX = "[/KODIT_META]";

function isStatus(value: unknown): value is ToolCall["status"] {
    return (
        value === "pending" ||
        value === "running" ||
        value === "completed" ||
        value === "failed"
    );
}

export function decode(raw: string): {
    content: string;
    metadata?: PersistedMessageMetadata;
} {
    const start = raw.lastIndexOf(PREFIX);
    if (start < 0) return { content: raw };

    const metaStart = start + PREFIX.length;
    const end = raw.indexOf(SUFFIX, metaStart);
    if (end < 0 || end + SUFFIX.length !== raw.length) return { content: raw };

    try {
        const parsed = JSON.parse(raw.slice(metaStart, end)) as Partial<PersistedMessageMetadata>;
        if (parsed.version !== 1) return { content: raw };

        const toolCalls = Array.isArray(parsed.toolCalls)
            ? parsed.toolCalls.reduce<ToolCall[]>((acc, item) => {
                  if (!item || typeof item !== "object") return acc;
                  const candidate = item as Partial<ToolCall>;
                  if (
                      typeof candidate.id !== "string" ||
                      typeof candidate.name !== "string" ||
                      typeof candidate.args !== "string" ||
                      !isStatus(candidate.status)
                  ) {
                      return acc;
                  }
                  acc.push({
                      id: candidate.id,
                      name: candidate.name,
                      args: candidate.args,
                      status: candidate.status,
                      result:
                          typeof candidate.result === "string"
                              ? candidate.result
                              : undefined,
                  });
                  return acc;
              }, [])
            : undefined;

        const todos = Array.isArray(parsed.todos)
            ? parsed.todos.reduce<TodoItem[]>((acc, item) => {
                  if (!item || typeof item !== "object") return acc;
                  const candidate = item as Partial<TodoItem>;
                  if (
                      typeof candidate.id !== "string" ||
                      typeof candidate.content !== "string" ||
                      !["pending", "in_progress", "completed", "cancelled"].includes(
                          candidate.status as string,
                      )
                  ) {
                      return acc;
                  }
                  acc.push({
                      id: candidate.id,
                      content: candidate.content,
                      status: candidate.status as TodoItem["status"],
                      priority: ["high", "medium", "low"].includes(
                          candidate.priority as string,
                      )
                          ? (candidate.priority as TodoItem["priority"])
                          : undefined,
                  });
                  return acc;
              }, [])
            : undefined;

        const questions = Array.isArray(parsed.questions)
            ? parsed.questions.reduce<Question[]>((acc, item) => {
                  if (!item || typeof item !== "object") return acc;
                  const candidate = item as Partial<Question>;
                  if (
                      typeof candidate.question !== "string" ||
                      typeof candidate.header !== "string" ||
                      !Array.isArray(candidate.options)
                  ) {
                      return acc;
                  }
                  acc.push({
                      question: candidate.question,
                      header: candidate.header,
                      options: candidate.options,
                      multiple: candidate.multiple,
                      custom: candidate.custom,
                      answers: Array.isArray(candidate.answers)
                          ? candidate.answers
                          : undefined,
                  });
                  return acc;
              }, [])
            : undefined;

        return {
            content: raw.slice(0, start),
            metadata: {
                version: 1,
                reasoning:
                    typeof parsed.reasoning === "string" ? parsed.reasoning : undefined,
                toolCalls: toolCalls?.length ? toolCalls : undefined,
                todos: todos?.length ? todos : undefined,
                questions: questions?.length ? questions : undefined,
            },
        };
    } catch {
        return { content: raw };
    }
}

export function encode(params: {
    content: string;
    reasoning?: string;
    toolCalls?: ToolCall[];
    todos?: TodoItem[];
    questions?: Question[];
}): string {
    const metadata: PersistedMessageMetadata = {
        version: 1,
        reasoning: params.reasoning?.trim() ? params.reasoning : undefined,
        toolCalls: params.toolCalls?.length ? params.toolCalls : undefined,
        todos: params.todos?.length ? params.todos : undefined,
        questions: params.questions?.length ? params.questions : undefined,
    };

    if (!metadata.reasoning && !metadata.toolCalls && !metadata.todos && !metadata.questions) {
        return params.content;
    }

    return `${params.content}${PREFIX}${JSON.stringify(metadata)}${SUFFIX}`;
}
