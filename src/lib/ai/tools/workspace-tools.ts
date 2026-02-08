import { createReadFileTool } from "@/lib/ai/tools/read";
import { createEditTool } from "@/lib/ai/tools/edit";
import { createShellTool } from "@/lib/ai/tools/bash";
import { createTodoWriteTool } from "@/lib/ai/tools/todo-write";
import { createTodoReadTool } from "@/lib/ai/tools/todo-read";
import { createQuestionTool } from "@/lib/ai/tools/question";
import { createTodoStore } from "@/lib/ai/tools/todo-store";
import type { TodoStore } from "@/lib/ai/tools/todo-store";
import type { TodoItem } from "@/lib/ai/tools/todo-store";

export interface WorkspaceToolsContext {
  todoStore: TodoStore;
}

export function createWorkspaceTools(workspacePath: string, initialTodos: TodoItem[] = []) {
  const todoStore = createTodoStore();
  todoStore.set(initialTodos);

  const tools = {
    read_file: createReadFileTool(workspacePath),
    shell: createShellTool(workspacePath),
    edit: createEditTool(workspacePath),
    todo_write: createTodoWriteTool(todoStore),
    todo_read: createTodoReadTool(todoStore),
    question: createQuestionTool(),
  };

  return { tools, context: { todoStore } satisfies WorkspaceToolsContext };
}

function truncateValue(value: unknown, maxLength = 500): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) {
    return "";
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function toToolLabel(toolName: string, input: unknown): string {
  const args = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const path = typeof args.path === "string" ? args.path : "file";
  const command = typeof args.command === "string" ? args.command : "command";

  if (toolName === "edit") {
    return `Edited ${path}`;
  }
  if (toolName === "shell") {
    return `Ran ${command}`;
  }
  if (toolName === "read_file") {
    return `Read ${path}`;
  }
  if (toolName === "todo_write") {
    return "Updated TODOs";
  }
  if (toolName === "todo_read") {
    return "Read TODOs";
  }
  if (toolName === "question") {
    return "Asked question";
  }
  return toolName;
}

export function serializeToolArg(value: unknown): string {
  return truncateValue(value, 220);
}

export function serializeToolResult(value: unknown): string {
  return truncateValue(value);
}
