use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Clone)]
pub struct PaneSnapshot {
    pub id: String,
    pub cwd: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum TileSnapshot {
    #[serde(rename = "pane")]
    Pane(PaneSnapshot),
    #[serde(rename = "split")]
    Split {
        id: String,
        direction: String,
        ratio: f32,
        first: Box<TileSnapshot>,
        second: Box<TileSnapshot>,
    },
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSnapshot {
    pub id: String,
    pub name: String,
    pub root: TileSnapshot,
    pub focused_pane_id: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionSnapshot {
    pub workspaces: Vec<WorkspaceSnapshot>,
    pub active_workspace_id: String,
}

fn get_session_path(app: &AppHandle) -> PathBuf {
    let mut path = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    fs::create_dir_all(&path).ok();
    path.push("session.json");
    path
}

#[tauri::command]
pub fn save_session(snapshot: SessionSnapshot, app: AppHandle) -> Result<(), String> {
    let path = get_session_path(&app);
    match serde_json::to_string_pretty(&snapshot) {
        Ok(contents) => {
            if fs::write(path, contents).is_ok() {
                Ok(())
            } else {
                Err("Failed to write session file".to_string())
            }
        }
        Err(_) => Err("Failed to serialize session".to_string()),
    }
}

#[tauri::command]
pub fn load_session(app: AppHandle) -> Option<SessionSnapshot> {
    let path = get_session_path(&app);
    if !path.exists() {
        return None;
    }
    let contents = fs::read_to_string(path).ok()?;
    serde_json::from_str(&contents).ok()
}

#[tauri::command]
pub fn clear_session(app: AppHandle) -> Result<(), String> {
    let path = get_session_path(&app);
    if path.exists() {
        fs::remove_file(path).unwrap_or(());
    }
    Ok(())
}
