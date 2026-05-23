// FILE: src/components/TerminalPane.tsx
import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { PaneStatusBar } from "./PaneStatusBar";
import { SplitDirection } from "../types";
import { useTerminalRegistry } from "../context/TerminalRegistry";
import { useAppState } from "../state/useAppState";
import { themes } from "../themes";

interface TerminalPaneProps {
  paneId: string;
  ptyId: string;
  cwd: string;
  processName: string;
  isFocused: boolean;
  onFocus: () => void;
  onSplit: (direction: SplitDirection) => void;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({
  paneId,
  ptyId,
  cwd,
  processName,
  isFocused,
  onFocus,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalCwd, setInternalCwd] = useState(cwd);
  const [internalProc, setInternalProc] = useState(processName);

  const { register, unregister } = useTerminalRegistry();
  const { state } = useAppState();

  const getThemeObject = (themeId: string) => {
    const theme = themes[themeId] || themes["catppuccin-mocha"];
    return {
      background: "transparent",
      foreground: theme.text,
      cursor: theme.text,
      black: theme.surface1,
      red: theme.red,
      green: theme.green,
      yellow: theme.yellow,
      blue: theme.blue,
      magenta: theme.accent,
      cyan: theme.lavender,
      white: theme.subtext0,
      brightBlack: theme.surface2,
      brightRed: theme.red,
      brightGreen: theme.green,
      brightYellow: theme.yellow,
      brightBlue: theme.blue,
      brightMagenta: theme.accent,
      brightCyan: theme.lavender,
      brightWhite: theme.text,
    };
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    const { font, theme } = state.settings;

    const term = new Terminal({
      fontFamily: font.family,
      fontSize: font.size,
      cursorStyle: (font.cursorStyle === "beam" ? "bar" : font.cursorStyle) as "block" | "underline" | "bar",
      cursorBlink: font.cursorBlink,
      scrollback: font.scrollback,
      allowTransparency: true,
      theme: getThemeObject(theme),
    });

    termInstance.current = term;
    register(paneId, term);
    fitAddon.current = new FitAddon();

    term.loadAddon(fitAddon.current);

    term.open(terminalRef.current);

    try {
      const webgl = new WebglAddon();
      term.loadAddon(webgl);
    } catch (e) {
      console.warn("WebGL addon failed to load, using canvas fallback", e);
    }

    term.onData((data) => {
      invoke("write_pty", {
        id: ptyId,
        data: Array.from(new TextEncoder().encode(data)),
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddon.current) {
        fitAddon.current.fit();
        if (term.cols && term.rows) {
          invoke("resize_pty", { id: ptyId, cols: term.cols, rows: term.rows });
        }
      }
    });

    resizeObserver.observe(terminalRef.current);
    fitAddon.current.fit();
    if (term.cols && term.rows) {
      invoke("resize_pty", { id: ptyId, cols: term.cols, rows: term.rows });
    }

    let unlistenData: () => void;
    listen<{ id: string; data: number[] }>("pty-data", (event) => {
      if (event.payload.id === ptyId) {
        const str = new TextDecoder().decode(
          new Uint8Array(event.payload.data),
        );
        term.write(str);
      }
    }).then((unlisten) => {
      unlistenData = unlisten;
    });

    const interval = setInterval(async () => {
      try {
        const c = await invoke<string>("get_cwd", { id: ptyId });
        if (c) setInternalCwd(c);
        const p = await invoke<string>("get_process_name", { id: ptyId });
        if (p) setInternalProc(p);
      } catch (e) {}
    }, 1000);

    return () => {
      term.dispose();
      unregister(paneId);
      resizeObserver.disconnect();
      if (unlistenData) unlistenData();
      clearInterval(interval);
      invoke("kill_pty", { id: ptyId }).catch(() => {});
    };
  }, [ptyId, paneId, register, unregister]);

  useEffect(() => {
    if (termInstance.current) {
      termInstance.current.options.theme = getThemeObject(state.settings.theme);
      termInstance.current.refresh(0, termInstance.current.rows - 1);
    }
  }, [state.settings.theme]);

  const handleContainerClick = () => {
    onFocus();
  };

  const getFocusStyle = () => {
    const baseStyle: React.CSSProperties = {
      border: `var(--border-width) solid ${isFocused ? "var(--border-color)" : "transparent"}`,
      borderRadius: "var(--corner-radius)",
      padding: "var(--pane-padding)",
      backgroundColor: `rgba(var(--theme-background-rgb), calc(1 - var(--transparency) / 100))`,
      backdropFilter: `blur(var(--blur))`,
    };

    const focusAnim = getComputedStyle(document.documentElement).getPropertyValue("--focus-animation").trim();
    if (focusAnim === "fade") {
      baseStyle.transition = "border-color var(--animation-duration) ease";
    } else if (focusAnim === "spring") {
      baseStyle.transition = "border-color var(--animation-duration) cubic-bezier(0.34, 1.56, 0.64, 1)";
    }

    return baseStyle;
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      data-pane-id={paneId}
      className="flex flex-col w-full h-full box-border overflow-hidden relative"
      style={getFocusStyle()}
    >
      <div className="flex-1 overflow-hidden" ref={terminalRef} />
      <PaneStatusBar cwd={internalCwd} processName={internalProc} />
    </div>
  );
};
