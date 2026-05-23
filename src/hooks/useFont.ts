import { useEffect } from "react";
import { Settings } from "../types";
import { useTerminalRegistry } from "../context/TerminalRegistry";

export function useFont(settings: Settings) {
  const { getAllTerminals } = useTerminalRegistry();

  useEffect(() => {
    const root = document.documentElement;
    const { font } = settings;

    root.style.setProperty("--font-family", font.family);
    root.style.setProperty("--font-size", `${font.size}px`);

    const terminals = getAllTerminals();
    terminals.forEach((terminal) => {
      terminal.options.fontFamily = font.family;
      terminal.options.fontSize = font.size;
      terminal.options.cursorStyle = (font.cursorStyle === "beam" ? "bar" : font.cursorStyle) as "block" | "underline" | "bar";
      terminal.options.cursorBlink = font.cursorBlink;
      terminal.options.scrollback = font.scrollback;

      // Force refresh on terminal
      terminal.refresh(0, terminal.rows - 1);
    });
  }, [settings.font, getAllTerminals]);
}
