import { useEffect } from "react";
import { AppState } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { buildSnapshot, collectPaneSnapshots } from "../state/tileHelpers";

export function useSession(state: AppState, dispatch: React.Dispatch<any>) {
  useEffect(() => {
    const unlisten = getCurrentWindow().onCloseRequested(async (event) => {
      event.preventDefault();
      const snapshot = buildSnapshot(state);
      try {
        await invoke("save_session", { snapshot });
      } catch (e) {
        console.error("Failed to save session", e);
      } finally {
        getCurrentWindow().destroy();
      }
    });

    return () => {
      unlisten.then((u) => u());
    };
  }, [state]);

  useEffect(() => {
    async function restore() {
      try {
        const snapshot = await invoke<any>("load_session");
        if (snapshot) {
          dispatch({ type: "RESTORE_SESSION", snapshot });

          for (const workspace of snapshot.workspaces) {
            const panes = collectPaneSnapshots(workspace.root);
            for (const pane of panes) {
              const shell = state.settings.shell || "/bin/zsh";
              try {
                const ptyId = await invoke<string>("spawn_pty", {
                  shell,
                  cols: 80,
                  rows: 24,
                });
                dispatch({
                  type: "SET_PTY_ID",
                  paneId: pane.id,
                  ptyId,
                });
              } catch (e) {
                console.error("Failed to spawn restored pty", e);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load session", e);
      }
    }

    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
