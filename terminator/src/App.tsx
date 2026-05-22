// FILE: src/App.tsx
import React from "react";
import { TopBar } from "./components/TopBar";
import { TileLayout } from "./components/TileLayout";
import { SettingsModal } from "./components/SettingsModal";
import { useAppState } from "./state/useAppState";
import { useKeybindings } from "./hooks/useKeybindings";
import { usePtyEvents } from "./hooks/usePtyEvents";
import { useSession } from "./hooks/useSession";

const App: React.FC = () => {
  const { state, dispatch } = useAppState();

  useSession(state, dispatch);
  useKeybindings(state, dispatch);
  usePtyEvents(state, dispatch);

  const activeWorkspace = state.workspaces.find(
    (w) => w.id === state.activeWorkspaceId,
  );

  return (
    <div className="flex flex-col w-screen h-screen bg-base overflow-hidden text-text font-sans">
      <TopBar state={state} dispatch={dispatch} />
      <div className="flex-1 overflow-hidden relative" id="workspace-container">
        {activeWorkspace ? (
          <TileLayout
            node={activeWorkspace.root}
            focusedPaneId={activeWorkspace.focusedPaneId}
            workspaceId={activeWorkspace.id}
            state={state}
            dispatch={dispatch}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-subtext0">
            No active workspace. Press ⌘⇧T to create one.
          </div>
        )}
      </div>
      <SettingsModal state={state} dispatch={dispatch} />
    </div>
  );
};

export default App;
