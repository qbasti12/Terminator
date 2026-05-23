// FILE: src/state/tileHelpers.ts
import { TileNode, PaneNode } from "../types";

export function findPane(root: TileNode, id: string): PaneNode | null {
  if (root.type === "pane") {
    return root.id === id ? root : null;
  }
  return findPane(root.first, id) || findPane(root.second, id);
}

export function replaceNode(
  root: TileNode,
  targetId: string,
  newNode: TileNode,
): TileNode {
  if (root.id === targetId) return newNode;
  if (root.type === "pane") return root;

  return {
    ...root,
    first: replaceNode(root.first, targetId, newNode),
    second: replaceNode(root.second, targetId, newNode),
  };
}

export function removePane(
  root: TileNode,
  targetId: string,
): { newRoot: TileNode | null; focusId: string | null } {
  if (root.type === "pane") {
    if (root.id === targetId) return { newRoot: null, focusId: null };
    return { newRoot: root, focusId: root.id };
  }

  if (root.first.id === targetId) {
    const focusId = getFirstPane(root.second).id;
    return { newRoot: root.second, focusId };
  }
  if (root.second.id === targetId) {
    const focusId = getFirstPane(root.first).id;
    return { newRoot: root.first, focusId };
  }

  const leftResult = removePane(root.first, targetId);
  if (leftResult.newRoot !== root.first) {
    return {
      newRoot: { ...root, first: leftResult.newRoot! },
      focusId: leftResult.focusId,
    };
  }

  const rightResult = removePane(root.second, targetId);
  if (rightResult.newRoot !== root.second) {
    return {
      newRoot: { ...root, second: rightResult.newRoot! },
      focusId: rightResult.focusId,
    };
  }

  return { newRoot: root, focusId: null };
}

export function getFirstPane(root: TileNode): PaneNode {
  if (root.type === "pane") return root;
  return getFirstPane(root.first);
}

export function updatePaneData(
  root: TileNode,
  ptyId: string,
  updates: Partial<PaneNode>,
): TileNode {
  if (root.type === "pane") {
    if (root.ptyId === ptyId) {
      return { ...root, ...updates };
    }
    return root;
  }
  return {
    ...root,
    first: updatePaneData(root.first, ptyId, updates),
    second: updatePaneData(root.second, ptyId, updates),
  };
}

export function buildSnapshot(state: import("../types").AppState) {
  const buildTileSnapshot = (node: TileNode): any => {
    if (node.type === "pane") {
      return {
        type: "pane",
        id: node.id,
        cwd: node.cwd,
      };
    }
    return {
      type: "split",
      id: node.id,
      direction: node.direction,
      ratio: node.ratio,
      first: buildTileSnapshot(node.first),
      second: buildTileSnapshot(node.second),
    };
  };

  return {
    workspaces: state.workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      root: buildTileSnapshot(w.root),
      focusedPaneId: w.focusedPaneId,
    })),
    activeWorkspaceId: state.activeWorkspaceId,
  };
}

export function collectPaneSnapshots(root: any): any[] {
  if (root.type === "pane") {
    return [root];
  }
  return [
    ...collectPaneSnapshots(root.first),
    ...collectPaneSnapshots(root.second),
  ];
}
