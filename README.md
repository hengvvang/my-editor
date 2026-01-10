# Typoly

A modern, high-performance hybrid editor for **Markdown**, **Typst**, **Mermaid**, and **LaTeX** built with efficiency and aesthetics in mind.

![Editor Screenshot](https://via.placeholder.com/800x450?text=Typoly+Preview)

## 🚀 Key Features

### ✍️ Hybrid Editing Experience
*   **Visual Mode (Zen Style)**: A focused, distraction-free writing environment now available for **ALL** file types (Markdown, Code, Text).
    *   *Card-Style Highlighting**: Active lines are highlighted with a modern "Card" effect (Sky Blue theme) featuring a clear left indicator bar and subtle shadows, aiding focus.
    *   *Universal Zen*: Whether you are writing a novel in Markdown or coding in Rust, switch to Visual Mode for a cleaner, reading-optimized layout.
    *   *HTML Enhancements*: Intelligent fading of HTML tags in visual mode to reduce noise while keeping structure visible.
    *   *Live Rendering*: Markdown supports generic features, plus Latex math auto-folding.
*   **Code Mode**: Full-control source editing with syntax highlighting.
*   **Smart Preview System**:
    *   **Performance**: Backend-accelerated rendering using **Rust** (`ammonia` + `comrak`).
    *   **Large File Optimization**: Dynamic debouncing strategy automatically adjusts based on file size (10k/100k lines) to prevent UI freezing.
    *   **Independent**: Preview panes work independently of editor modes.

### 🎨 Typography & Design
    *   **Tier 1 (High Performance)**: Powered by CodeMirror 6 Lezer parsers for JS/TS, Rust, Python, C++, Go, Java, SQL, PHP, Vue, XML, YAML, HTML/CSS.
    *   **Legacy Support**: Fallback support for generic text formats.
    *   **Ergonomic Status Bar**: Dynamic language detection and display (e.g., displaying "React (TSX)" instead of just "TSX").

### 🎨 Typography & Design
*   **System Fonts**: Uses system native fonts for a consistent and optimized reading and writing experience.
    *   *Screen Version*: Optimized non-monospace font used for UI and reading.
    *   *Mono Version*: Native fallback to system monospaced fonts (Consolas/Monaco) for code alignment.
*   **Font Switching**: Dedicated toggle button in the toolbar to switch the editor between **Variable Width** (Reading mode) and **Monospace** (Coding mode) on the fly.

### 🧩 Modern & Flexible UI
*   **Smart Split Groups**: Create complex layouts with recursive **Vertical** and **Horizontal** splitting. Supports intuitive drag-and-drop resizing.
*   **Refined Design**:
    *   **Square Tabs**: Clean, space-efficient tab design inspired by modern IDEs.
    *   **Optimized Title Bar**: Layout reorganized for better ergonomics, with file info on the left and actions on the right.
    *   **Immersive Toolbars**: Controls blend seamlessly with the content area.
*   **Inline File Explorer**: Enhanced sidebar with VS Code-style inline input for creating files and folders.
*   **Interactive Breadcrumbs**: Full-featured navigation bar with recursive directory dropdowns and intelligent "click-to-open" file loading.
*   **Smart Layout**:
    *   **Minimap**: Visual overview that works seamlessly across all file types and layout modes.
    *   **Responsive**: Layout automatically adjusts to viewport changes.

### �️ Intelligent Workspace Management
*   **Active Workspaces**: Mark frequent workspaces as "Active" for instant top-bar access (Green theme).
    *   *Shortcuts*: Persistent, quick-switch buttons in the window title bar.
    *   *Quick Actions*: Right-click or hover to easily deactivate.
*   **Access Tiers**:
    *   **⚡ Active**: For high-priority, daily projects.
    *   **⭐ Archive**: For important pinned references (formerly Starred).
    *   **🕒 Recent**: Automatic history of previously opened folders.
*   **Visual Organization**: Clear color-coded sections (Green/Blue/Amber) and intuitive icons (Zap/Star) in the sidebar.

### �🔍 Advanced Search & Replace
*   **High Performance**: Multi-threaded parallel search backend powered by Rust, capable of handling large workspaces instantly.
*   **Smart Scopes**: 5-level search scope control for precise targeting:
    *   📄 Current File
    *   📖 Current Editor Group
    *   📚 All Open Files
    *   💼 Current Workspace
    *   🗄️ All History Workspaces
*   **Visual Overview**: VS Code-style "Overview Ruler" in the scrollbar area showing color-coded match distribution (Blue: Active File, Cyan: Active Group, etc.).
*   **Ergonomic UI**:
    *   Collapsible "Replace" interface.
    *   VS Code-like auxiliary toolbar.
    *   Intuitive icon-based scope switching.
    *   Real-time regex highlighting.

### ⚡ Power User Tools
*   **CodeSnap**: Built-in tool to create beautiful, shareable screenshots.
    *   *Integrated*: Toggle seamlessly between **Code** mode and **rendered Preview** mode to capture exactly what you need.
    *   *Theme Support*: One-click **Light / Dark** theme toggling with correct background and syntax highlighting inversion.
    *   *Export*: Save as high-res PNG or copy directly to clipboard with optimized font rendering.
    *   *Clean*: Auto-hides UI controls during capture for professional-grade images.
*   **Preview Actions**: Floating toolbar on all preview panes (Markdown / Typst / Mermaid) for instant "Copy Image" or "Save Image" without opening CodeSnap.
*   **Typst Support**: First-class support for `.typ` files with auto-compilation and instant SVG preview.
    *   *Enhanced Preview*: Real-time "Paper View" simulation with auto-scaling (Full Width) and shadow effects.
*   **Mermaid Support**: Native support for `.mmd` / `.mermaid` files with live diagram rendering and error reporting.
*   **LaTeX Support**: Native `.tex` editing with **KaTeX** powered real-time preview and live-editor math widgets.
*   **Vim Mode**: Integrated Vim keybindings for keyboard warriors.
*   **Minimap**: Visual overview of your document with active line and selection indicators.
*   **Outline View**: Auto-generated table of contents for quick navigation.

## 🛠️ Tech Stack

*   **Core**: [Tauri v2](https://tauri.app/) (Rust) - Lightweight and secure.
*   **Frontend**: React 18 + TypeScript.
*   **Editor Engine**: [CodeMirror 6](https://codemirror.net/) - Robust and extensible.
*   **Styling**: TailwindCSS - Beautiful, clean utility-first design.
*   **Typography**: System fonts (San Francisco, Segoe UI, Roboto, etc.).
*   **Backend**: Rust - Handling file I/O, native Search, and Typst compilation.

## 💻 Building & Running

1.  **Prerequisites**:
    *   Node.js (v18+)
    *   Rust (latest stable)
    *   VS Build Tools (Windows) or Xcode Command Line Tools (macOS)

2.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```

3.  **Run in Development Mode**:
    ```bash
    npm run tauri dev
    ```

4.  **Build Release**:
    ```bash
    npm run tauri build
    ```

## 📝 Roadmap

*   [x] System Fonts Integration
*   [x] Global Search
*   [x] Minimap & Layout fixes
*   [ ] Custom Themes support.
*   [ ] Export to PDF/HTML.
*   [ ] Plugin system.

## 📄 License

MIT License
