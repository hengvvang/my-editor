# Typoly

A modern, high-performance hybrid editor for **Markdown**, **Typst**, **Mermaid**, and **LaTeX** built with efficiency and aesthetics in mind.

![Editor Screenshot](https://via.placeholder.com/800x450?text=Typoly+Preview)

## 🚀 Key Features

### ✍️ Hybrid Editing Experience
*   **Visual Mode**: A distraction-free, WYSIWYG-like writing environment.
    *   *Now supports*: **Live LaTeX Math** rendering inside the editor (Auto-fold `$code$` to $\LaTeX$ symbol).
*   **Code Mode**: Full-control source editing with syntax highlighting.
*   **Split View**: Resizable side-by-side editor and live preview.
    *   *New*: Ergonomic resize handle that works regardless of window size or layout complexity.

### 🎨 Modern & Flexible UI
*   **Smart Split Groups**: Create multiple editor groups with drag-and-drop resizing. Each group is assigned a unique, cycling color theme (Blue, Teal, Indigo, Violet, etc.) for effortless visual orientation.
*   **Immersive Toolbars**: Editor controls (Lock, Split, Preview) feature a glass-morphism effect, blending seamlessly into the interface until hovered.
*   **Structural Sidebar**: A vertically organized sidebar integrating **Explorer**, **Search**, and **Outline** panels.
    *   **File Management**: Create files, folders, and delete items directly from the explorer toolbar.
*   **Workspace Management**:
    *   **Project Persistence**: Save and switch between different project contexts.
    *   **State Restoration**: Automatically restores your layout, open groups, and active tabs when switching workspaces.
    *   **Recent Workspaces**: Quick access list to your frequently used projects.
*   **Global Search**:
    *   **High Performance**: Powered by Rust's `ripgrep` engine for blazing fast results.
    *   **Advanced Filtering**: Support for Case Sensitive, Whole Word, and Regex queries.
    *   **Smart Ignoring**: Automatically respects `.gitignore` rules to keep results relevant.
*   **Ergonomic Window Controls**: VS Code-style window controls that stay accessible and visible regardless of window size.
*   **Interactive Breadcrumbs**: VS Code-style file path navigation bar with dropdowns for quick browsing and navigating sibling files.
*   **Dynamic Resizing Constraints**: Smart window management that prevents layout breaking by enforcing minimum dimensions based on UI elements.
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

*   [ ] Global Search functionality.
*   [ ] Custom Themes support.
*   [ ] Export to PDF/HTML.
*   [ ] Plugin system.

## 📄 License

MIT License
