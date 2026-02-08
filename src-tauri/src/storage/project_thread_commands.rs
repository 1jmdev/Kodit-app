use tauri::AppHandle;
use uuid::Uuid;

use crate::core::constants::{PROJECTS_DIR, THREADS_DIR};
use crate::core::models::{AgentMode, ProjectRecord, ProjectUpsertInput, ThreadRecord, ThreadUpsertInput};
use crate::storage::io::{
    ensure_storage_ready, read_json_file, read_json_list, require_project, write_json_file,
};
use crate::storage::paths::{project_file, storage_root, thread_file};
use crate::core::time::now_ms;

#[tauri::command]
pub fn upsert_project(app: AppHandle, input: ProjectUpsertInput) -> Result<ProjectRecord, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;

    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let path = project_file(&root, &id);
    let ts = now_ms();

    let record = if path.exists() {
        let existing = read_json_file::<ProjectRecord>(&path)?;
        ProjectRecord {
            id,
            name: input.name,
            workspace_path: input.workspace_path,
            created_at_ms: existing.created_at_ms,
            updated_at_ms: ts,
        }
    } else {
        ProjectRecord {
            id,
            name: input.name,
            workspace_path: input.workspace_path,
            created_at_ms: ts,
            updated_at_ms: ts,
        }
    };

    write_json_file(&path, &record)?;
    Ok(record)
}

#[tauri::command]
pub fn list_projects(app: AppHandle) -> Result<Vec<ProjectRecord>, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;

    let mut projects = read_json_list::<ProjectRecord>(&root.join(PROJECTS_DIR))?;
    projects.sort_by_key(|p| std::cmp::Reverse(p.updated_at_ms));
    Ok(projects)
}

#[tauri::command]
pub fn upsert_thread(app: AppHandle, input: ThreadUpsertInput) -> Result<ThreadRecord, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;
    let _project = require_project(&root, &input.project_id)?;

    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let path = thread_file(&root, &id);
    let ts = now_ms();

    let record = if path.exists() {
        let existing = read_json_file::<ThreadRecord>(&path)?;
        ThreadRecord {
            id,
            project_id: input.project_id,
            title: input.title.unwrap_or(existing.title),
            mode: input.mode.unwrap_or(existing.mode),
            created_at_ms: existing.created_at_ms,
            updated_at_ms: ts,
        }
    } else {
        ThreadRecord {
            id,
            project_id: input.project_id,
            title: input.title.unwrap_or_else(|| "New thread".to_string()),
            mode: input.mode.unwrap_or(AgentMode::Build),
            created_at_ms: ts,
            updated_at_ms: ts,
        }
    };

    write_json_file(&path, &record)?;
    Ok(record)
}

#[tauri::command]
pub fn list_threads(app: AppHandle, project_id: String) -> Result<Vec<ThreadRecord>, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;
    let _project = require_project(&root, &project_id)?;

    let mut threads = read_json_list::<ThreadRecord>(&root.join(THREADS_DIR))?
        .into_iter()
        .filter(|t| t.project_id == project_id)
        .collect::<Vec<_>>();
    threads.sort_by_key(|t| std::cmp::Reverse(t.updated_at_ms));
    Ok(threads)
}
