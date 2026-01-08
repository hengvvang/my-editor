# MarkEditor

A modern, high-performance hybrid editor for **Markdown**, **Typst**, **Mermaid**, and **LaTeX** built with efficiency and aesthetics in mind.

![Editor Screenshot](https://via.placeholder.com/800x450?text=MarkEditor+Preview)

## 🚀 Key Features

### ✍️ Hybrid Editing Experience
*   **Visual Mode**: A distraction-free, WYSIWYG-like writing environment.
    *   *Now supports*: **Live LaTeX Math** rendering inside the editor (Auto-fold `$code$` to $\LaTeX$ symbol).
*   **Code Mode**: Full-control source editing with syntax highlighting.
*   **Split View**: Resizable side-by-side editor and live preview.
    *   *New*: Ergonomic resize handle that works regardless of window size or layout complexity.

### 🎨 Modern & Flexible UI
*   **Ergonomic Window Controls**: VS Code-style window controls that stay accessible and visible regardless of window size.
*   **Navigation Breadcrumbs**: VS Code-style file path navigation bar for quick context awareness.
*   **Dynamic Resizing Constraints**: Smart window management that prevents layout breaking by enforcing minimum dimensions based on UI elements.
*   **Resizable Panes**: Customize the width of the Sidebar, Activity Bar, and Split Views to your liking.
*   **Tab System**: Multi-tab support to work on multiple files simultaneously.
*   **Smart Layout**: Minimap, Editor, and Preview panes automatically adjust to viewport changes, ensuring nothing is ever hidden off-screen.

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
*   **Backend**: Rust - Handling file I/O and Typst compilation.

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

*   [ ] Global Search functionality.
*   [ ] Custom Themes support.
*   [ ] Export to PDF/HTML.
*   [ ] Plugin system.

## 📄 License

MIT License
