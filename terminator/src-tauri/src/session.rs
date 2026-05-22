// FILE: src-tauri/src/session.rs
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
pub struct WorkspaceSnapshot {
    pub id: String,
    pub name: String,
    pub root: TileSnapshot,
    #[serde(rename = "focusedPaneId")]
    pub focused_pane_id: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SessionSnapshot {
    pub workspaces: Vec<WorkspaceSnapshot>,
    #[serde(rename = "activeWorkspaceId")]
    pub active_workspace_id: String,
}

fn get_session_path(app: &AppHandle) -> PathBuf {
    let mut path = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    fs::create_dir_all(&path).ok();
    path.push("session.json");
    path
}

#[tauri::command]
pub fn save_session(snapshot: SessionSnapshot, app: tauri::AppHandle) -> Result<(), String> {
    let path = get_session_path(&app);
    if let Ok(contents) = serde_json::to_string_pretty(&snapshot) {
        if fs::write(path, contents).is_ok() {
            return Ok(());
        }
    }
    Ok(()) // Silently return on failure
}

#[tauri::command]
pub fn load_session(app: tauri::AppHandle) -> Option<SessionSnapshot> {
    let path = get_session_path(&app);
    if path.exists() {
        if let Ok(contents) = fs::read_to_string(path) {
            if let Ok(snapshot) = serde_json::from_str(&contents) {
                return Some(snapshot);
            }
        }
    }
    None
}
