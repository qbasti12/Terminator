// FILE: src/components/TerminalPane.tsx
import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { SearchAddon } from "@xterm/addon-search";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { PaneStatusBar } from "./PaneStatusBar";
import { SplitDirection } from "../types";

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
  const searchAddon = useRef<SearchAddon | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalCwd, setInternalCwd] = useState(cwd);
  const [internalProc, setInternalProc] = useState(processName);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: "#1E1E2E",
        foreground: "#CDD6F4",
        cursor: "#CDD6F4",
        black: "#45475A",
        red: "#F38BA8",
        green: "#A6E3A1",
        yellow: "#F9E2AF",
        blue: "#89B4FA",
        magenta: "#CBA6F7",
        cyan: "#94E2D5",
        white: "#BAC2DE",
        brightBlack: "#585B70",
        brightRed: "#F38BA8",
        brightGreen: "#A6E3A1",
        brightYellow: "#F9E2AF",
        brightBlue: "#89B4FA",
        brightMagenta: "#CBA6F7",
        brightCyan: "#94E2D5",
        brightWhite: "#A6ADC8",
      },
    });

    termInstance.current = term;
    fitAddon.current = new FitAddon();
    searchAddon.current = new SearchAddon();

    term.loadAddon(fitAddon.current);
    term.loadAddon(searchAddon.current);

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
      resizeObserver.disconnect();
      if (unlistenData) unlistenData();
      clearInterval(interval);
      invoke("kill_pty", { id: ptyId }).catch(() => {});
    };
  }, [ptyId]);

  useEffect(() => {
    const handleOpenSearch = () => {
      if (isFocused) {
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("open-search", handleOpenSearch);
    return () => window.removeEventListener("open-search", handleOpenSearch);
  }, [isFocused]);

  const handleContainerClick = () => {
    onFocus();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      data-pane-id={paneId}
      className={`flex flex-col w-full h-full border ${isFocused ? "border-mauve" : "border-transparent"} box-border overflow-hidden bg-base relative`}
    >
      {showSearch && (
        <div className="absolute top-0 right-0 p-2 bg-mantle border-b border-l border-surface1 z-10 flex space-x-2">
          <input
            type="text"
            className="bg-crust text-text p-1 rounded outline-none border border-surface1"
            placeholder="Search..."
            onChange={(e) => searchAddon.current?.findNext(e.target.value)}
          />
          <button
            onClick={() => setShowSearch(false)}
            className="text-text px-2"
          >
            X
          </button>
        </div>
      )}
      <div className="flex-1 overflow-hidden" ref={terminalRef} />
      <PaneStatusBar cwd={internalCwd} processName={internalProc} />
    </div>
  );
};
