import React, { useState, useEffect } from "react";
import { AppState, Settings, Preset, AppearanceSettings } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { Tooltip } from "./Tooltip";
import { themes } from "../themes";

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
  const [activeTab, setActiveTab] = useState<
    "shell" | "theme" | "appearance" | "font" | "keybindings"
  >("shell");
  const [availableShells, setAvailableShells] = useState<string[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  useEffect(() => {
    if (state.settingsOpen) {
      setLocalSettings(state.settings);
      invoke<string[]>("get_available_shells").then(setAvailableShells);
    }
  }, [state.settingsOpen, state.settings]);

  useEffect(() => {
    if (state.settingsOpen) {
      const root = document.documentElement;
      const theme = themes[localSettings.theme] || themes["catppuccin-mocha"];
      root.style.setProperty("--theme-background", theme.background);
      root.style.setProperty("--theme-mantle", theme.mantle);
      root.style.setProperty("--theme-crust", theme.crust);
      root.style.setProperty("--theme-surface0", theme.surface0);
      root.style.setProperty("--theme-surface1", theme.surface1);
      root.style.setProperty("--theme-surface2", theme.surface2);
      root.style.setProperty("--theme-overlay0", theme.overlay0);
      root.style.setProperty("--theme-subtext0", theme.subtext0);
      root.style.setProperty("--theme-text", theme.text);
      root.style.setProperty("--theme-accent", theme.accent);
      root.style.setProperty("--theme-red", theme.red);
      root.style.setProperty("--theme-green", theme.green);
      root.style.setProperty("--theme-yellow", theme.yellow);
      root.style.setProperty("--theme-blue", theme.blue);
      root.style.setProperty("--theme-lavender", theme.lavender);
      root.style.setProperty("--theme-background-rgb", theme.backgroundRgb);
    }
  }, [localSettings.theme, state.settingsOpen]);

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
    // Revert theme css vars to original state settings
    const theme = themes[state.settings.theme] || themes["catppuccin-mocha"];
    const root = document.documentElement;
    root.style.setProperty("--theme-background", theme.background);
    root.style.setProperty("--theme-mantle", theme.mantle);
    root.style.setProperty("--theme-crust", theme.crust);
    root.style.setProperty("--theme-surface0", theme.surface0);
    root.style.setProperty("--theme-surface1", theme.surface1);
    root.style.setProperty("--theme-surface2", theme.surface2);
    root.style.setProperty("--theme-overlay0", theme.overlay0);
    root.style.setProperty("--theme-subtext0", theme.subtext0);
    root.style.setProperty("--theme-text", theme.text);
    root.style.setProperty("--theme-accent", theme.accent);
    root.style.setProperty("--theme-red", theme.red);
    root.style.setProperty("--theme-green", theme.green);
    root.style.setProperty("--theme-yellow", theme.yellow);
    root.style.setProperty("--theme-blue", theme.blue);
    root.style.setProperty("--theme-lavender", theme.lavender);
    root.style.setProperty("--theme-background-rgb", theme.backgroundRgb);

    dispatch({ type: "CLOSE_SETTINGS" });
  };

  const updateAppearance = (updates: Partial<AppearanceSettings>) => {
    const newAppearance = { ...localSettings.appearance, ...updates };

    let isCustom = true;
    for (const preset of localSettings.presets) {
      const pa = preset.appearance;
      if (
        pa.gapSize === newAppearance.gapSize &&
        pa.borderWidth === newAppearance.borderWidth &&
        pa.borderColor === newAppearance.borderColor &&
        pa.cornerRadius === newAppearance.cornerRadius &&
        pa.transparency === newAppearance.transparency &&
        pa.blur === newAppearance.blur &&
        pa.padding === newAppearance.padding &&
        pa.focusAnimation === newAppearance.focusAnimation &&
        pa.animationDuration === newAppearance.animationDuration
      ) {
        newAppearance.preset = preset.appearance.preset;
        isCustom = false;
        break;
      }
    }

    if (isCustom) {
      newAppearance.preset = "custom";
    }

    setLocalSettings((prev) => ({ ...prev, appearance: newAppearance }));
  };

  const applyPreset = (presetName: string) => {
    const preset = localSettings.presets.find(
      (p) => p.name.toLowerCase() === presetName.toLowerCase(),
    );
    if (preset) {
      setLocalSettings((prev) => ({
        ...prev,
        appearance: { ...preset.appearance, preset: presetName.toLowerCase() },
      }));
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      name: newPresetName,
      builtIn: false,
      appearance: { ...localSettings.appearance, preset: newPresetName.toLowerCase() },
    };
    setLocalSettings((prev) => ({
      ...prev,
      presets: [...prev.presets.filter(p => p.name !== newPresetName), newPreset],
      appearance: { ...prev.appearance, preset: newPresetName.toLowerCase() }
    }));
    setNewPresetName("");
    setIsSavingPreset(false);
  };

  const handleDeletePreset = (name: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      presets: prev.presets.filter((p) => p.name !== name),
      appearance: prev.appearance.preset === name.toLowerCase()
        ? { ...prev.appearance, preset: "custom" }
        : prev.appearance
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center font-sans">
      <div className="bg-base w-[800px] h-[600px] rounded-xl shadow-2xl flex overflow-hidden border border-surface1">
        {/* Left Sidebar */}
        <div className="w-48 bg-mantle border-r border-surface1 flex flex-col p-4 space-y-2">
          <div className="text-text font-bold text-lg mb-4">Settings</div>
          {["shell", "theme", "appearance", "font", "keybindings"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`text-left px-3 py-2 rounded text-sm capitalize ${activeTab === tab ? "bg-surface0 text-accent font-semibold" : "text-subtext0 hover:bg-surface0 hover:text-text"}`}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-base">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === "shell" && (
              <section>
                <Tooltip text="The shell binary Terminator launches in each new pane.">
                  <h3 className="text-subtext0 mb-2 font-semibold inline-block">Shell</h3>
                </Tooltip>
                <select
                  value={localSettings.shell}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, shell: e.target.value })
                  }
                  className="w-full bg-mantle text-text border border-surface1 rounded p-2 focus:border-accent outline-none"
                >
                  {availableShells.map((shell) => (
                    <option key={shell} value={shell}>
                      {shell.split("/").pop()}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {activeTab === "theme" && (
              <section>
                <Tooltip text="The color palette applied to the entire app and terminals.">
                  <h3 className="text-subtext0 mb-2 font-semibold inline-block">Theme</h3>
                </Tooltip>
                <select
                  value={localSettings.theme}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, theme: e.target.value })
                  }
                  className="w-full bg-mantle text-text border border-surface1 rounded p-2 focus:border-accent outline-none"
                >
                  <option value="catppuccin-mocha">Catppuccin Mocha</option>
                  <option value="tokyo-night">Tokyo Night</option>
                  <option value="gruvbox-dark">Gruvbox Dark</option>
                  <option value="nord">Nord</option>
                </select>
              </section>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      <Tooltip text="A saved combination of appearance settings. Minimal = no decoration. Fancy = gaps, borders, blur, animations.">
                        <span className="text-subtext0 font-semibold mr-2 self-center">Preset</span>
                      </Tooltip>
                      {["minimal", "fancy", "custom"].map((p) => {
                        if (p === "custom" && localSettings.appearance.preset !== "custom") return null;
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              if (p !== "custom") applyPreset(p);
                            }}
                            className={`px-3 py-1 rounded text-sm capitalize border ${localSettings.appearance.preset === p ? "bg-accent/10 border-accent text-accent" : "bg-mantle border-surface1 text-text hover:bg-surface0"}`}
                            disabled={p === "custom"}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      {isSavingPreset ? (
                        <div className="flex items-center space-x-2">
                          <input
                            autoFocus
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                            placeholder="Preset name"
                            className="bg-mantle border border-surface1 rounded px-2 py-1 text-sm text-text outline-none focus:border-accent w-32"
                          />
                          <button onClick={handleSavePreset} className="text-accent text-sm hover:underline">Save</button>
                          <button onClick={() => setIsSavingPreset(false)} className="text-subtext0 text-sm hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsSavingPreset(true)}
                          className="text-accent text-sm hover:underline"
                        >
                          Save as preset...
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-4 items-center">
                    <Tooltip text="Space in pixels between panes. 0 means panes touch directly."><label className="text-text text-sm w-32">Gap size</label></Tooltip>
                    <input type="range" min="0" max="32" value={localSettings.appearance.gapSize} onChange={(e) => updateAppearance({ gapSize: Number(e.target.value) })} className="accent-accent" />
                    <span className="text-subtext0 text-sm w-8 text-right">{localSettings.appearance.gapSize}</span>

                    <Tooltip text="Thickness of the border around each pane in pixels."><label className="text-text text-sm w-32">Border width</label></Tooltip>
                    <input type="range" min="0" max="8" value={localSettings.appearance.borderWidth} onChange={(e) => updateAppearance({ borderWidth: Number(e.target.value) })} className="accent-accent" />
                    <span className="text-subtext0 text-sm w-8 text-right">{localSettings.appearance.borderWidth}</span>

                    <Tooltip text="Color of pane borders. Accent uses the theme highlight color."><label className="text-text text-sm w-32">Border color</label></Tooltip>
                    <div className="flex items-center space-x-2 col-span-2">
                      <button onClick={() => updateAppearance({ borderColor: localSettings.appearance.borderColor === "accent" ? null : "accent" })} className={`px-2 py-1 text-xs rounded border ${localSettings.appearance.borderColor === "accent" ? "bg-accent text-crust border-accent" : "bg-mantle text-text border-surface1"}`}>Accent</button>
                      <input type="color" value={localSettings.appearance.borderColor && localSettings.appearance.borderColor !== "accent" ? localSettings.appearance.borderColor : "#ffffff"} onChange={(e) => updateAppearance({ borderColor: e.target.value })} className="h-6 w-6 rounded border-0 cursor-pointer p-0 bg-transparent" />
                    </div>

                    <Tooltip text="Roundness of pane corners. 0 means sharp square corners."><label className="text-text text-sm w-32">Corner radius</label></Tooltip>
                    <input type="range" min="0" max="24" value={localSettings.appearance.cornerRadius} onChange={(e) => updateAppearance({ cornerRadius: Number(e.target.value) })} className="accent-accent" />
                    <span className="text-subtext0 text-sm w-8 text-right">{localSettings.appearance.cornerRadius}</span>

                    <Tooltip text="How transparent the terminal background is. 0 is fully opaque."><label className="text-text text-sm w-32">Transparency</label></Tooltip>
                    <input type="range" min="0" max="80" value={localSettings.appearance.transparency} onChange={(e) => updateAppearance({ transparency: Number(e.target.value) })} className="accent-accent" />
                    <span className="text-subtext0 text-sm w-8 text-right">{localSettings.appearance.transparency}</span>

                    <Tooltip text="Frosted glass blur strength behind transparent terminals."><label className="text-text text-sm w-32">Blur</label></Tooltip>
                    <input type="range" min="0" max="32" value={localSettings.appearance.blur} onChange={(e) => updateAppearance({ blur: Number(e.target.value) })} className="accent-accent" />
                    <span className="text-subtext0 text-sm w-8 text-right">{localSettings.appearance.blur}</span>

                    <Tooltip text="Inner spacing between the pane edge and terminal text."><label className="text-text text-sm w-32">Padding</label></Tooltip>
                    <input type="range" min="0" max="32" value={localSettings.appearance.padding} onChange={(e) => updateAppearance({ padding: Number(e.target.value) })} className="accent-accent" />
                    <span className="text-subtext0 text-sm w-8 text-right">{localSettings.appearance.padding}</span>

                    <Tooltip text="How the focus border transitions when switching panes."><label className="text-text text-sm w-32">Focus animation</label></Tooltip>
                    <select value={localSettings.appearance.focusAnimation} onChange={(e) => updateAppearance({ focusAnimation: e.target.value })} className="col-span-2 bg-mantle text-text border border-surface1 rounded p-1 outline-none">
                      <option value="none">None</option>
                      <option value="fade">Fade</option>
                      <option value="spring">Spring</option>
                    </select>

                    <Tooltip text="How long the focus animation takes in milliseconds."><label className={`text-text text-sm w-32 ${localSettings.appearance.focusAnimation === "none" ? "opacity-50" : ""}`}>Anim. duration</label></Tooltip>
                    <input type="range" min="20" max="500" value={localSettings.appearance.animationDuration} onChange={(e) => updateAppearance({ animationDuration: Number(e.target.value) })} disabled={localSettings.appearance.focusAnimation === "none"} className={`accent-accent ${localSettings.appearance.focusAnimation === "none" ? "opacity-50 grayscale" : ""}`} />
                    <span className={`text-subtext0 text-sm w-8 text-right ${localSettings.appearance.focusAnimation === "none" ? "opacity-50" : ""}`}>{localSettings.appearance.animationDuration}</span>
                  </div>
                </div>

                {localSettings.presets.filter(p => !p.builtIn).length > 0 && (
                  <div>
                    <h4 className="text-subtext0 font-semibold mb-2">Custom Presets</h4>
                    <div className="space-y-2">
                      {localSettings.presets.filter(p => !p.builtIn).map(p => (
                        <div key={p.name} className="flex items-center justify-between bg-mantle p-2 rounded border border-surface0">
                          <span className="text-text">{p.name}</span>
                          <div className="space-x-2">
                            <button onClick={() => applyPreset(p.name)} className="text-accent text-sm hover:underline">Apply</button>
                            <button onClick={() => handleDeletePreset(p.name)} className="text-red text-sm hover:underline">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "font" && (
              <div className="space-y-6">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-6 items-center">
                  <Tooltip text="The font used inside all terminal panes."><label className="text-text text-sm w-32">Font family</label></Tooltip>
                  <div>
                    <input
                      type="text"
                      list="fonts"
                      value={localSettings.font.family}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, font: { ...prev.font, family: e.target.value } }))}
                      className="w-full bg-mantle text-text border border-surface1 rounded p-2 focus:border-accent outline-none"
                    />
                    <datalist id="fonts">
                      {["JetBrains Mono", "Fira Code", "Cascadia Code", "Hack", "Source Code Pro", "IBM Plex Mono", "Inconsolata", "Monospace"].map(f => <option key={f} value={f} />)}
                    </datalist>
                  </div>

                  <Tooltip text="Terminal text size in points."><label className="text-text text-sm w-32">Font size</label></Tooltip>
                  <div className="flex items-center space-x-4">
                    <input type="range" min="8" max="32" value={localSettings.font.size} onChange={(e) => setLocalSettings(prev => ({ ...prev, font: { ...prev.font, size: Number(e.target.value) } }))} className="flex-1 accent-accent" />
                    <input type="number" min="8" max="32" value={localSettings.font.size} onChange={(e) => setLocalSettings(prev => ({ ...prev, font: { ...prev.font, size: Number(e.target.value) } }))} className="w-16 bg-mantle text-text border border-surface1 rounded p-1 text-center outline-none focus:border-accent" />
                  </div>

                  <Tooltip text="Shape of the terminal cursor: block, beam, or underline."><label className="text-text text-sm w-32">Cursor style</label></Tooltip>
                  <div className="flex bg-mantle rounded border border-surface1 overflow-hidden">
                    {["block", "beam", "underline"].map(style => (
                      <button key={style} onClick={() => setLocalSettings(prev => ({ ...prev, font: { ...prev.font, cursorStyle: style as any } }))} className={`flex-1 py-1 text-sm capitalize ${localSettings.font.cursorStyle === style ? "bg-surface1 text-text" : "text-subtext0 hover:bg-surface0"}`}>{style}</button>
                    ))}
                  </div>

                  <Tooltip text="Whether the cursor flashes on and off."><label className="text-text text-sm w-32">Cursor blink</label></Tooltip>
                  <div
                    className={`w-10 h-6 rounded-full cursor-pointer relative transition-colors ${localSettings.font.cursorBlink ? "bg-accent" : "bg-surface1"}`}
                    onClick={() => setLocalSettings(prev => ({ ...prev, font: { ...prev.font, cursorBlink: !prev.font.cursorBlink } }))}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-base transition-transform ${localSettings.font.cursorBlink ? "translate-x-4" : ""}`} />
                  </div>

                  <Tooltip text="How many lines of terminal history are kept per pane."><label className="text-text text-sm w-32">Scrollback</label></Tooltip>
                  <input type="number" min="1000" max="100000" step="1000" value={localSettings.font.scrollback} onChange={(e) => setLocalSettings(prev => ({ ...prev, font: { ...prev.font, scrollback: Number(e.target.value) } }))} className="w-32 bg-mantle text-text border border-surface1 rounded p-2 outline-none focus:border-accent" />
                </div>
              </div>
            )}

            {activeTab === "keybindings" && (
              <section>
                <h3 className="text-subtext0 mb-2 font-semibold">Keybindings</h3>
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 pb-4">
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
                          className={`px-3 py-1 rounded text-sm font-mono ${recordingKey === action ? "bg-accent text-crust animate-pulse" : "bg-surface1 text-text hover:bg-surface2"}`}
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
            )}
          </div>

          <div className="p-4 border-t border-surface1 flex justify-end space-x-3 bg-crust">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded text-text hover:bg-surface0 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-accent text-crust font-semibold hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
