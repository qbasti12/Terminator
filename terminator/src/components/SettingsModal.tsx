// FILE: src/components/SettingsModal.tsx
import React, { useState, useEffect } from "react";
import { AppState, Settings } from "../types";
import { invoke } from "@tauri-apps/api/core";

interface SettingsModalProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  state,
  dispatch,
}) => {
  const [localSettings, setLocalSettings] = useState<Settings>(state.settings);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  useEffect(() => {
    if (state.settingsOpen) {
      setLocalSettings(state.settings);
    }
  }, [state.settingsOpen, state.settings]);

  useEffect(() => {
    if (!recordingKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const meta = e.metaKey;
      const shift = e.shiftKey;
      const key = e.key;

      if (key === "Escape") {
        setRecordingKey(null);
        return;
      }

      if (["Meta", "Shift", "Control", "Alt"].includes(key)) return;

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

      if (bindingCombo) {
        setLocalSettings((prev) => ({
          ...prev,
          keybindings: { ...prev.keybindings, [recordingKey]: bindingCombo },
        }));
      }
      setRecordingKey(null);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [recordingKey]);

  if (!state.settingsOpen) return null;

  const handleSave = async () => {
    await invoke("save_settings", { settings: localSettings });
    dispatch({ type: "SAVE_SETTINGS", settings: localSettings });
  };

  const handleCancel = () => {
    dispatch({ type: "CLOSE_SETTINGS" });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center font-sans">
      <div className="bg-base w-[600px] max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-surface1">
        <div className="p-4 border-b border-surface1 text-text font-bold text-lg">
          Settings
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-subtext0 mb-2 font-semibold">Shell</h3>
            <input
              type="text"
              value={localSettings.shell}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, shell: e.target.value })
              }
              className="w-full bg-mantle text-text border border-surface1 rounded p-2 focus:border-mauve outline-none"
            />
          </section>

          <section>
            <h3 className="text-subtext0 mb-2 font-semibold">Theme</h3>
            <select
              value={localSettings.theme}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, theme: e.target.value })
              }
              className="w-full bg-mantle text-text border border-surface1 rounded p-2 focus:border-mauve outline-none"
            >
              <option value="catppuccin-mocha">Catppuccin Mocha</option>
              <option value="tokyo-night" disabled>
                Tokyo Night (coming soon)
              </option>
              <option value="nord" disabled>
                Nord (coming soon)
              </option>
            </select>
          </section>

          <section>
            <h3 className="text-subtext0 mb-2 font-semibold">Keybindings</h3>
            <div className="space-y-2">
              {Object.entries(localSettings.keybindings).map(
                ([action, combo]) => (
                  <div
                    key={action}
                    className="flex items-center justify-between bg-mantle p-2 rounded border border-surface0"
                  >
                    <span className="text-text capitalize">
                      {action.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <button
                      onClick={() => setRecordingKey(action)}
                      className={`px-3 py-1 rounded text-sm font-mono ${recordingKey === action ? "bg-mauve text-base animate-pulse" : "bg-surface1 text-text hover:bg-surface2"}`}
                    >
                      {recordingKey === action
                        ? "Press any key…"
                        : combo
                            .replace("Meta", "⌘")
                            .replace("Shift", "⇧")
                            .replace("ArrowUp", "↑")
                            .replace("ArrowDown", "↓")
                            .replace("ArrowLeft", "←")
                            .replace("ArrowRight", "→")}
                    </button>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>
        <div className="p-4 border-t border-surface1 flex justify-end space-x-2 bg-crust">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded text-text hover:bg-surface0 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-mauve text-crust font-semibold hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
