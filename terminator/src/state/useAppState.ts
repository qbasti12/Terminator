// FILE: src/state/useAppState.ts
import { useReducer, useEffect } from "react";
import { AppState, Workspace, TileNode, PaneNode, Settings } from "../types";
import {
  removePane,
  updatePaneData,
  SessionSnapshot,
  TileSnapshot,
} from "./tileHelpers";
import { invoke } from "@tauri-apps/api/core";

const defaultSettings: Settings = {
  shell: "/bin/zsh",
  theme: "catppuccin-mocha",
  keybindings: {
    newWorkspace: "Meta+Shift+T",
    closeWorkspace: "Meta+Shift+W",
    newTerminal: "Meta+T",
    closeTerminal: "Meta+W",
    focusUp: "Meta+ArrowUp",
    focusDown: "Meta+ArrowDown",
    focusLeft: "Meta+ArrowLeft",
    focusRight: "Meta+ArrowRight",
    openSearch: "Meta+F",
    openSettings: "Meta+Comma",
    switchWorkspace1: "Meta+1",
    switchWorkspace2: "Meta+2",
    switchWorkspace3: "Meta+3",
    switchWorkspace4: "Meta+4",
    switchWorkspace5: "Meta+5",
    switchWorkspace6: "Meta+6",
    switchWorkspace7: "Meta+7",
    switchWorkspace8: "Meta+8",
    switchWorkspace9: "Meta+9",
  },
};

const initialState: AppState = {
  workspaces: [],
  activeWorkspaceId: "",
  settings: defaultSettings,
  settingsOpen: false,
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function restoreTileSnapshot(snapshot: TileSnapshot): TileNode {
  if (snapshot.type === "pane") {
    return {
      type: "pane",
      id: snapshot.id,
      ptyId: "", // will be set later
      cwd: snapshot.cwd,
      processName: "shell",
    };
  }
  return {
    type: "split",
    id: snapshot.id,
    direction: snapshot.direction,
    ratio: snapshot.ratio,
    first: restoreTileSnapshot(snapshot.first),
    second: restoreTileSnapshot(snapshot.second),
  };
}

export function useAppState() {
  const [state, dispatch] = useReducer(
    (state: AppState, action: any): AppState => {
      switch (action.type) {
        case "INIT_STATE":
          return action.state;
        case "RESTORE_SESSION": {
          const snapshot: SessionSnapshot = action.payload;
          const workspaces: Workspace[] = snapshot.workspaces.map((w) => ({
            id: w.id,
            name: w.name,
            root: restoreTileSnapshot(w.root),
            focusedPaneId: w.focusedPaneId,
          }));
          return {
            ...state,
            workspaces,
            activeWorkspaceId: snapshot.activeWorkspaceId,
          };
        }
        case "SET_PTY_ID": {
          const { paneId, ptyId } = action;
          const updatePtyId = (node: TileNode): TileNode => {
            if (node.type === "pane") {
              if (node.id === paneId) {
                return { ...node, ptyId };
              }
              return node;
            }
            return {
              ...node,
              first: updatePtyId(node.first),
              second: updatePtyId(node.second),
            };
          };
          return {
            ...state,
            workspaces: state.workspaces.map((w) => ({
              ...w,
              root: updatePtyId(w.root),
            })),
          };
        }
        case "ADD_WORKSPACE": {
          const newWorkspace: Workspace = {
            id: action.workspaceId,
            name: `Workspace ${state.workspaces.length + 1}`,
            root: {
              type: "pane",
              id: action.paneId,
              ptyId: action.ptyId,
              cwd: "~",
              processName: "shell",
            },
            focusedPaneId: action.paneId,
          };
          return {
            ...state,
            workspaces: [...state.workspaces, newWorkspace],
            activeWorkspaceId: newWorkspace.id,
          };
        }
        case "CLOSE_WORKSPACE": {
          const nextWorkspaces = state.workspaces.filter(
            (w) => w.id !== action.id,
          );
          const nextActiveId =
            state.activeWorkspaceId === action.id
              ? nextWorkspaces[0]?.id || ""
              : state.activeWorkspaceId;
          return {
            ...state,
            workspaces: nextWorkspaces,
            activeWorkspaceId: nextActiveId,
          };
        }
        case "SWITCH_WORKSPACE":
          return { ...state, activeWorkspaceId: action.id };
        case "SET_FOCUS": {
          return {
            ...state,
            workspaces: state.workspaces.map((w) =>
              w.id === state.activeWorkspaceId
                ? { ...w, focusedPaneId: action.paneId }
                : w,
            ),
          };
        }
        case "SPLIT_PANE": {
          const { paneId, direction, newPtyId, newPaneId, swap } = action;
          return {
            ...state,
            workspaces: state.workspaces.map((w) => {
              if (w.id !== state.activeWorkspaceId) return w;
              const newPane: PaneNode = {
                type: "pane",
                id: newPaneId,
                ptyId: newPtyId,
                cwd: "~",
                processName: "shell",
              };
              const replacePaneWithSplit = (node: TileNode): TileNode => {
                if (node.type === "pane") {
                  if (node.id === paneId) {
                    return {
                      type: "split",
                      id: generateId(),
                      direction,
                      ratio: 0.5,
                      first: swap ? newPane : node,
                      second: swap ? node : newPane,
                    };
                  }
                  return node;
                }
                return {
                  ...node,
                  first: replacePaneWithSplit(node.first),
                  second: replacePaneWithSplit(node.second),
                };
              };
              return {
                ...w,
                root: replacePaneWithSplit(w.root),
                focusedPaneId: newPaneId,
              };
            }),
          };
        }
        case "CLOSE_PANE": {
          return {
            ...state,
            workspaces: state.workspaces.map((w) => {
              if (w.id !== state.activeWorkspaceId) return w;
              const { newRoot, focusId } = removePane(w.root, action.paneId);
              if (!newRoot) return w; // Can trigger workspace close if implemented
              return {
                ...w,
                root: newRoot,
                focusedPaneId: focusId || w.focusedPaneId,
              };
            }),
          };
        }
        case "UPDATE_PANE_DATA": {
          return {
            ...state,
            workspaces: state.workspaces.map((w) => ({
              ...w,
              root: updatePaneData(w.root, action.ptyId, action.updates),
            })),
          };
        }
        case "SET_SPLIT_RATIO": {
          const updateRatio = (node: TileNode): TileNode => {
            if (node.type === "pane") return node;
            if (node.id === action.splitId) {
              return { ...node, ratio: action.ratio };
            }
            return {
              ...node,
              first: updateRatio(node.first),
              second: updateRatio(node.second),
            };
          };
          return {
            ...state,
            workspaces: state.workspaces.map((w) =>
              w.id === state.activeWorkspaceId
                ? { ...w, root: updateRatio(w.root) }
                : w,
            ),
          };
        }
        case "OPEN_SETTINGS":
          return { ...state, settingsOpen: true };
        case "CLOSE_SETTINGS":
          return { ...state, settingsOpen: false };
        case "SAVE_SETTINGS":
          return { ...state, settings: action.settings, settingsOpen: false };
        default:
          return state;
      }
    },
    initialState,
  );

  useEffect(() => {
    async function init() {
      try {
        const settings: Settings = await invoke("get_settings");
        dispatch({ type: "INIT_STATE", state: { ...initialState, settings } });
      } catch (e) {
        console.error("Failed to init settings:", e);
      }
    }
    init();
  }, []);

  return { state, dispatch };
}
