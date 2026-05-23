// FILE: src/hooks/usePtyEvents.ts
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { AppState } from "../types";

export function usePtyEvents(state: AppState, dispatch: React.Dispatch<any>) {
  useEffect(() => {
    let unlistenExit: () => void;
    let cwdInterval: ReturnType<typeof setInterval>;

    async function setup() {
      unlistenExit = await listen<{ id: string; code: number }>(
        "pty-exit",
        (event) => {
          for (const workspace of state.workspaces) {
            const findPaneIdByPty = (node: any): string | null => {
              if (node.type === "pane" && node.ptyId === event.payload.id)
                return node.id;
              if (node.type === "split") {
                return (
                  findPaneIdByPty(node.first) || findPaneIdByPty(node.second)
                );
              }
              return null;
            };
            const paneId = findPaneIdByPty(workspace.root);
            if (paneId) {
              dispatch({ type: "CLOSE_PANE", paneId });
              break;
            }
          }
        },
      );

      cwdInterval = setInterval(async () => {}, 1000);
    }
    setup();

    return () => {
      if (unlistenExit) unlistenExit();
      if (cwdInterval) clearInterval(cwdInterval);
    };
  }, [state.workspaces, dispatch]);
}
