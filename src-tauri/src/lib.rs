use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::AppHandle;
use tauri::Manager;
use uuid::Uuid;

const STORAGE_DIR: &str = "storage";
const PROJECTS_DIR: &str = "projects";
const THREADS_DIR: &str = "threads";
const MESSAGES_DIR: &str = "messages";
const DIFFS_DIR: &str = "diffs";
const MANIFEST_FILE: &str = "manifest.json";
const SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MessageRole {
    User,
    Agent,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentMode {
    Build,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TokenUsage {
    pub input: u64,
    pub output: u64,
    pub reasoning: u64,
    pub cache_read: u64,
    pub cache_write: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectRecord {
    pub id: String,
    pub name: String,
    pub workspace_path: String,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadRecord {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub mode: AgentMode,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageRecord {
    pub id: String,
    pub thread_id: String,
    pub role: MessageRole,
    pub content: String,
    pub model: Option<String>,
    pub provider: Option<String>,
    pub mode: AgentMode,
    pub tokens: TokenUsage,
    pub parent_id: Option<String>,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
    pub sequence: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FileChangeType {
    Created,
    Modified,
    Deleted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSnapshotChange {
    pub file_path: String,
    pub change_type: FileChangeType,
    pub old_content: Option<String>,
    pub new_content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffRecord {
    pub id: String,
    pub thread_id: String,
    pub message_id: Option<String>,
    pub summary: Option<String>,
    pub created_at_ms: u64,
    pub files: Vec<FileSnapshotChange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageManifest {
    pub schema_version: u32,
    pub created_at_ms: u64,
    pub updated_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectUpsertInput {
    pub id: Option<String>,
    pub name: String,
    pub workspace_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThreadUpsertInput {
    pub id: Option<String>,
    pub project_id: String,
    pub title: Option<String>,
    pub mode: Option<AgentMode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageCreateInput {
    pub id: Option<String>,
    pub thread_id: String,
    pub role: MessageRole,
    pub content: String,
    pub model: Option<String>,
    pub provider: Option<String>,
    pub mode: Option<AgentMode>,
    pub tokens: Option<TokenUsage>,
    pub parent_id: Option<String>,
    pub created_at_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSnapshotChangeInput {
    pub file_path: String,
    pub old_content: Option<String>,
    pub new_content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffCreateInput {
    pub id: Option<String>,
    pub thread_id: String,
    pub message_id: Option<String>,
    pub summary: Option<String>,
    pub files: Vec<FileSnapshotChangeInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageInfo {
    pub base_path: String,
    pub schema_version: u32,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn storage_root(app: &AppHandle) -> Result<PathBuf, String> {
    let mut root = app.path().app_data_dir().map_err(|e| e.to_string())?;
    root.push(STORAGE_DIR);
    Ok(root)
}

fn project_file(root: &Path, id: &str) -> PathBuf {
    root.join(PROJECTS_DIR).join(format!("{id}.json"))
}

fn thread_file(root: &Path, id: &str) -> PathBuf {
    root.join(THREADS_DIR).join(format!("{id}.json"))
}

fn messages_file(root: &Path, thread_id: &str) -> PathBuf {
    root.join(MESSAGES_DIR).join(format!("{thread_id}.json"))
}

fn thread_diffs_dir(root: &Path, thread_id: &str) -> PathBuf {
    root.join(DIFFS_DIR).join(thread_id)
}

fn diff_file(root: &Path, thread_id: &str, diff_id: &str) -> PathBuf {
    thread_diffs_dir(root, thread_id).join(format!("{diff_id}.json"))
}

fn read_json_file<T: DeserializeOwned>(path: &Path) -> Result<T, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str::<T>(&content).map_err(|e| e.to_string())
}

fn write_json_file<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
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

fn read_json_list<T: DeserializeOwned>(dir: &Path) -> Result<Vec<T>, String> {
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

fn ensure_storage_ready(root: &Path) -> Result<(), String> {
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

fn require_project(root: &Path, project_id: &str) -> Result<ProjectRecord, String> {
    let path = project_file(root, project_id);
    if !path.exists() {
        return Err(format!("Project not found: {project_id}"));
    }
    read_json_file::<ProjectRecord>(&path)
}

fn require_thread(root: &Path, thread_id: &str) -> Result<ThreadRecord, String> {
    let path = thread_file(root, thread_id);
    if !path.exists() {
        return Err(format!("Thread not found: {thread_id}"));
    }
    read_json_file::<ThreadRecord>(&path)
}

#[tauri::command]
fn storage_info(app: AppHandle) -> Result<StorageInfo, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;
    Ok(StorageInfo {
        base_path: root.to_string_lossy().to_string(),
        schema_version: SCHEMA_VERSION,
    })
}

#[tauri::command]
fn upsert_project(app: AppHandle, input: ProjectUpsertInput) -> Result<ProjectRecord, String> {
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
fn list_projects(app: AppHandle) -> Result<Vec<ProjectRecord>, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;

    let mut projects = read_json_list::<ProjectRecord>(&root.join(PROJECTS_DIR))?;
    projects.sort_by_key(|p| std::cmp::Reverse(p.updated_at_ms));
    Ok(projects)
}

#[tauri::command]
fn upsert_thread(app: AppHandle, input: ThreadUpsertInput) -> Result<ThreadRecord, String> {
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
fn list_threads(app: AppHandle, project_id: String) -> Result<Vec<ThreadRecord>, String> {
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

#[tauri::command]
fn add_message(app: AppHandle, input: MessageCreateInput) -> Result<MessageRecord, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;

    let mut thread = require_thread(&root, &input.thread_id)?;
    let file = messages_file(&root, &thread.id);
    let mut messages = if file.exists() {
        read_json_file::<Vec<MessageRecord>>(&file)?
    } else {
        Vec::new()
    };

    let ts = input.created_at_ms.unwrap_or_else(now_ms);
    let sequence = messages.last().map(|m| m.sequence + 1).unwrap_or(1);
    let record = MessageRecord {
        id: input.id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thread_id: thread.id.clone(),
        role: input.role,
        content: input.content,
        model: input.model,
        provider: input.provider,
        mode: input.mode.unwrap_or(AgentMode::Build),
        tokens: input.tokens.unwrap_or_default(),
        parent_id: input.parent_id,
        created_at_ms: ts,
        updated_at_ms: ts,
        sequence,
    };

    messages.push(record.clone());
    write_json_file(&file, &messages)?;

    thread.updated_at_ms = ts;
    write_json_file(&thread_file(&root, &thread.id), &thread)?;

    Ok(record)
}

#[tauri::command]
fn list_messages(app: AppHandle, thread_id: String) -> Result<Vec<MessageRecord>, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;
    let _thread = require_thread(&root, &thread_id)?;

    let file = messages_file(&root, &thread_id);
    if !file.exists() {
        return Ok(Vec::new());
    }

    let mut messages = read_json_file::<Vec<MessageRecord>>(&file)?;
    messages.sort_by_key(|m| (m.created_at_ms, m.sequence));
    Ok(messages)
}

#[tauri::command]
fn save_diff(app: AppHandle, input: DiffCreateInput) -> Result<DiffRecord, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;
    let _thread = require_thread(&root, &input.thread_id)?;

    let mut files = Vec::with_capacity(input.files.len());
    for file in input.files {
        let change_type = match (&file.old_content, &file.new_content) {
            (None, Some(_)) => FileChangeType::Created,
            (Some(_), None) => FileChangeType::Deleted,
            _ => FileChangeType::Modified,
        };
        files.push(FileSnapshotChange {
            file_path: file.file_path,
            change_type,
            old_content: file.old_content,
            new_content: file.new_content,
        });
    }

    let diff = DiffRecord {
        id: input.id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thread_id: input.thread_id,
        message_id: input.message_id,
        summary: input.summary,
        created_at_ms: now_ms(),
        files,
    };

    write_json_file(&diff_file(&root, &diff.thread_id, &diff.id), &diff)?;
    Ok(diff)
}

#[tauri::command]
fn list_diffs(app: AppHandle, thread_id: String) -> Result<Vec<DiffRecord>, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;
    let _thread = require_thread(&root, &thread_id)?;

    let mut diffs = read_json_list::<DiffRecord>(&thread_diffs_dir(&root, &thread_id))?;
    diffs.sort_by_key(|d| d.created_at_ms);
    Ok(diffs)
}

#[tauri::command]
fn pick_folder() -> Option<String> {
    rfd::FileDialog::new()
        .pick_folder()
        .map(|path| path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let root = storage_root(&app.handle()).map_err(std::io::Error::other)?;
            ensure_storage_ready(&root).map_err(std::io::Error::other)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            storage_info,
            upsert_project,
            list_projects,
            upsert_thread,
            list_threads,
            add_message,
            list_messages,
            save_diff,
            list_diffs,
            pick_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
