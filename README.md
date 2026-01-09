# Typoly

A modern, high-performance hybrid editor for **Markdown**, **Typst**, **Mermaid**, and **LaTeX** built with efficiency and aesthetics in mind.

![Editor Screenshot](https://via.placeholder.com/800x450?text=Typoly+Preview)

## 🚀 Key Features

### ✍️ Hybrid Editing Experience
*   **Visual Mode**: A distraction-free, WYSIWYG-like writing environment (Markdown & LaTeX only).
    *   *Now supports*: **Live LaTeX Math** rendering inside the editor (Auto-fold `$code$` to $\LaTeX$ symbol).
    *   *Smart Mode*: Visual rendering is automatically disabled for raw code files (Code, Text, etc.) to ensure precision.
*   **Code Mode**: Full-control source editing with syntax highlighting.
*   **Split View**: Resizable side-by-side editor and live preview.
    *   *New*: Ergonomic resize handle that works regardless of window size or layout complexity.
    *   *Independent*: Preview works independently of the editor mode (Code/Visual).
    *   *Smart Preview*: For generic files (Rust, JS, JSON, etc.), the preview pane automatically acts as a **Read-Only Source Viewer**, ensuring utility across all file types.

### 🎨 Typography & Design
*   **System Fonts**: Uses system native fonts for a consistent and optimized reading and writing experience.
    *   *Screen Version*: Optimized non-monospace font used for UI and reading.
    *   *Mono Version*: Native fallback to system monospaced fonts (Consolas/Monaco) for code alignment.
*   **Font Switching**: Dedicated toggle button in the toolbar to switch the editor between **Variable Width** (Reading mode) and **Monospace** (Coding mode) on the fly.

### 🧩 Modern & Flexible UI
*   **Smart Split Groups**: Create multiple editor groups with drag-and-drop resizing. Each group is assigned a unique, cycling color theme.
*   **Immersive Toolbars**: Editor controls (Lock, Split, Preview, Font Toggle) feature a glass-morphism effect that blends seamlessly.
*   **Interactive Breadcrumbs**: VS Code-style file path navigation bar.
*   **Smart Layout**:
    *   **Minimap**: Visual overview that works seamlessly across all file types and layout modes (including split view).
    *   **Responsive**: Layout automatically adjusts to viewport changes.

### ⚡ Power User Tools
*   **Typst Support**: First-class support for `.typ` files with auto-compilation and instant SVG preview.
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
