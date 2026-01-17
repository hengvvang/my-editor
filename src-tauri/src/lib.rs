pub mod features;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            features::filesystem::commands::fs_read_dir,
            features::filesystem::commands::fs_write_file,
            features::filesystem::commands::fs_read_file,
            features::filesystem::commands::fs_create_dir,
            features::filesystem::commands::fs_delete,
            features::filesystem::commands::fs_rename,
            features::filesystem::commands::fs_copy,
            features::markdown::commands::markdown_render,
            features::typst::commands::typst_compile,
            features::typst::commands::typst_export_pdf,
            features::search::commands::search_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
