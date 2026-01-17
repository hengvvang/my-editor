use std::fs;
use super::models::FileEntry;

#[tauri::command]
pub fn fs_read_dir(path: String) -> Result<Vec<FileEntry>, String> {
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
pub fn fs_write_file(path: String, content: String) -> Result<(), String> {
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_read_file(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_delete(path: String) -> Result<(), String> {
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    if metadata.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn fs_rename(path: String, new_path: String) -> Result<(), String> {
    fs::rename(path, new_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_copy(path: String, new_path: String) -> Result<(), String> {
    // Simple file copy for now. For directories, it's more complex.
    fs::copy(path, new_path)
        .map(|_| ())
        .map_err(|e| e.to_string())
}
