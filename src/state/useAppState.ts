// FILE: src/state/useAppState.ts
import { useReducer, useEffect } from "react";
import { AppState, Workspace, TileNode, PaneNode, Settings } from "../types";
import { removePane, updatePaneData } from "./tileHelpers";
import { invoke } from "@tauri-apps/api/core";

const defaultSettings: Settings = {
  shell: "/bin/zsh",
  theme: "catppuccin-mocha",
  appearance: {
    preset: "minimal",
    gapSize: 0,
    borderWidth: 0,
    borderColor: null,
    cornerRadius: 0,
    transparency: 0,
    blur: 0,
    padding: 8,
    focusAnimation: "none",
    animationDuration: 120,
  },
  font: {
    family: "JetBrains Mono",
    size: 13,
    cursorStyle: "block",
    cursorBlink: true,
    scrollback: 5000,
  },
  presets: [
    {
      name: "Minimal",
      builtIn: true,
      appearance: {
        preset: "minimal",
        gapSize: 0,
        borderWidth: 0,
        borderColor: null,
        cornerRadius: 0,
        transparency: 0,
        blur: 0,
        padding: 4,
        focusAnimation: "none",
        animationDuration: 0,
      },
    },
    {
      name: "Fancy",
      builtIn: true,
      appearance: {
        preset: "fancy",
        gapSize: 8,
        borderWidth: 2,
        borderColor: "accent",
        cornerRadius: 8,
        transparency: 15,
        blur: 12,
        padding: 12,
        focusAnimation: "fade",
        animationDuration: 150,
      },
    },
  ],
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
    commandPalette: "Meta+Shift+P",
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

export function useAppState() {
  const [state, dispatch] = useReducer(
    (state: AppState, action: any): AppState => {
      switch (action.type) {
        case "INIT_STATE":
          return action.state;
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
        case "RENAME_WORKSPACE": {
          return {
            ...state,
            workspaces: state.workspaces.map(w =>
              w.id === action.id ? { ...w, name: action.name } : w
            ),
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
        case "SET_THEME":
          return { ...state, settings: { ...state.settings, theme: action.theme } };
        case "SET_APPEARANCE":
          return { ...state, settings: { ...state.settings, appearance: action.appearance } };
        case "SET_FONT":
          return { ...state, settings: { ...state.settings, font: action.font } };
        case "APPLY_PRESET": {
          const preset = state.settings.presets.find(p => p.name.toLowerCase() === action.presetName.toLowerCase());
          if (preset) {
            return {
              ...state,
              settings: {
                ...state.settings,
                appearance: { ...preset.appearance, preset: action.presetName.toLowerCase() }
              }
            };
          }
          return state;
        }
        case "SAVE_PRESET": {
          const newPreset = {
            name: action.name,
            builtIn: false,
            appearance: { ...state.settings.appearance, preset: action.name.toLowerCase() },
          };
          return {
            ...state,
            settings: {
              ...state.settings,
              presets: [...state.settings.presets.filter(p => p.name !== action.name), newPreset],
              appearance: { ...state.settings.appearance, preset: action.name.toLowerCase() }
            }
          };
        }
        case "DELETE_PRESET":
          return {
            ...state,
            settings: {
              ...state.settings,
              presets: state.settings.presets.filter(p => p.name !== action.name),
              appearance: state.settings.appearance.preset === action.name.toLowerCase()
                ? { ...state.settings.appearance, preset: "custom" }
                : state.settings.appearance
            }
          };
        case "OPEN_COMMAND_PALETTE":
          return { ...state, commandPaletteOpen: true };
        case "CLOSE_COMMAND_PALETTE":
          return { ...state, commandPaletteOpen: false };
        case "RESTORE_SESSION": {
          const restoreRoot = (node: any): TileNode => {
            if (node.type === "pane") {
              return {
                type: "pane",
                id: node.id,
                ptyId: "",
                cwd: node.cwd,
                processName: "shell",
              };
            }
            return {
              type: "split",
              id: node.id,
              direction: node.direction,
              ratio: node.ratio,
              first: restoreRoot(node.first),
              second: restoreRoot(node.second),
            };
          };

          return {
            ...state,
            workspaces: action.snapshot.workspaces.map((w: any) => ({
              id: w.id,
              name: w.name,
              root: restoreRoot(w.root),
              focusedPaneId: w.focusedPaneId,
            })),
            activeWorkspaceId: action.snapshot.activeWorkspaceId,
          };
        }
        case "SET_PTY_ID": {
          const updatePtyId = (node: TileNode): TileNode => {
            if (node.type === "pane") {
              if (node.id === action.paneId) {
                return { ...node, ptyId: action.ptyId };
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

        const ptyId = await invoke<string>("spawn_pty", {
          shell: settings.shell,
          cols: 80,
          rows: 24,
        });
        dispatch({
          type: "ADD_WORKSPACE",
          workspaceId: generateId(),
          paneId: generateId(),
          ptyId,
        });
      } catch (e) {
        console.error("Failed to init:", e);
      }
    }
    init();
  }, []);

  return { state, dispatch };
}
