import { tool } from "ai";
import { z } from "zod";
import { agentRunCommand } from "@/lib/tauri-storage";
import DESCRIPTION from "./bash.txt";

export function createShellTool(workspacePath: string) {
    return tool({
        description: DESCRIPTION,
        inputSchema: z.object({
            command: z.string().min(1).describe("The command to execute"),
            workdir: z
                .string()
                .describe(
                    `The working directory to run the command in. Defaults to ${workspacePath}. Use this instead of 'cd' commands.`,
                )
                .optional(),
            timeout: z
                .number()
                .optional()
                .describe("Optional timeout in milliseconds"),
        }),
        execute: async ({ command, workdir, timeout }) => {
            return agentRunCommand({
                workspacePath,
                command,
                workdir: workdir ? `${workspacePath}/${workdir}` : undefined,
                timeoutMs: timeout,
            });
        },
    });
}
