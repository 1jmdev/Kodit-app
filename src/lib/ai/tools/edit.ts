import { tool } from "ai";
import { z } from "zod";
import { agentReadFile, agentWriteFile, saveDiff } from "@/lib/tauri-storage";
import DESCRIPTION from "./edit.txt";

function normalizeNewlines(text: string): string {
    return text.replace(/\r\n/g, "\n");
}

interface CreateEditToolOptions {
    threadId?: string;
}

export function createEditTool(
    workspacePath: string,
    options: CreateEditToolOptions = {},
) {
    async function recordDiff(
        path: string,
        oldContent: string,
        newContent: string,
    ) {
        if (!options.threadId) {
            return;
        }
        try {
            await saveDiff({
                threadId: options.threadId,
                summary: `Edited ${path}`,
                files: [{ filePath: path, oldContent, newContent }],
            });
        } catch {
            // Do not fail the edit after the file has already been written.
        }
    }

    return tool({
        description: DESCRIPTION,
        inputSchema: z.object({
            path: z
                .string()
                .min(1)
                .describe("The relative path to the file to edit"),
            oldString: z
                .string()
                .describe("The exact string to find in the file"),
            newString: z
                .string()
                .describe(
                    "The string to replace oldString with (must be different from oldString)",
                ),
            replaceAll: z
                .boolean()
                .optional()
                .default(false)
                .describe(
                    "Replace all occurrences of oldString in the file (default false)",
                ),
        }),
        execute: async ({ path, oldString, newString, replaceAll }) => {
            if (oldString === newString) {
                return {
                    ok: false,
                    error: "oldString and newString are identical — no change needed.",
                };
            }

            // Read the current file content
            const initialRead = await agentReadFile({ workspacePath, path });
            const readResult = initialRead.truncated
                ? await agentReadFile({
                      workspacePath,
                      path,
                      offset: 0,
                      limit: initialRead.totalLines + 1,
                  })
                : initialRead;

            const content = normalizeNewlines(readResult.content);
            const normalizedOld = normalizeNewlines(oldString);
            const normalizedNew = normalizeNewlines(newString);

            if (replaceAll) {
                // Replace all occurrences
                if (!content.includes(normalizedOld)) {
                    return {
                        ok: false,
                        error: "oldString not found in content",
                    };
                }
                const updated = content
                    .split(normalizedOld)
                    .join(normalizedNew);
                await agentWriteFile({
                    workspacePath,
                    path,
                    content: updated,
                    createDirs: false,
                });
                await recordDiff(path, content, updated);
                return { ok: true, path };
            }

            // Single replacement mode
            const firstIndex = content.indexOf(normalizedOld);
            if (firstIndex === -1) {
                return { ok: false, error: "oldString not found in content" };
            }

            const secondIndex = content.indexOf(normalizedOld, firstIndex + 1);
            if (secondIndex !== -1) {
                return {
                    ok: false,
                    error: "oldString found multiple times and requires more code context to uniquely identify the intended match",
                };
            }

            const updated =
                content.slice(0, firstIndex) +
                normalizedNew +
                content.slice(firstIndex + normalizedOld.length);

            await agentWriteFile({
                workspacePath,
                path,
                content: updated,
                createDirs: false,
            });
            await recordDiff(path, content, updated);
            return { ok: true, path };
        },
    });
}
