// ============================================================================
// Smart Storage AI - Tauri Backend
// ============================================================================

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod storage;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::files::list_files,
            commands::files::get_file_info,
            commands::files::move_file,
            commands::files::create_folder,
            commands::organize::generate_plan,
            commands::organize::apply_plan,
            commands::history::get_history,
            commands::history::undo_batch,
            // Model download commands
            commands::model::check_model_exists,
            commands::model::get_model_config,
            commands::model::download_model,
            commands::model::cancel_download,
            commands::model::delete_model,
            commands::model::get_model_path,
        ])
        .setup(|app| {
            // Initialize database
            let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");

            let db_path = app_data_dir.join("smart_storage.db");
            storage::init_database(&db_path).expect("Failed to initialize database");

            println!("Smart Storage AI initialized");
            println!("Database: {:?}", db_path);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
