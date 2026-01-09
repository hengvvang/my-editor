// Import modules
mod commands;
mod search;
mod typst_compiler;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::io::save_content,
            commands::io::read_content,
            commands::io::read_dir,
            commands::io::create_directory,
            commands::io::delete_item,
            commands::io::rename_item,
            commands::io::copy_item,
            commands::markdown::render_markdown,
            commands::typst::compile_typst,
            commands::search::search_in_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
