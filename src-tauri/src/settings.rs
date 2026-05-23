// FILE: src-tauri/src/settings.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub preset: String,
    pub gap_size: u32,
    pub border_width: u32,
    pub border_color: Option<String>,
    pub corner_radius: u32,
    pub transparency: u32,
    pub blur: u32,
    pub padding: u32,
    pub focus_animation: String,
    pub animation_duration: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontSettings {
    pub family: String,
    pub size: u32,
    pub cursor_style: String,
    pub cursor_blink: bool,
    pub scrollback: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Preset {
    pub name: String,
    pub built_in: bool,
    pub appearance: AppearanceSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub shell: String,
    pub theme: String,
    pub appearance: AppearanceSettings,
    pub font: FontSettings,
    pub presets: Vec<Preset>,
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
        keybindings.insert("commandPalette".to_string(), "Meta+Shift+P".to_string());
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
            appearance: default_appearance(),
            font: default_font(),
            presets: default_presets(),
            keybindings,
        }
    }
}

fn default_appearance() -> AppearanceSettings {
    AppearanceSettings {
        preset: "minimal".to_string(),
        gap_size: 0,
        border_width: 0,
        border_color: None,
        corner_radius: 0,
        transparency: 0,
        blur: 0,
        padding: 8,
        focus_animation: "none".to_string(),
        animation_duration: 120,
    }
}

fn default_font() -> FontSettings {
    FontSettings {
        family: "JetBrains Mono".to_string(),
        size: 13,
        cursor_style: "block".to_string(),
        cursor_blink: true,
        scrollback: 5000,
    }
}

fn default_presets() -> Vec<Preset> {
    vec![
        Preset {
            name: "Minimal".to_string(),
            built_in: true,
            appearance: AppearanceSettings {
                preset: "minimal".to_string(),
                gap_size: 0,
                border_width: 0,
                border_color: None,
                corner_radius: 0,
                transparency: 0,
                blur: 0,
                padding: 4,
                focus_animation: "none".to_string(),
                animation_duration: 0,
            },
        },
        Preset {
            name: "Fancy".to_string(),
            built_in: true,
            appearance: AppearanceSettings {
                preset: "fancy".to_string(),
                gap_size: 8,
                border_width: 2,
                border_color: Some("accent".to_string()),
                corner_radius: 8,
                transparency: 15,
                blur: 12,
                padding: 12,
                focus_animation: "fade".to_string(),
                animation_duration: 150,
            },
        },
    ]
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

fn migrate_settings(mut json: Value) -> Value {
    if !json.is_object() {
        return serde_json::to_value(Settings::default()).unwrap();
    }

    let mut modified = false;

    if json.get("appearance").is_none() {
        println!("Migrating settings: injecting default 'appearance'");
        json["appearance"] = serde_json::to_value(default_appearance()).unwrap();
        modified = true;
    }

    if json.get("font").is_none() {
        println!("Migrating settings: injecting default 'font'");
        json["font"] = serde_json::to_value(default_font()).unwrap();
        modified = true;
    }

    if json.get("presets").is_none() {
        println!("Migrating settings: injecting default 'presets'");
        json["presets"] = serde_json::to_value(default_presets()).unwrap();
        modified = true;
    }

    if let Some(kb) = json.get_mut("keybindings") {
        if kb.is_object() {
            if kb.get("commandPalette").is_none() {
                println!("Migrating settings: injecting 'commandPalette' keybinding");
                kb["commandPalette"] = Value::String("Meta+Shift+P".to_string());
                modified = true;
            }
            if kb.get("closeWorkspace").is_none() {
                println!("Migrating settings: injecting 'closeWorkspace' keybinding");
                kb["closeWorkspace"] = Value::String("Meta+Shift+W".to_string());
                modified = true;
            }
        }
    }

    if modified {
        json["_migrated"] = Value::Bool(true);
    }

    json
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Result<Settings, String> {
    let path = get_settings_path(&app);
    if path.exists() {
        if let Ok(contents) = fs::read_to_string(&path) {
            if let Ok(mut json) = serde_json::from_str::<Value>(&contents) {
                json = migrate_settings(json);
                let was_migrated = json.get("_migrated").is_some();
                if let Some(map) = json.as_object_mut() {
                    map.remove("_migrated");
                }

                if let Ok(settings) = serde_json::from_value::<Settings>(json) {
                    if was_migrated {
                        let _ = save_settings(app.clone(), settings.clone());
                    }
                    return Ok(settings);
                }
            }
        }
    }
    Ok(Settings::default())
}

#[tauri::command]
pub fn get_available_shells() -> Vec<String> {
    let mut shells = vec!["/bin/zsh".to_string()];
    if let Ok(contents) = fs::read_to_string("/etc/shells") {
        let mut found = Vec::new();
        for line in contents.lines() {
            let line = line.trim();
            if line.starts_with('/') {
                if std::path::Path::new(line).exists() {
                    found.push(line.to_string());
                }
            }
        }
        if !found.is_empty() {
            shells = found;
        }
    }
    shells
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
