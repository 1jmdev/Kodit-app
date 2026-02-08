use std::fs;
use std::path::{Component, Path, PathBuf};

pub fn canonicalize_workspace(workspace_path: &str) -> Result<PathBuf, String> {
    let workspace = PathBuf::from(workspace_path);
    if !workspace.is_absolute() {
        return Err("Workspace path must be absolute".to_string());
    }
    if !workspace.exists() {
        return Err("Workspace path does not exist".to_string());
    }
    fs::canonicalize(workspace).map_err(|e| e.to_string())
}

pub fn resolve_path_in_workspace(
    workspace_root: &Path,
    raw_path: &str,
    allow_missing: bool,
) -> Result<PathBuf, String> {
    let candidate_input = PathBuf::from(raw_path);
    let candidate = if candidate_input.is_absolute() {
        candidate_input
    } else {
        workspace_root.join(candidate_input)
    };

    if candidate.exists() {
        let canonical = fs::canonicalize(&candidate).map_err(|e| e.to_string())?;
        if !canonical.starts_with(workspace_root) {
            return Err("Path is outside workspace".to_string());
        }
        return Ok(canonical);
    }

    if !allow_missing {
        return Err("Path does not exist".to_string());
    }

    for component in candidate.components() {
        if matches!(component, Component::ParentDir) {
            return Err("Parent directory traversal is not allowed".to_string());
        }
    }

    let mut current = candidate.as_path();
    while !current.exists() {
        current = current
            .parent()
            .ok_or_else(|| "Could not resolve path parent".to_string())?;
    }

    let existing_parent = fs::canonicalize(current).map_err(|e| e.to_string())?;
    if !existing_parent.starts_with(workspace_root) {
        return Err("Path is outside workspace".to_string());
    }

    Ok(candidate)
}

pub fn resolve_workdir_in_workspace(
    workspace_root: &Path,
    workdir: Option<String>,
) -> Result<PathBuf, String> {
    let desired = workdir.unwrap_or_else(|| workspace_root.to_string_lossy().to_string());
    let resolved = resolve_path_in_workspace(workspace_root, &desired, false)?;
    if !resolved.is_dir() {
        return Err("Workdir must be an existing directory".to_string());
    }
    Ok(resolved)
}
