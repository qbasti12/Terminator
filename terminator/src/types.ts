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
}

export interface Settings {
  shell: string;
  theme: string;
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
  | { type: "SAVE_SETTINGS"; settings: Settings };
