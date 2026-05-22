// FILE: src/hooks/useSession.ts
import { useEffect } from "react";
import { AppState } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  buildSnapshot,
  collectPaneSnapshots,
  SessionSnapshot,
} from "../state/tileHelpers";

export function useSession(state: AppState, dispatch: React.Dispatch<any>) {
  useEffect(() => {
    async function loadSession() {
      try {
        const snapshot: SessionSnapshot | null = await invoke("load_session");
        if (snapshot && snapshot.workspaces.length > 0) {
          dispatch({ type: "RESTORE_SESSION", payload: snapshot });

          for (const workspace of snapshot.workspaces) {
            const panes = collectPaneSnapshots(workspace.root);
            for (const pane of panes) {
              const ptyId = await invoke<string>("spawn_pty", {
                shell: state.settings.shell,
                cols: 80,
                rows: 24,
                cwd: pane.cwd, // Passing cwd if supported by spawn_pty, else default
              });
              dispatch({ type: "SET_PTY_ID", paneId: pane.id, ptyId });
            }
          }
        } else {
          // No session found, start fresh
          const ptyId = await invoke<string>("spawn_pty", {
            shell: state.settings.shell,
            cols: 80,
            rows: 24,
          });
          dispatch({
            type: "ADD_WORKSPACE",
            workspaceId: Math.random().toString(36).substring(2, 9),
            paneId: Math.random().toString(36).substring(2, 9),
            ptyId,
          });
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      }
    }

    // state.settings.shell is needed for spawn_pty, ensure it's loaded before running loadSession
    if (state.settings.shell) {
      loadSession();
    }
  }, []); // Run once on mount

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function setupSaveOnClose() {
      const appWindow = getCurrentWindow();
      unlisten = await appWindow.onCloseRequested(async (event) => {
        // Prevent immediate close to save session
        event.preventDefault();

        try {
          const snapshot = buildSnapshot(state);
          await invoke("save_session", { snapshot });
        } catch (error) {
          console.error("Failed to save session:", error);
        }

        // Close the window after saving
        appWindow.destroy();
      });
    }

    setupSaveOnClose();

    return () => {
      if (unlisten) unlisten();
    };
  }, [state]);
}
