// FILE: src/hooks/useKeybindings.ts
import { useEffect } from "react";
import { AppState, PaneNode, TileNode } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { triggerDwindleSplit } from "../components/TileLayout";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function findPaneById(root: TileNode, paneId: string): PaneNode | null {
  if (root.type === "pane") return root.id === paneId ? root : null;
  return findPaneById(root.first, paneId) || findPaneById(root.second, paneId);
}

function getAllPanesAndRects(): { paneId: string; rect: DOMRect }[] {
  const panes = Array.from(document.querySelectorAll("[data-pane-id]"));
  return panes.map((p) => ({
    paneId: p.getAttribute("data-pane-id")!,
    rect: p.getBoundingClientRect(),
  }));
}

export function useKeybindings(state: AppState, dispatch: React.Dispatch<any>) {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (state.settingsOpen) return;

      const meta = e.metaKey;
      const shift = e.shiftKey;
      const key = e.key;

      const bindingCombo = [
        meta ? "Meta" : "",
        shift ? "Shift" : "",
        key === "ArrowUp"
          ? "ArrowUp"
          : key === "ArrowDown"
            ? "ArrowDown"
            : key === "ArrowLeft"
              ? "ArrowLeft"
              : key === "ArrowRight"
                ? "ArrowRight"
                : key.length === 1
                  ? key.toUpperCase()
                  : "",
      ]
        .filter(Boolean)
        .join("+");

      const { keybindings } = state.settings;

      if (bindingCombo === keybindings.newWorkspace) {
        const ptyId = await invoke<string>("spawn_pty", {
          shell: state.settings.shell,
          cols: 80,
          rows: 24,
        });
        dispatch({
          type: "ADD_WORKSPACE",
          workspaceId: generateId(),
          paneId: generateId(),
          ptyId,
        });
      } else if (bindingCombo === keybindings.closeWorkspace) {
        if (state.activeWorkspaceId) {
          dispatch({ type: "CLOSE_WORKSPACE", id: state.activeWorkspaceId });
        }
      } else if (bindingCombo === keybindings.newTerminal) {
        triggerDwindleSplit(state, dispatch, async (shell, cols, rows) => {
          return await invoke<string>("spawn_pty", { shell, cols, rows });
        });
      } else if (bindingCombo === keybindings.closeTerminal) {
        const activeWorkspace = state.workspaces.find(
          (w) => w.id === state.activeWorkspaceId,
        );
        if (activeWorkspace) {
          const pane = findPaneById(
            activeWorkspace.root,
            activeWorkspace.focusedPaneId,
          );
          if (pane) {
            const processName = await invoke<string>("get_process_name", {
              id: pane.ptyId,
            });
            const shellNames = ["zsh", "bash", "fish", "sh"];
            if (
              processName &&
              !shellNames.includes(processName.toLowerCase())
            ) {
              const confirmClose = await ask(
                `The process «${processName}» is still running. Close anyway?`,
                {
                  title: "Close pane?",
                  kind: "warning",
                },
              );
              if (!confirmClose) return;
            }
            dispatch({
              type: "CLOSE_PANE",
              paneId: activeWorkspace.focusedPaneId,
            });
          }
        }
      } else if (bindingCombo === keybindings.openSettings) {
        dispatch({ type: "OPEN_SETTINGS" });
      } else if (bindingCombo === keybindings.openSearch) {
        window.dispatchEvent(new CustomEvent(`open-search`));
      } else if (
        bindingCombo.startsWith("Meta+") &&
        bindingCombo.length === 6
      ) {
        const num = parseInt(bindingCombo[5]);
        if (num >= 1 && num <= 9 && num <= state.workspaces.length) {
          dispatch({
            type: "SWITCH_WORKSPACE",
            id: state.workspaces[num - 1].id,
          });
        }
      } else if (
        bindingCombo === keybindings.focusUp ||
        bindingCombo === keybindings.focusDown ||
        bindingCombo === keybindings.focusLeft ||
        bindingCombo === keybindings.focusRight
      ) {
        const activeWorkspace = state.workspaces.find(
          (w) => w.id === state.activeWorkspaceId,
        );
        if (!activeWorkspace) return;
        const currentPaneId = activeWorkspace.focusedPaneId;
        const panes = getAllPanesAndRects();
        const currentPane = panes.find((p) => p.paneId === currentPaneId);
        if (!currentPane) return;
        const { rect } = currentPane;

        let bestPaneId: string | null = null;
        let minDistance = Infinity;

        panes.forEach((p) => {
          if (p.paneId === currentPaneId) return;
          const pr = p.rect;
          let valid = false;
          let dist = Infinity;

          if (bindingCombo === keybindings.focusRight) {
            valid = pr.left >= rect.right;
            dist = pr.left - rect.right + Math.abs(pr.top - rect.top);
          } else if (bindingCombo === keybindings.focusLeft) {
            valid = pr.right <= rect.left;
            dist = rect.left - pr.right + Math.abs(pr.top - rect.top);
          } else if (bindingCombo === keybindings.focusDown) {
            valid = pr.top >= rect.bottom;
            dist = pr.top - rect.bottom + Math.abs(pr.left - rect.left);
          } else if (bindingCombo === keybindings.focusUp) {
            valid = pr.bottom <= rect.top;
            dist = rect.top - pr.bottom + Math.abs(pr.left - rect.left);
          }

          if (valid && dist < minDistance) {
            minDistance = dist;
            bestPaneId = p.paneId;
          }
        });

        if (bestPaneId) {
          dispatch({ type: "SET_FOCUS", paneId: bestPaneId });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, dispatch]);
}
