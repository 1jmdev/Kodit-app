import { tool } from "ai";
import { z } from "zod";
import type { TodoStore } from "./todo-store";
import DESCRIPTION from "./todo-read.txt";

export function createTodoReadTool(store: TodoStore) {
    return tool({
        description: DESCRIPTION,
        inputSchema: z.object({}),
        execute: async () => {
            const todos = store.get();
            return {
                todos,
                summary: store.summary(),
            };
        },
    });
}
