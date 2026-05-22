<!-- FILE: README.md -->
# TERMINATOR

> A fast, minimal, tiling terminal workspace manager for macOS.

![Tauri](https://img.shields.io/badge/Tauri-v2-CBA6F7)
![Rust](https://img.shields.io/badge/Rust-backend-F38BA8)
![React](https://img.shields.io/badge/React-18-89B4FA)
![xterm.js](https://img.shields.io/badge/xterm.js-WebGL-A6E3A1)
![Catppuccin](https://img.shields.io/badge/Theme-Catppuccin_Mocha-1E1E2E)

<!-- Add a screenshot here: docs/screenshot.png -->
```screenshot
```

## Features
- Dwindle tiling logic for automatic pane splitting
- Workspaces as tabs for easy organization
- High-performance WebGL terminal rendering via xterm.js
- Configurable keybindings
- Per-pane status bar showing current working directory and foreground process
- Built-in settings GUI
- Warn-on-close for active processes
- Beautiful Catppuccin Mocha theme out of the box
- Zero telemetry. Fully offline.

## Requirements
- macOS 12 Monterey or later
- Rust (stable, via rustup)
- Node.js 18+
- Xcode Command Line Tools

## Installation

```bash
git clone <repo> terminator
cd terminator
npm install
cargo build
npm run tauri dev
```

To build for production:

```bash
npm run tauri build
```

## Keybindings

| Action | Default shortcut |
| --- | --- |
| New Workspace | ⌘⇧T |
| Close Workspace | ⌘⇧W |
| New Terminal | ⌘T |
| Close Terminal | ⌘W |
| Focus Up | ⌘↑ |
| Focus Down | ⌘↓ |
| Focus Left | ⌘← |
| Focus Right | ⌘→ |
| Open Search | ⌘F |
| Open Settings | ⌘, |
| Switch Workspace 1-9 | ⌘1 - ⌘9 |

## Configuration

Settings are saved in JSON format at:
`~/Library/Application Support/terminator/settings.json`

```json
{
  "shell": "/bin/zsh",
  "theme": "catppuccin-mocha",
  "keybindings": {
    "newWorkspace": "Meta+Shift+T",
    "closeWorkspace": "Meta+Shift+W",
    "newTerminal": "Meta+T",
    "closeTerminal": "Meta+W",
    "focusUp": "Meta+ArrowUp",
    "focusDown": "Meta+ArrowDown",
    "focusLeft": "Meta+ArrowLeft",
    "focusRight": "Meta+ArrowRight",
    "openSearch": "Meta+F",
    "openSettings": "Meta+Comma",
    "switchWorkspace1": "Meta+1",
    "switchWorkspace2": "Meta+2",
    "switchWorkspace3": "Meta+3",
    "switchWorkspace4": "Meta+4",
    "switchWorkspace5": "Meta+5",
    "switchWorkspace6": "Meta+6",
    "switchWorkspace7": "Meta+7",
    "switchWorkspace8": "Meta+8",
    "switchWorkspace9": "Meta+9"
  }
}
```

- **shell**: The shell executable to run in new terminals.
- **theme**: The color theme to use (currently only "catppuccin-mocha").
- **keybindings**: A map of actions to key combinations.

## Tiling model

Terminator uses a dwindle tiling model. When you split a pane, it divides the currently focused pane into two based on the split direction (horizontal or vertical) which is calculated from the cursor position. The remaining space is continually subdivided as you add more panes.

```text
[ A ] -> Split Horizontal -> [ A | B ] -> Split Vertical on A -> [ [A/C] | B ]
```

## Architecture

Terminator is built with a three-layer architecture:
- **macOS PTY**: The native pseudoterminal interface.
- **Rust Backend**: Manages PTY processes using the `portable-pty` crate and handles IPC via Tauri.
- **React Frontend**: Renders the UI and terminal emulators using `xterm.js` with the WebGL addon for fast, hardware-accelerated rendering.

## Roadmap
- Additional themes (Tokyo Night, Gruvbox, Nord)
- Session persistence (restore workspaces on relaunch)
- URL / path detection and click-to-open
- Font size control via settings GUI
- Linux support (wayland + x11)

## License
MIT
