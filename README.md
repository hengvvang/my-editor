# My Editor (Tauri + React + Milkdown)

This is a starter template for a Typora-like markdown editor using:
- **Core**: Tauri (Rust)
- **Frontend**: React 18
- **Build**: Vite
- **Editor**: Milkdown (WYSIWYG Markdown)
- **Styling**: TailwindCSS

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run in development mode**:
    ```bash
    npm run tauri dev
    ```
    *Note: The first run will take a while as it compiles the Rust backend.*

## Project Structure

- `src/`: Frontend React code.
    - `App.tsx`: The main editor component using Milkdown.
    - `styles.css`: Tailwind and Editor styles.
- `src-tauri/`: Rust backend code.
    - `tauri.conf.json`: Native window configuration.
    - `Cargo.toml`: Rust dependencies.

## Next Steps

- Implement file saving/loading in Rust (`src-tauri/src/main.rs`).
- Add a custom title bar or menu.
- Customize the editor theme.
