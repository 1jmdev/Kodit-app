use tauri::AppHandle;

use crate::core::constants::SCHEMA_VERSION;
use crate::core::models::StorageInfo;
use crate::storage::io::ensure_storage_ready;
use crate::storage::paths::storage_root;

#[tauri::command]
pub fn storage_info(app: AppHandle) -> Result<StorageInfo, String> {
    let root = storage_root(&app)?;
    ensure_storage_ready(&root)?;
    Ok(StorageInfo {
        base_path: root.to_string_lossy().to_string(),
        schema_version: SCHEMA_VERSION,
    })
}
