// FILE: src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod pty_manager;
mod session;
mod settings;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            pty_manager::spawn_pty,
            pty_manager::kill_pty,
            pty_manager::write_pty,
            pty_manager::resize_pty,
            pty_manager::get_cwd,
            pty_manager::get_process_name,
            settings::get_settings,
            settings::save_settings,
            settings::get_available_shells,
            session::save_session,
            session::load_session,
            session::clear_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
