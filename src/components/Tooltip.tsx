import React, { useState, useRef, ReactNode, useEffect } from "react";

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, 1500);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          className="absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[260px] bg-surface1 border border-surface2 text-subtext0 text-[12px] p-2 rounded shadow-lg whitespace-normal break-words pointer-events-none"
        >
          {text}
        </div>
      )}
    </div>
  );
};
