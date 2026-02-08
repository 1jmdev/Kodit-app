import { tool } from "ai";
import { z } from "zod";
import { todoSchema } from "./todo-store";
import type { TodoStore } from "./todo-store";
import DESCRIPTION from "./todo-write.txt";

export function createTodoWriteTool(store: TodoStore) {
    return tool({
        description: DESCRIPTION,
        inputSchema: z.object({
            todos: z.array(todoSchema).describe("Full replacement TODO list"),
        }),
        execute: async ({ todos }) => {
            store.set(todos);
            return {
                todos: store.get(),
                summary: store.summary(),
            };
        },
    });
}
