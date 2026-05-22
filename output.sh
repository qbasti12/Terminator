#!/bin/bash
cat terminator/README.md
echo ""
echo "// FILE: src-tauri/Cargo.toml"
cat terminator/src-tauri/Cargo.toml
echo ""
echo "// FILE: src-tauri/tauri.conf.json"
cat terminator/src-tauri/tauri.conf.json
echo ""
echo "// FILE: src-tauri/src/main.rs"
cat terminator/src-tauri/src/main.rs
echo ""
echo "// FILE: src-tauri/src/pty_manager.rs"
cat terminator/src-tauri/src/pty_manager.rs
echo ""
echo "// FILE: src-tauri/src/settings.rs"
cat terminator/src-tauri/src/settings.rs
echo ""
echo "// FILE: package.json"
cat terminator/package.json
echo ""
echo "// FILE: tsconfig.json"
cat terminator/tsconfig.json
echo ""
echo "// FILE: tailwind.config.js"
cat terminator/tailwind.config.js
echo ""
echo "// FILE: vite.config.ts"
cat terminator/vite.config.ts
echo ""
echo "// FILE: index.html"
cat terminator/index.html
echo ""
echo "// FILE: src/main.tsx"
cat terminator/src/main.tsx
echo ""
echo "// FILE: src/App.tsx"
cat terminator/src/App.tsx
echo ""
echo "// FILE: src/types.ts"
cat terminator/src/types.ts
echo ""
echo "// FILE: src/state/useAppState.ts"
cat terminator/src/state/useAppState.ts
echo ""
echo "// FILE: src/state/tileHelpers.ts"
cat terminator/src/state/tileHelpers.ts
echo ""
echo "// FILE: src/hooks/useKeybindings.ts"
cat terminator/src/hooks/useKeybindings.ts
echo ""
echo "// FILE: src/hooks/usePtyEvents.ts"
cat terminator/src/hooks/usePtyEvents.ts
echo ""
echo "// FILE: src/components/TopBar.tsx"
cat terminator/src/components/TopBar.tsx
echo ""
echo "// FILE: src/components/TileLayout.tsx"
cat terminator/src/components/TileLayout.tsx
echo ""
echo "// FILE: src/components/TerminalPane.tsx"
cat terminator/src/components/TerminalPane.tsx
echo ""
echo "// FILE: src/components/PaneStatusBar.tsx"
cat terminator/src/components/PaneStatusBar.tsx
echo ""
echo "// FILE: src/components/SettingsModal.tsx"
cat terminator/src/components/SettingsModal.tsx
echo ""
echo "HOW TO RUN"
echo "1. git clone <repo_url> terminator"
echo "2. cd terminator"
echo "3. npm install"
echo "4. npm run build"
echo "5. npm run tauri dev"
