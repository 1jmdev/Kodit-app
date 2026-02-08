use std::fs;

use tauri::AppHandle;
use uuid::Uuid;

use crate::core::models::{
    AgentMode, DiffCreateInput, DiffRecord, FileChangeType, FileSnapshotChange, MessageCreateInput,
    MessageRecord,
};
use crate::storage::io::{
    ensure_storage_ready, read_json_file, read_json_list, require_thread, write_json_file,
};
use crate::storage::paths::{diff_file, messages_file, storage_root, thread_diffs_dir, thread_file};
use crate::core::time::now_ms;

#[tauri::command]
pub fn add_message(app: AppHandle, input: MessageCreateInput) -> Result<MessageRecord, String> {
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
pub fn list_messages(app: AppHandle, thread_id: String) -> Result<Vec<MessageRecord>, String> {
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
pub fn save_diff(app: AppHandle, input: DiffCreateInput) -> Result<DiffRecord, String> {
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
pub fn list_diffs(app: AppHandle, thread_id: String) -> Result<Vec<DiffRecord>, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;
    let _thread = require_thread(&root, &thread_id)?;

    let mut diffs = read_json_list::<DiffRecord>(&thread_diffs_dir(&root, &thread_id))?;
    diffs.sort_by_key(|d| d.created_at_ms);
    Ok(diffs)
}

#[tauri::command]
pub fn clear_diffs(app: AppHandle, thread_id: String) -> Result<(), String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;
    let _thread = require_thread(&root, &thread_id)?;

    let dir = thread_diffs_dir(&root, &thread_id);
    if !dir.exists() {
        return Ok(());
    }

    fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(())
}
