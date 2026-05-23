// FILE: src/components/TileLayout.tsx
import React, { useRef } from "react";
import { TileNode, AppState, SplitDirection } from "../types";
import { TerminalPane } from "./TerminalPane";

interface TileLayoutProps {
  node: TileNode;
  focusedPaneId: string;
  workspaceId: string;
  state: AppState;
  dispatch: React.Dispatch<any>;
}

// Global mouse tracker for split logic
let lastMousePos = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  lastMousePos = { x: e.clientX, y: e.clientY };
});

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export const TileLayout: React.FC<TileLayoutProps> = ({
  node,
  focusedPaneId,
  workspaceId,
  state,
  dispatch,
}) => {
  const handleSplit = () => {};

  if (node.type === "pane") {
    return (
      <TerminalPane
        paneId={node.id}
        ptyId={node.ptyId}
        cwd={node.cwd}
        processName={node.processName}
        isFocused={node.id === focusedPaneId}
        onFocus={() => dispatch({ type: "SET_FOCUS", paneId: node.id })}
        onSplit={handleSplit}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        gap: "var(--gap-size)",
        display: "flex",
        flexDirection: node.type === "split" ? (node.direction === "horizontal" ? "row" : "column") : "column",
      }}
    >
      <SplitContainer
        node={node}
        focusedPaneId={focusedPaneId}
        workspaceId={workspaceId}
        state={state}
        dispatch={dispatch}
      />
    </div>
  );
};

interface SplitContainerProps {
  node: TileNode & { type: "split" };
  focusedPaneId: string;
  workspaceId: string;
  state: AppState;
  dispatch: React.Dispatch<any>;
}

const SplitContainer: React.FC<SplitContainerProps> = ({
  node,
  focusedPaneId,
  workspaceId,
  state,
  dispatch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newRatio = node.ratio;

      if (node.direction === "horizontal") {
        newRatio = (moveEvent.clientX - rect.left) / rect.width;
      } else {
        newRatio = (moveEvent.clientY - rect.top) / rect.height;
      }

      newRatio = Math.max(0.1, Math.min(0.9, newRatio));
      dispatch({ type: "SET_SPLIT_RATIO", splitId: node.id, ratio: newRatio });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const isHorizontal = node.direction === "horizontal";
  const firstBasis = `${node.ratio * 100}%`;
  const secondBasis = `${(1 - node.ratio) * 100}%`;

  return (
    <div
      ref={containerRef}
      className={`flex w-full h-full ${isHorizontal ? "flex-row" : "flex-col"} overflow-hidden`}
      style={{ gap: "var(--gap-size)" }}
    >
      <div
        style={{
          flexBasis: `calc(${firstBasis} - var(--gap-size) / 2)`,
          flexGrow: 0,
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <TileLayout
          node={node.first}
          focusedPaneId={focusedPaneId}
          workspaceId={workspaceId}
          state={state}
          dispatch={dispatch}
        />
      </div>
      <div
        className={`${isHorizontal ? "w-2 h-full cursor-col-resize -ml-1 -mr-1" : "h-2 w-full cursor-row-resize -mt-1 -mb-1"} hover:bg-surface2/50 transition-colors z-10 flex-shrink-0`}
        onMouseDown={handleMouseDown}
      />
      <div
        style={{
          flexBasis: `calc(${secondBasis} - var(--gap-size) / 2)`,
          flexGrow: 1,
          flexShrink: 1,
          overflow: "hidden",
        }}
      >
        <TileLayout
          node={node.second}
          focusedPaneId={focusedPaneId}
          workspaceId={workspaceId}
          state={state}
          dispatch={dispatch}
        />
      </div>
    </div>
  );
};

export function triggerDwindleSplit(
  state: AppState,
  dispatch: React.Dispatch<any>,
  spawnPty: (shell: string, cols: number, rows: number) => Promise<string>,
) {
  const activeWorkspace = state.workspaces.find(
    (w) => w.id === state.activeWorkspaceId,
  );
  if (!activeWorkspace) return;

  const currentPaneId = activeWorkspace.focusedPaneId;
  const paneEl = document.querySelector(`[data-pane-id="${currentPaneId}"]`);
  if (!paneEl) return;

  const rect = paneEl.getBoundingClientRect();
  const relX = (lastMousePos.x - rect.left) / rect.width;
  const relY = (lastMousePos.y - rect.top) / rect.height;

  const distLeft = relX;
  const distRight = 1 - relX;
  const distTop = relY;
  const distBottom = 1 - relY;

  let direction: SplitDirection = "horizontal";
  let swap = false;

  const minVert = Math.min(distLeft, distRight);
  const minHoriz = Math.min(distTop, distBottom);

  if (minVert < minHoriz) {
    direction = "horizontal";
    if (distLeft < distRight) swap = true;
  } else {
    direction = "vertical";
    if (distTop < distBottom) swap = true;
  }

  spawnPty(state.settings.shell, 80, 24).then((ptyId) => {
    dispatch({
      type: "SPLIT_PANE",
      paneId: currentPaneId,
      direction,
      newPtyId: ptyId,
      newPaneId: generateId(),
      swap,
    });
  });
}
