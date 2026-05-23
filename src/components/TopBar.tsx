// FILE: src/components/TopBar.tsx
import React from "react";
import { Plus, Settings } from "lucide-react";
import { AppState } from "../types";
import { invoke } from "@tauri-apps/api/core";

interface TopBarProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export const TopBar: React.FC<TopBarProps> = ({ state, dispatch }) => {
  const handleNewWorkspace = async () => {
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
  };

  const handleOpenSettings = () => {
    dispatch({ type: "OPEN_SETTINGS" });
  };

  return (
    <div className="flex items-center h-[36px] bg-base text-text select-none">
      <div className="flex-1 flex overflow-x-auto items-center px-2 space-x-1">
        {state.workspaces.map((w) => (
          <div
            key={w.id}
            onClick={() => dispatch({ type: "SWITCH_WORKSPACE", id: w.id })}
            className={`group relative flex items-center h-7 px-3 rounded-md cursor-pointer text-sm font-sans ${
              state.activeWorkspaceId === w.id
                ? "bg-surface1 text-text"
                : "text-subtext0 hover:bg-surface0"
            }`}
          >
            <span>{w.name}</span>
            <button
              className="ml-2 w-4 h-4 rounded hover:bg-red hover:text-crust opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "CLOSE_WORKSPACE", id: w.id });
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={handleNewWorkspace}
          className="w-7 h-7 flex items-center justify-center rounded-md text-subtext0 hover:bg-surface0"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="px-3 flex items-center">
        <button
          onClick={handleOpenSettings}
          className="w-7 h-7 flex items-center justify-center rounded-md text-subtext0 hover:text-text hover:bg-surface0"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};
