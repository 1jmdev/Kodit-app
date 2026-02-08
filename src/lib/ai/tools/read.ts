import { tool } from "ai";
import { z } from "zod";
import { agentReadFile } from "@/lib/tauri-storage";
import DESCRIPTION from "./read.txt";

export function createReadFileTool(workspacePath: string) {
    return tool({
        description: DESCRIPTION,
        inputSchema: z.object({
            filePath: z.string().describe("The path to the file to read"),
            offset: z.coerce
                .number()
                .describe("The line number to start reading from (0-based)")
                .optional(),
            limit: z.coerce
                .number()
                .describe("The number of lines to read (defaults to 2000)")
                .optional()
                .default(2000),
        }),
        execute: async ({ filePath, offset, limit }) => {
            return agentReadFile({
                workspacePath,
                path: filePath,
                offset,
                limit,
            });
        },
    });
}
