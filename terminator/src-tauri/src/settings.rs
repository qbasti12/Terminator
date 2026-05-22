// FILE: src-tauri/src/settings.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub shell: String,
    pub theme: String,
    pub keybindings: HashMap<String, String>,
}

impl Default for Settings {
    fn default() -> Self {
        let mut keybindings = HashMap::new();
        keybindings.insert("newWorkspace".to_string(), "Meta+Shift+T".to_string());
        keybindings.insert("closeWorkspace".to_string(), "Meta+Shift+W".to_string());
        keybindings.insert("newTerminal".to_string(), "Meta+T".to_string());
        keybindings.insert("closeTerminal".to_string(), "Meta+W".to_string());
        keybindings.insert("focusUp".to_string(), "Meta+ArrowUp".to_string());
        keybindings.insert("focusDown".to_string(), "Meta+ArrowDown".to_string());
        keybindings.insert("focusLeft".to_string(), "Meta+ArrowLeft".to_string());
        keybindings.insert("focusRight".to_string(), "Meta+ArrowRight".to_string());
        keybindings.insert("openSearch".to_string(), "Meta+F".to_string());
        keybindings.insert("openSettings".to_string(), "Meta+Comma".to_string());
        keybindings.insert("switchWorkspace1".to_string(), "Meta+1".to_string());
        keybindings.insert("switchWorkspace2".to_string(), "Meta+2".to_string());
        keybindings.insert("switchWorkspace3".to_string(), "Meta+3".to_string());
        keybindings.insert("switchWorkspace4".to_string(), "Meta+4".to_string());
        keybindings.insert("switchWorkspace5".to_string(), "Meta+5".to_string());
        keybindings.insert("switchWorkspace6".to_string(), "Meta+6".to_string());
        keybindings.insert("switchWorkspace7".to_string(), "Meta+7".to_string());
        keybindings.insert("switchWorkspace8".to_string(), "Meta+8".to_string());
        keybindings.insert("switchWorkspace9".to_string(), "Meta+9".to_string());

        Settings {
            shell: "/bin/zsh".to_string(),
            theme: "catppuccin-mocha".to_string(),
            keybindings,
        }
    }
}

fn get_settings_path(app: &AppHandle) -> PathBuf {
    let mut path = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    fs::create_dir_all(&path).ok();
    path.push("settings.json");
    path
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Result<Settings, String> {
    let path = get_settings_path(&app);
    if path.exists() {
        if let Ok(contents) = fs::read_to_string(path) {
            if let Ok(settings) = serde_json::from_str(&contents) {
                return Ok(settings);
            }
        }
    }
    Ok(Settings::default())
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let path = get_settings_path(&app);
    if let Ok(contents) = serde_json::to_string_pretty(&settings) {
        if fs::write(path, contents).is_ok() {
            return Ok(());
        }
    }
    Err("Failed to save settings".to_string())
}
