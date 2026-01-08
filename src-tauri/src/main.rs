use comrak::{markdown_to_html, ComrakOptions};
use serde::{Deserialize, Serialize};
use std::fs;

// Import the typst compiler module
mod typst_compiler;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[derive(Serialize, Deserialize, Debug, Clone)]
struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[tauri::command]
fn read_dir(path: String) -> Result<Vec<FileEntry>, String> {
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let is_dir = path.is_dir();

        // Skip hidden files
        if name.starts_with('.') {
            continue;
        }

        files.push(FileEntry {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir,
        });
    }
    // Sort directories first, then files
    files.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else {
            b.is_dir.cmp(&a.is_dir)
        }
    });
    Ok(files)
}

#[tauri::command]
fn save_content(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_content(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn render_markdown(text: String) -> String {
    let mut options = ComrakOptions::default();

    // Enable extensions to match or exceed pulldown-cmark
    options.extension.strikethrough = true;
    options.extension.table = true;
    options.extension.tasklist = true;
    options.extension.footnotes = true;
    options.extension.autolink = true;
    options.extension.description_lists = true;
    options.extension.superscript = true;

    // Allow raw HTML (sanitized by frontend DOMPurify)
    options.render.unsafe_ = true;

    markdown_to_html(&text, &options)
}

#[tauri::command]
fn compile_typst(content: String) -> Result<String, String> {
    typst_compiler::compile(content)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            save_content,
            read_content,
            read_dir,
            render_markdown,
            compile_typst
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
