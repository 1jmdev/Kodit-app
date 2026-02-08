import { invoke } from "@tauri-apps/api/core";

export interface AgentReadFileResult {
    path: string;
    content: string;
    startLine: number;
    endLine: number;
    totalLines: number;
    truncated: boolean;
}

export interface AgentWriteFileResult {
    path: string;
    bytesWritten: number;
}

export interface AgentDeleteFileResult {
    path: string;
    deleted: boolean;
}

export interface AgentRunCommandResult {
    command: string;
    workdir: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    timedOut: boolean;
}

export async function agentReadFile(params: {
    workspacePath: string;
    path: string;
    offset?: number;
    limit?: number;
}): Promise<AgentReadFileResult> {
    const result = await invoke<{
        path: string;
        content: string;
        start_line: number;
        end_line: number;
        total_lines: number;
        truncated: boolean;
    }>("agent_read_file", params);

    return {
        path: result.path,
        content: result.content,
        startLine: result.start_line,
        endLine: result.end_line,
        totalLines: result.total_lines,
        truncated: result.truncated,
    };
}

export async function agentWriteFile(params: {
    workspacePath: string;
    path: string;
    content: string;
    createDirs?: boolean;
}): Promise<AgentWriteFileResult> {
    const result = await invoke<{ path: string; bytes_written: number }>(
        "agent_write_file",
        {
            ...params,
            createDirs: params.createDirs ?? false,
        },
    );

    return {
        path: result.path,
        bytesWritten: result.bytes_written,
    };
}

export async function agentDeleteFile(params: {
    workspacePath: string;
    path: string;
    allowMissing?: boolean;
}): Promise<AgentDeleteFileResult> {
    const result = await invoke<{ path: string; deleted: boolean }>(
        "agent_delete_file",
        {
            ...params,
            allowMissing: params.allowMissing ?? true,
        },
    );

    return {
        path: result.path,
        deleted: result.deleted,
    };
}

export async function agentRunCommand(params: {
    workspacePath: string;
    command: string;
    workdir?: string;
    timeoutMs?: number;
}): Promise<AgentRunCommandResult> {
    const result = await invoke<{
        command: string;
        workdir: string;
        exit_code: number;
        stdout: string;
        stderr: string;
        timed_out: boolean;
    }>("agent_run_command", params);

    return {
        command: result.command,
        workdir: result.workdir,
        exitCode: result.exit_code,
        stdout: result.stdout,
        stderr: result.stderr,
        timedOut: result.timed_out,
    };
}
