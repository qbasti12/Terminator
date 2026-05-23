// FILE: src/components/PaneStatusBar.tsx
import React from "react";
import { Folder } from "lucide-react";

interface PaneStatusBarProps {
  cwd: string;
  processName: string;
}

export const PaneStatusBar: React.FC<PaneStatusBarProps> = ({
  cwd,
  processName,
}) => {
  return (
    <div className="h-[24px] bg-crust text-subtext0 text-[11px] font-mono flex items-center justify-between px-2 select-none">
      <div className="flex items-center space-x-2 overflow-hidden whitespace-nowrap">
        <Folder size={12} className="text-blue" />
        <span className="truncate">{cwd}</span>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
        <span className="px-1.5 py-0.5 rounded bg-surface0 text-text">
          {processName}
        </span>
      </div>
    </div>
  );
};
