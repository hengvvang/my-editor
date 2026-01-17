use super::compiler;

#[tauri::command]
pub fn typst_compile(content: String, file_path: Option<String>) -> Result<String, String> {
    compiler::compile(content, file_path)
}

#[tauri::command]
pub fn typst_export_pdf(
    content: String,
    file_path: Option<String>,
    save_path: String,
) -> Result<(), String> {
    compiler::export_pdf(content, file_path, save_path)
}
