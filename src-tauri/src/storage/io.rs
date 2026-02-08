use serde::Serialize;
use serde::de::DeserializeOwned;
use std::fs;
use std::path::Path;

use crate::core::constants::{DIFFS_DIR, MANIFEST_FILE, MESSAGES_DIR, PROJECTS_DIR, SCHEMA_VERSION, THREADS_DIR};
use crate::core::models::{ProjectRecord, StorageManifest, ThreadRecord};
use crate::storage::paths::{project_file, thread_file};
use crate::core::time::now_ms;

pub fn read_json_file<T: DeserializeOwned>(path: &Path) -> Result<T, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str::<T>(&content).map_err(|e| e.to_string())
}

pub fn write_json_file<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "Missing parent folder for JSON file".to_string())?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;

    let json = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, json).map_err(|e| e.to_string())?;

    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    fs::rename(&tmp, path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn read_json_list<T: DeserializeOwned>(dir: &Path) -> Result<Vec<T>, String> {
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut out = Vec::new();
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        out.push(read_json_file::<T>(&path)?);
    }
    Ok(out)
}

pub fn ensure_storage_ready(root: &Path) -> Result<(), String> {
    fs::create_dir_all(root).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join(PROJECTS_DIR)).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join(THREADS_DIR)).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join(MESSAGES_DIR)).map_err(|e| e.to_string())?;
    fs::create_dir_all(root.join(DIFFS_DIR)).map_err(|e| e.to_string())?;

    let manifest_path = root.join(MANIFEST_FILE);
    if manifest_path.exists() {
        let mut manifest = read_json_file::<StorageManifest>(&manifest_path)?;
        manifest.updated_at_ms = now_ms();
        write_json_file(&manifest_path, &manifest)?;
    } else {
        let ts = now_ms();
        let manifest = StorageManifest {
            schema_version: SCHEMA_VERSION,
            created_at_ms: ts,
            updated_at_ms: ts,
        };
        write_json_file(&manifest_path, &manifest)?;
    }

    Ok(())
}

pub fn require_project(root: &Path, project_id: &str) -> Result<ProjectRecord, String> {
    let path = project_file(root, project_id);
    if !path.exists() {
        return Err(format!("Project not found: {project_id}"));
    }
    read_json_file::<ProjectRecord>(&path)
}

pub fn require_thread(root: &Path, thread_id: &str) -> Result<ThreadRecord, String> {
    let path = thread_file(root, thread_id);
    if !path.exists() {
        return Err(format!("Thread not found: {thread_id}"));
    }
    read_json_file::<ThreadRecord>(&path)
}
