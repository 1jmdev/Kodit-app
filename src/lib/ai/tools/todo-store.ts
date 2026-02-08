import { z } from "zod";

export const todoSchema = z.object({
    id: z.string().min(1),
    content: z.string().min(1),
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
    priority: z.enum(["high", "medium", "low"]).optional(),
});

export type TodoItem = z.infer<typeof todoSchema>;

/**
 * Shared in-memory todo store for a single agent session.
 * Both todo_read and todo_write reference the same instance.
 */
export function createTodoStore() {
    let todos: TodoItem[] = [];

    return {
        get(): TodoItem[] {
            return todos;
        },
        set(next: TodoItem[]): void {
            todos = next;
        },
        summary(): string {
            const completed = todos.filter(
                (t) => t.status === "completed",
            ).length;
            const inProgress = todos.filter(
                (t) => t.status === "in_progress",
            ).length;
            return `${completed}/${todos.length} completed, ${inProgress} in progress`;
        },
    };
}

export type TodoStore = ReturnType<typeof createTodoStore>;
