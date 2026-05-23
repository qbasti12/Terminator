import { useEffect } from "react";
import { Settings } from "../types";
import { themes } from "../themes";

export function useAppearance(settings: Settings) {
  useEffect(() => {
    const root = document.documentElement;

    // Apply Theme CSS variables
    const themeId = settings.theme || "catppuccin-mocha";
    const theme = themes[themeId] || themes["catppuccin-mocha"];

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

    // Apply Appearance CSS variables
    const app = settings.appearance;
    root.style.setProperty("--gap-size", `${app.gapSize}px`);
    root.style.setProperty("--border-width", `${app.borderWidth}px`);

    let bColor = "transparent";
    if (app.borderColor) {
      bColor = app.borderColor === "accent" ? theme.accent : app.borderColor;
    }
    root.style.setProperty("--border-color", bColor);
    root.style.setProperty("--corner-radius", `${app.cornerRadius}px`);
    root.style.setProperty("--transparency", `${app.transparency}`);
    root.style.setProperty("--blur", `${app.blur}px`);
    root.style.setProperty("--pane-padding", `${app.padding}px`);
    root.style.setProperty("--focus-animation", app.focusAnimation);
    root.style.setProperty("--animation-duration", `${app.animationDuration}ms`);

  }, [settings.theme, settings.appearance]);
}
