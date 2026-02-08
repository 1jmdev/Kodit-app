use tauri::AppHandle;

use crate::core::models::AuthConfig;
use crate::storage::io::{read_json_file, write_json_file};
use crate::storage::paths::auth_config_path;

#[tauri::command]
pub fn read_auth_config(app: AppHandle) -> Result<AuthConfig, String> {
    let path = auth_config_path(&app)?;
    if !path.exists() {
        return Ok(AuthConfig::default());
    }

    match read_json_file::<AuthConfig>(&path) {
        Ok(config) => Ok(config),
        Err(_) => Ok(AuthConfig::default()),
    }
}

#[tauri::command]
pub fn write_auth_config(app: AppHandle, input: AuthConfig) -> Result<AuthConfig, String> {
    let path = auth_config_path(&app)?;
    write_json_file(&path, &input)?;
    Ok(input)
}
