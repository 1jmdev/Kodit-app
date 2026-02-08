use std::fs;

use crate::agent::paths::{
    canonicalize_workspace, resolve_path_in_workspace, resolve_workdir_in_workspace,
};
use crate::agent::runner::run_shell_command;
use crate::agent::types::{
    AgentDeleteFileResult, AgentReadFileResult, AgentRunCommandResult, AgentWriteFileResult,
};

#[tauri::command]
pub fn agent_read_file(
    workspace_path: String,
    path: String,
    offset: Option<usize>,
    limit: Option<usize>,
) -> Result<AgentReadFileResult, String> {
    let workspace_root = canonicalize_workspace(&workspace_path)?;
    let resolved = resolve_path_in_workspace(&workspace_root, &path, false)?;
    if !resolved.is_file() {
        return Err("Path is not a file".to_string());
    }

    let text = fs::read_to_string(&resolved).map_err(|e| e.to_string())?;
    let lines: Vec<&str> = text.lines().collect();
    let total_lines = lines.len();
    let start = offset.unwrap_or(0).min(total_lines);
    let max_lines = limit.unwrap_or(2000).max(1);
    let end = (start + max_lines).min(total_lines);
    let truncated = end < total_lines;
    let selected = if start >= end {
        String::new()
    } else {
        lines[start..end].join("\n")
    };

    Ok(AgentReadFileResult {
        path: resolved.to_string_lossy().to_string(),
        content: selected,
        start_line: start,
        end_line: end,
        total_lines,
        truncated,
    })
}

#[tauri::command]
pub fn agent_write_file(
    workspace_path: String,
    path: String,
    content: String,
    create_dirs: Option<bool>,
) -> Result<AgentWriteFileResult, String> {
    let workspace_root = canonicalize_workspace(&workspace_path)?;
    let resolved = resolve_path_in_workspace(&workspace_root, &path, true)?;

    if let Some(parent) = resolved.parent() {
        if create_dirs.unwrap_or(false) {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        } else if !parent.exists() {
            return Err("Parent directory does not exist".to_string());
        }
    }

    fs::write(&resolved, content.as_bytes()).map_err(|e| e.to_string())?;
    Ok(AgentWriteFileResult {
        path: resolved.to_string_lossy().to_string(),
        bytes_written: content.len(),
    })
}

#[tauri::command]
pub fn agent_delete_file(
    workspace_path: String,
    path: String,
    allow_missing: Option<bool>,
) -> Result<AgentDeleteFileResult, String> {
    let workspace_root = canonicalize_workspace(&workspace_path)?;
    let resolved = resolve_path_in_workspace(&workspace_root, &path, true)?;

    if !resolved.exists() {
        if allow_missing.unwrap_or(true) {
            return Ok(AgentDeleteFileResult {
                path: resolved.to_string_lossy().to_string(),
                deleted: false,
            });
        }
        return Err("Path does not exist".to_string());
    }

    if !resolved.is_file() {
        return Err("Path is not a file".to_string());
    }

    fs::remove_file(&resolved).map_err(|e| e.to_string())?;
    Ok(AgentDeleteFileResult {
        path: resolved.to_string_lossy().to_string(),
        deleted: true,
    })
}

#[tauri::command]
pub fn agent_run_command(
    workspace_path: String,
    command: String,
    workdir: Option<String>,
    timeout_ms: Option<u64>,
) -> Result<AgentRunCommandResult, String> {
    let workspace_root = canonicalize_workspace(&workspace_path)?;
    let resolved_workdir = resolve_workdir_in_workspace(&workspace_root, workdir)?;
    let timeout = timeout_ms.unwrap_or(120_000).clamp(100, 300_000);

    run_shell_command(&command, &resolved_workdir, timeout)
}
