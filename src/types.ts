// FILE: src/types.ts
export type PtyId = string;

export interface PaneNode {
  id: string;
  ptyId: PtyId;
  cwd: string;
  processName: string;
  type: "pane";
}

export type SplitDirection = "horizontal" | "vertical";

export interface SplitNode {
  id: string;
  direction: SplitDirection;
  ratio: number;
  first: TileNode;
  second: TileNode;
  type: "split";
}

export type TileNode = PaneNode | SplitNode;

export interface Workspace {
  id: string;
  name: string;
  root: TileNode;
  focusedPaneId: string;
}

export interface AppState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  settings: Settings;
  settingsOpen: boolean;
  commandPaletteOpen?: boolean;
}

export interface AppearanceSettings {
  preset: string;
  gapSize: number;
  borderWidth: number;
  borderColor: string | null;
  cornerRadius: number;
  transparency: number;
  blur: number;
  padding: number;
  focusAnimation: string;
  animationDuration: number;
}

export interface FontSettings {
  family: string;
  size: number;
  cursorStyle: "block" | "beam" | "underline";
  cursorBlink: boolean;
  scrollback: number;
}

export interface Preset {
  name: string;
  builtIn: boolean;
  appearance: AppearanceSettings;
}

export interface Settings {
  shell: string;
  theme: string;
  appearance: AppearanceSettings;
  font: FontSettings;
  presets: Preset[];
  keybindings: Record<string, string>;
}

export type Action =
  | { type: "INIT_STATE"; state: AppState }
  | { type: "NEW_WORKSPACE" }
  | { type: "CLOSE_WORKSPACE"; id: string }
  | { type: "SWITCH_WORKSPACE"; id: string }
  | { type: "SET_FOCUS"; paneId: string }
  | { type: "SPLIT_PANE"; paneId: string; direction: SplitDirection; newPtyId: PtyId; newPaneId: string }
  | { type: "CLOSE_PANE"; paneId: string }
  | { type: "UPDATE_CWD"; paneId: string; cwd: string }
  | { type: "UPDATE_PROCESS"; paneId: string; processName: string }
  | { type: "SET_SPLIT_RATIO"; splitId: string; ratio: number }
  | { type: "OPEN_SETTINGS" }
  | { type: "CLOSE_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: Settings }
  | { type: "RESTORE_SESSION"; snapshot: any }
  | { type: "SET_PTY_ID"; paneId: string; ptyId: string }
  | { type: "SET_THEME"; theme: string }
  | { type: "SET_APPEARANCE"; appearance: AppearanceSettings }
  | { type: "SET_FONT"; font: FontSettings }
  | { type: "APPLY_PRESET"; presetName: string }
  | { type: "SAVE_PRESET"; name: string }
  | { type: "DELETE_PRESET"; name: string }
  | { type: "OPEN_COMMAND_PALETTE" }
  | { type: "CLOSE_COMMAND_PALETTE" }
  | { type: "RENAME_WORKSPACE"; id: string; name: string };
