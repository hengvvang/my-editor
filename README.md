# Typoly

A modern, high-performance hybrid editor for **Markdown**, **Typst**, **Mermaid**, and **LaTeX** built with efficiency and aesthetics in mind.

![Editor Screenshot](https://via.placeholder.com/800x450?text=Typoly+Preview)

## 🚀 Key Features

### ✍️ Hybrid Editing Experience
*   **Visual Mode (Zen Style)**: A focused, distraction-free writing environment now available for **ALL** file types (Markdown, Code, Text).
    *   *Card-Style Highlighting*: Active lines are highlighted with a modern "Card" effect (Sky Blue theme) features a clear left indicator bar and subtle shadows, aiding focus.
    *   *Universal Zen*: Whether you are writing a novel in Markdown or coding in Rust, switch to Visual Mode for a cleaner, reading-optimized layout.
    *   *HTML Enhancements*: Intelligent fading of HTML tags in visual mode to reduce noise while keeping structure visible.
    *   *Live Rendering*: Markdown supports generic features, plus Latex math auto-folding.
*   **Code Mode**: Full-control source editing with syntax highlighting.
*   **Movable Toolbar**: Toggle the editor toolbar between **Top** and **Bottom** positions to suit your workflow. Features a compact design to maximize vertical screen real estate.
*   **Smart Preview System**:
    *   **Performance**: Backend-accelerated rendering using **Rust** (`ammonia` + `comrak`).
    *   **Large File Optimization**: Dynamic debouncing strategy automatically adjusts based on file size (10k/100k lines) to prevent UI freezing.
    *   **Independent**: Preview panes work independently of editor modes.
    *   **Universal Zoom**: All preview windows (Markdown, Typst, Mermaid, LaTeX) now support **smooth scaling**. Float over the preview area to access Zoom In/Out controls.

### 🧠 Productivity Tools
*   **Integrated Typing Practice**:
    *   Based on the powerful engine of **[Qwerty Learner](https://github.com/RealKai42/qwerty-learner)**.
    *   **Three Powerful Modes**:
        *   **Practice Mode**: Traditional typing practice to build muscle memory and speed.
        *   **Memory Mode**: Challenge yourself by hiding words until typed—perfect for active recall.
        *   **Read Mode**: A distraction-free "Card" mode for passive vocabulary review.
            *   *Focus*: Optimized layout with large phonetic symbols and centralized content to minimize eye movement.
            *   *Interactive Blur*: "No EN" and "No CN" toggles use intelligent blurring for self-testing; hover to reveal.
            *   *Audio-First*: One-click pronunciation and "Next Word" controls moved to the ergonomic bottom zone for single-handed use.
    *   **Features**:
        *   Supports multiple dictionaries (CET-4, CET-6, TOEFL, IELTS, Code, etc.).
        *   **Visual & Audio Feedback**: Key sounds, pronunciation, and progress tracking.
        *   **Ergonomic Integration**: Built directly into the editor as a dedicated tab type.
        *   **Sessions**: Save and resume your practice sessions (stored as JSON files).

### �🎨 Typography & Design
*   **System Fonts**: Uses system native fonts for a consistent and optimized reading and writing experience.
    *   *Screen Version*: Optimized non-monospace font used for UI and reading.
    *   *Mono Version*: Native fallback to system monospaced fonts (Consolas/Monaco) for code alignment.
*   **Font Switching**: Dedicated toggle button in the toolbar to switch the editor between **Variable Width** (Reading mode) and **Monospace** (Coding mode) on the fly.
*   **Language Support**: Powered by CodeMirror 6 with support for JS/TS, Rust, Python, C++, Go, Java, SQL, PHP, Vue, and more.

### 🧩 Modern & Flexible UI
*   **Smart Split Groups**: Create complex layouts with recursive **Vertical** and **Horizontal** splitting. Supports intuitive drag-and-drop resizing.
*   **Refined Design**:
    *   **Square Tabs**: Clean, space-efficient tab design inspired by modern IDEs.
    *   **Optimized Title Bar**: Layout reorganized for better ergonomics, with file info on the left and actions on the right.
    *   **Immersive Toolbars**: Controls blend seamlessly with the content area.
*   **Inline File Explorer**: Enhanced sidebar with VS Code-style inline input for creating files and folders.
*   **Tree Controls**: Added **Collapse All** button to instantly tidy up complex directory structures.
*   **Interactive Breadcrumbs**: Full-featured navigation bar with recursive directory dropdowns and intelligent "click-to-open" file loading.
*   **Smart Layout**:
    *   **Minimap**: Visual overview that works seamlessly across all file types and layout modes.
    *   **Responsive**: Layout automatically adjusts to viewport changes.

### 📂 Intelligent Workspace Management
*   **Active Workspaces**: Mark frequent workspaces as "Active" for instant top-bar access (Green theme).
    *   *Shortcuts*: Persistent, quick-switch buttons in the window title bar.
    *   *Quick Actions*: Right-click or hover to easily deactivate.
*   **Access Tiers**:
    *   **⚡ Active**: For high-priority, daily projects.
    *   **⭐ Archive**: For important pinned references (formerly Starred).
    *   **🕒 Recent**: Automatic history of previously opened folders (denoted by **Amber** color).
*   **Visual Organization**: Clear color-coded sections (Green/Blue/Amber) and intuitive icons (Zap/Star) in the sidebar.

### 🔍 Advanced Search & Replace
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
    *   *Selection-Aware*: Automatically captures only your **selected text** for precise control, or defaults to the whole file if nothing is selected.
    *   *Smart Layout*: Dynamic container sizing ensures screenshots look great whether youre capturing 3 lines or 300.
    *   *Theme Support*: One-click **Light / Dark** theme toggling with true background and syntax highlighting inversion (perfect integration for Mermaid/Typst previews).
    *   *Floating Canvas*: Updated UI with floating, auto-hiding controls that stay out of your way.
    *   *Export*: Save as high-res PNG or copy directly to clipboard with optimized font rendering and pixel-perfect padding.
*   **Universal PDF Export**:
    *   **Direct Print**: One-click PDF export for **ALL** file types using browser-native printing technology.
    *   **Print Optimization**: Custom print stylesheets ensure clean layouts, hiding UI elements and optimizing margins for A4 paper.
*   **Preview Actions**: Uniform floating toolbar on all preview panes for consistent Zoom, Copy, and Save operations.
*   **Typst Support**: First-class support for `.typ` files with auto-compilation and instant SVG preview.
    *   *Full Windows Font Support*: Backend automatically injects configuration to use native fonts (Arial, Cambria Math) for perfect rendering of text and equations.
    *   *Image Path Resolution*: Intelligent handling of relative image paths in project structures.
    *   *Dark Mode Ready*: Preview automatically adapts to dark backgrounds with smart color inversion for perfect readability.
    *   *Enhanced Preview*: Real-time "Paper View" simulation with auto-scaling to full width.
*   **Mermaid Support**: Native support for `.mmd` / `.mermaid` files with live diagram rendering and error reporting.
    *   *Native Dark Mode*: Forces native dark theme rendering in dark mode for crisp, high-contrast diagrams.
*   **Excalidraw Integration**:
    *   **Native Whiteboard**: Full-featured [Excalidraw](https://excalidraw.com/) editor embedded directly in the workspace. Support for `.excalidraw` files.
    *   **Offline Ready**: All assets (fonts, scripts) are bundled locally — no internet connection required.
    *   **Quick Draw**: Instantly launch a new whiteboard via the **Pen Tool** in the tab bar.
    *   **Virtual Documents**: Drawings start as lightweight "Untitled" files in memory and prompt for save location only when you're ready.
*   **Typing Practice (Qwerty Learner)**:
    *   **Integrated Training**: Built-in typing practice tool to improve keyboard speed and accuracy without leaving the editor.
    *   **Dual Dictionaries**: Choose from **Programmer** (50 coding keywords) or **Basic** (30 algorithm terms) word lists.
    *   **Real-time Metrics**: Live WPM (Words Per Minute), accuracy percentage, and progress tracking.
    *   **Smart Feedback**: Color-coded character highlighting (green for correct, red for errors) with shake animation on mistakes.
    *   **Customizable**: Toggle translation hints and sound effects from the sidebar settings panel.
    *   **Quick Access**: Launch practice sessions via sidebar or tab bar keyboard icon.
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
*   [x] Excalidraw Integration
*   [x] Typing Practice Tool
*   [ ] Custom Themes support.
*   [ ] Export to PDF/HTML.
*   [ ] Plugin system.

## 📦 Package Size

*   **Installer**: ~11-15 MB (NSIS/MSI)
*   **Source Code**: 0.31 MB
*   **Frontend Build**: 5.13 MB

## ❤️ Acknowledgments

Special thanks to the open source community and these amazing projects:

*   **[Qwerty Learner](https://github.com/RealKai42/qwerty-learner)** by [RealKai42](https://github.com/RealKai42):
    *   Typoly integrates the core logic and dictionary resources of Qwerty Learner to provide a seamless typing practice experience for developers.
    *   *“For keyboard workers, memory muscle training software.”*

## 📄 License

MIT License
