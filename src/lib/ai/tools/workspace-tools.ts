import { tool } from "ai";
import { z } from "zod";
import { agentReadFile, agentRunCommand, agentWriteFile } from "@/lib/tauri-storage";

export function createWorkspaceTools(workspacePath: string) {
  return {
    read_file: tool({
      description: "Read a text file from the workspace",
      inputSchema: z.object({
        path: z.string().min(1).describe("File path to read, relative or absolute"),
        offset: z.number().int().min(0).optional().describe("0-based line offset"),
        limit: z.number().int().min(1).max(4000).optional().describe("Max lines to read"),
      }),
      execute: async ({ path, offset, limit }) => {
        return agentReadFile({
          workspacePath,
          path,
          offset,
          limit,
        });
      },
    }),
    write_file: tool({
      description: "Write complete text content into a file in the workspace",
      inputSchema: z.object({
        path: z.string().min(1).describe("File path to write, relative or absolute"),
        content: z.string().describe("Full file contents to write"),
        create_dirs: z.boolean().optional().describe("Create missing parent directories"),
      }),
      execute: async ({ path, content, create_dirs }) => {
        return agentWriteFile({
          workspacePath,
          path,
          content,
          createDirs: create_dirs,
        });
      },
    }),
    run_command: tool({
      description: "Run a shell command in workspace",
      inputSchema: z.object({
        command: z.string().min(1).describe("Shell command to execute"),
        workdir: z.string().optional().describe("Working directory inside workspace"),
        timeout_ms: z.number().int().min(100).max(120000).optional().describe("Timeout in milliseconds"),
      }),
      execute: async ({ command, workdir, timeout_ms }) => {
        return agentRunCommand({
          workspacePath,
          command,
          workdir,
          timeoutMs: timeout_ms,
        });
      },
    }),
  };
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

  if (toolName === "write_file") {
    return `Edited ${path}`;
  }
  if (toolName === "run_command") {
    return `Ran ${command}`;
  }
  if (toolName === "read_file") {
    return `Read ${path}`;
  }
  return toolName;
}

export function serializeToolArg(value: unknown): string {
  return truncateValue(value, 220);
}

export function serializeToolResult(value: unknown): string {
  return truncateValue(value);
}
