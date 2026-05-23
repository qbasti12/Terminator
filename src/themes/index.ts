export interface Theme {
  id: string;
  name: string;
  background: string;
  mantle: string;
  crust: string;
  surface0: string;
  surface1: string;
  surface2: string;
  overlay0: string;
  subtext0: string;
  text: string;
  accent: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  lavender: string;
  backgroundRgb: string;
}

export const themes: Record<string, Theme> = {
  "catppuccin-mocha": {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    background: "#1E1E2E",
    backgroundRgb: "30,30,46",
    mantle: "#181825",
    crust: "#11111B",
    surface0: "#313244",
    surface1: "#45475A",
    surface2: "#585B70",
    overlay0: "#6C7086",
    subtext0: "#A6ADC8",
    text: "#CDD6F4",
    accent: "#CBA6F7",
    red: "#F38BA8",
    green: "#A6E3A1",
    yellow: "#F9E2AF",
    blue: "#89B4FA",
    lavender: "#B4BEFE",
  },
  "tokyo-night": {
    id: "tokyo-night",
    name: "Tokyo Night",
    background: "#1A1B26",
    backgroundRgb: "26,27,38",
    mantle: "#16161E",
    crust: "#13131A",
    surface0: "#24283B",
    surface1: "#292E42",
    surface2: "#3B4261",
    overlay0: "#565F89",
    subtext0: "#9AA5CE",
    text: "#C0CAF5",
    accent: "#7AA2F7",
    red: "#F7768E",
    green: "#9ECE6A",
    yellow: "#E0AF68",
    blue: "#7AA2F7",
    lavender: "#BB9AF7",
  },
  "gruvbox-dark": {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    background: "#282828",
    backgroundRgb: "40,40,40",
    mantle: "#1D2021",
    crust: "#161617",
    surface0: "#3C3836",
    surface1: "#504945",
    surface2: "#665C54",
    overlay0: "#7C6F64",
    subtext0: "#BDAE93",
    text: "#EBDBB2",
    accent: "#D79921",
    red: "#CC241D",
    green: "#98971A",
    yellow: "#D79921",
    blue: "#458588",
    lavender: "#B16286",
  },
  "nord": {
    id: "nord",
    name: "Nord",
    background: "#2E3440",
    backgroundRgb: "46,52,64",
    mantle: "#292D3A",
    crust: "#242831",
    surface0: "#3B4252",
    surface1: "#434C5E",
    surface2: "#4C566A",
    overlay0: "#616E88",
    subtext0: "#9099AB",
    text: "#ECEFF4",
    accent: "#88C0D0",
    red: "#BF616A",
    green: "#A3BE8C",
    yellow: "#EBCB8B",
    blue: "#5E81AC",
    lavender: "#B48EAD",
  },
};
