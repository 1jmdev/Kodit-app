use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AuthConfig {
    pub api_keys: HashMap<String, String>,
}
