use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

use crate::core::constants::{
    AUTH_CONFIG_REL_PATH, DIFFS_DIR, MESSAGES_DIR, PROJECTS_DIR, STORAGE_DIR, THREADS_DIR,
};

pub fn storage_root(app: &AppHandle) -> Result<PathBuf, String> {
    let mut root = app.path().app_data_dir().map_err(|e| e.to_string())?;
    root.push(STORAGE_DIR);
    Ok(root)
}

pub fn auth_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let home_dir = app.path().home_dir().map_err(|e| e.to_string())?;
    Ok(home_dir.join(AUTH_CONFIG_REL_PATH))
}

pub fn project_file(root: &Path, id: &str) -> PathBuf {
    root.join(PROJECTS_DIR).join(format!("{id}.json"))
}

pub fn thread_file(root: &Path, id: &str) -> PathBuf {
    root.join(THREADS_DIR).join(format!("{id}.json"))
}

pub fn messages_file(root: &Path, thread_id: &str) -> PathBuf {
    root.join(MESSAGES_DIR).join(format!("{thread_id}.json"))
}

pub fn thread_diffs_dir(root: &Path, thread_id: &str) -> PathBuf {
    root.join(DIFFS_DIR).join(thread_id)
}

pub fn diff_file(root: &Path, thread_id: &str, diff_id: &str) -> PathBuf {
    thread_diffs_dir(root, thread_id).join(format!("{diff_id}.json"))
}
