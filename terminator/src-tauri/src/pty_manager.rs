// FILE: src-tauri/src/pty_manager.rs
use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use sysinfo::{ProcessRefreshKind, RefreshKind, System};
use tauri::{AppHandle, Emitter};

type PtyId = String;

pub struct PtyHandle {
    pub child: Box<dyn portable_pty::Child + Send + Sync>,
    pub writer: Box<dyn Write + Send>, // Remove Sync
    pub master_pty: Box<dyn portable_pty::MasterPty + Send>, // Remove Sync
}

lazy_static::lazy_static! {
    static ref PTY_MAP: Arc<Mutex<HashMap<PtyId, PtyHandle>>> = Arc::new(Mutex::new(HashMap::new()));
}

#[derive(Clone, Serialize)]
struct PtyDataPayload {
    id: PtyId,
    data: Vec<u8>,
}

#[derive(Clone, Serialize)]
struct PtyExitPayload {
    id: PtyId,
    code: i32,
}

#[tauri::command]
pub fn spawn_pty(app: AppHandle, shell: String, cols: u16, rows: u16) -> Result<PtyId, String> {
    let pty_system = NativePtySystem::default();

    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let cmd = CommandBuilder::new(shell);
    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;

    let id = uuid::Uuid::new_v4().to_string();

    let pty_handle = PtyHandle {
        child,
        writer,
        master_pty: pair.master,
    };

    PTY_MAP.lock().unwrap().insert(id.clone(), pty_handle);

    let id_clone = id.clone();
    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let _ = app.emit(
                        "pty-data",
                        PtyDataPayload {
                            id: id_clone.clone(),
                            data: buf[..n].to_vec(),
                        },
                    );
                }
                Err(_) => break,
            }
        }

        let _ = app.emit(
            "pty-exit",
            PtyExitPayload {
                id: id_clone.clone(),
                code: 0,
            },
        );
    });

    Ok(id)
}

#[tauri::command]
pub fn kill_pty(id: PtyId) -> Result<(), String> {
    let mut map = PTY_MAP.lock().unwrap();
    if let Some(mut handle) = map.remove(&id) {
        let _ = handle.child.kill();
    }
    Ok(())
}

#[tauri::command]
pub fn write_pty(id: PtyId, data: Vec<u8>) -> Result<(), String> {
    let mut map = PTY_MAP.lock().unwrap();
    if let Some(handle) = map.get_mut(&id) {
        let _ = handle.writer.write_all(&data);
    }
    Ok(())
}

#[tauri::command]
pub fn resize_pty(id: PtyId, cols: u16, rows: u16) -> Result<(), String> {
    let map = PTY_MAP.lock().unwrap();
    if let Some(handle) = map.get(&id) {
        let _ = handle.master_pty.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        });
    }
    Ok(())
}

#[tauri::command]
pub fn get_cwd(id: PtyId) -> Result<String, String> {
    let map = PTY_MAP.lock().unwrap();
    if let Some(handle) = map.get(&id) {
        if let Some(pid) = handle.child.process_id() {
            if let Ok(cwd) = std::fs::read_link(format!("/proc/{}/cwd", pid)) {
                return Ok(cwd.to_string_lossy().to_string());
            }
        }
    }
    Ok(String::new())
}

#[tauri::command]
pub fn get_process_name(id: PtyId) -> Result<String, String> {
    let map = PTY_MAP.lock().unwrap();
    if let Some(handle) = map.get(&id) {
        if let Some(pid) = handle.child.process_id() {
            let mut sys = System::new_with_specifics(
                RefreshKind::new().with_processes(ProcessRefreshKind::new()),
            );
            sys.refresh_processes();
            if let Some(process) = sys.process(sysinfo::Pid::from_u32(pid)) {
                return Ok(process.name().to_string());
            }
        }
    }
    Ok(String::new())
}
