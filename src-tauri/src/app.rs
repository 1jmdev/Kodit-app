use crate::{agent, auth, storage, ui};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let root = storage::paths::storage_root(&app.handle()).map_err(std::io::Error::other)?;
            storage::io::ensure_storage_ready(&root).map_err(std::io::Error::other)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            storage::meta_commands::storage_info,
            storage::project_thread_commands::upsert_project,
            storage::project_thread_commands::list_projects,
            storage::project_thread_commands::upsert_thread,
            storage::project_thread_commands::list_threads,
            storage::message_diff_commands::add_message,
            storage::message_diff_commands::list_messages,
            storage::message_diff_commands::save_diff,
            storage::message_diff_commands::list_diffs,
            storage::message_diff_commands::clear_diffs,
            auth::commands::read_auth_config,
            auth::commands::write_auth_config,
            ui::commands::pick_folder,
            agent::commands::agent_read_file,
            agent::commands::agent_write_file,
            agent::commands::agent_delete_file,
            agent::commands::agent_run_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
