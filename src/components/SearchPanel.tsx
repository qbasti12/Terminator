import React, { useState, useEffect, useRef } from "react";
import { AppState, PaneNode, TileNode } from "../types";
import { useTerminalRegistry } from "../context/TerminalRegistry";
import { SearchAddon } from "@xterm/addon-search";

interface SearchPanelProps {
  state: AppState;
  dispatch: React.Dispatch<any>;
}

// Reuse the fuzzy matching from command palette
function fuzzyMatch(needle: string, haystack: string): boolean {
  if (needle.length === 0) return true;
  let nIdx = 0;
  const nLen = needle.length;
  const hLen = haystack.length;
  const lowerNeedle = needle.toLowerCase();
  const lowerHaystack = haystack.toLowerCase();

  for (let hIdx = 0; hIdx < hLen; hIdx++) {
    if (lowerHaystack[hIdx] === lowerNeedle[nIdx]) {
      nIdx++;
      if (nIdx === nLen) return true;
    }
  }
  return false;
}

const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight) return <span>{text}</span>;

  const parts: { char: string, isMatch: boolean }[] = [];
  let nIdx = 0;
  const lowerHighlight = highlight.toLowerCase();

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (nIdx < highlight.length && char.toLowerCase() === lowerHighlight[nIdx]) {
      parts.push({ char, isMatch: true });
      nIdx++;
    } else {
      parts.push({ char, isMatch: false });
    }
  }

  return (
    <span>
      {parts.map((p, i) =>
        p.isMatch ? <span key={i} className="text-accent">{p.char}</span> : <span key={i}>{p.char}</span>
      )}
    </span>
  );
};

export const SearchPanel: React.FC<SearchPanelProps> = ({ state, dispatch }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "panes">("terminal");
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { getTerminal } = useTerminalRegistry();
  const searchAddons = useRef(new Map<string, SearchAddon>());

  useEffect(() => {
    const handleOpenSearch = () => {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener("open-search", handleOpenSearch);
    return () => window.removeEventListener("open-search", handleOpenSearch);
  }, []);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  const activeWorkspace = state.workspaces.find(w => w.id === state.activeWorkspaceId);

  const getLeaves = (node: TileNode): PaneNode[] => {
    if (node.type === "pane") return [node];
    return [...getLeaves(node.first), ...getLeaves(node.second)];
  };

  const paneItems: { id: string, label: string, wsId: string, action: () => void }[] = [];
  state.workspaces.forEach(ws => {
    getLeaves(ws.root).forEach(pane => {
      paneItems.push({
        id: pane.id,
        label: `${ws.name} → ${pane.processName}  ${pane.cwd}`,
        wsId: ws.id,
        action: () => {
          dispatch({ type: "SWITCH_WORKSPACE", id: ws.id });
          dispatch({ type: "SET_FOCUS", paneId: pane.id });
          close();
        }
      });
    });
  });

  const filteredPanes = paneItems.filter(p => fuzzyMatch(query, p.label));

  const handleTerminalSearch = (val: string) => {
    setQuery(val);
    if (!activeWorkspace) return;
    const paneId = activeWorkspace.focusedPaneId;
    const term = getTerminal(paneId);
    if (!term) return;

    let addon = searchAddons.current.get(paneId);
    if (!addon) {
      addon = new SearchAddon();
      term.loadAddon(addon);
      searchAddons.current.set(paneId, addon);
    }
    addon.findNext(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    } else if (activeTab === "panes") {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(s => (s + 1) % filteredPanes.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(s => (s - 1 + filteredPanes.length) % filteredPanes.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredPanes[selectedIndex]) {
          filteredPanes[selectedIndex].action();
        }
      }
    } else if (activeTab === "terminal" && e.key === "Enter") {
      e.preventDefault();
      handleTerminalSearch(query);
    }
  };

  return (
    <div className={`fixed z-[90] ${activeTab === "terminal" ? "top-4 right-4" : "inset-0 flex items-start justify-center pt-24 bg-black/20"}`} onClick={close}>
      <div
        className={`${activeTab === "terminal" ? "w-[300px]" : "w-[560px] max-h-[400px]"} flex flex-col bg-surface0/90 border border-surface2 rounded shadow-2xl backdrop-blur-xl overflow-hidden`}
        style={{ borderRadius: "var(--corner-radius)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex bg-surface1 text-sm text-subtext0 font-semibold border-b border-surface2">
          <button
            className={`flex-1 py-1 ${activeTab === "terminal" ? "text-accent border-b-2 border-accent" : "hover:text-text"}`}
            onClick={() => setActiveTab("terminal")}
          >
            Terminal
          </button>
          <button
            className={`flex-1 py-1 ${activeTab === "panes" ? "text-accent border-b-2 border-accent" : "hover:text-text"}`}
            onClick={() => { setActiveTab("panes"); setSelectedIndex(0); }}
          >
            Panes
          </button>
        </div>

        <div className="p-3 border-b border-surface2">
          <input
            ref={inputRef}
            type="text"
            placeholder={activeTab === "terminal" ? "Search active terminal..." : "Search panes..."}
            value={query}
            onChange={e => activeTab === "terminal" ? handleTerminalSearch(e.target.value) : setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none w-full text-text placeholder-surface2"
          />
        </div>

        {activeTab === "panes" && (
          <div className="flex-1 overflow-y-auto py-2 max-h-[300px]">
            {filteredPanes.length === 0 ? (
              <div className="px-4 py-2 text-subtext0 text-sm">No panes found.</div>
            ) : (
              filteredPanes.map((item, idx) => (
                <div
                  key={item.id}
                  className={`px-4 py-2 cursor-pointer flex items-center text-sm ${idx === selectedIndex ? "bg-surface1 text-text" : "text-subtext0 hover:bg-surface0"}`}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <HighlightedText text={item.label} highlight={query} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
