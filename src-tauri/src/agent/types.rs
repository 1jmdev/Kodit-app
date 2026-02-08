use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct AgentReadFileResult {
    pub path: String,
    pub content: String,
    pub start_line: usize,
    pub end_line: usize,
    pub total_lines: usize,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct AgentWriteFileResult {
    pub path: String,
    pub bytes_written: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct AgentDeleteFileResult {
    pub path: String,
    pub deleted: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct AgentRunCommandResult {
    pub command: String,
    pub workdir: String,
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub timed_out: bool,
}
