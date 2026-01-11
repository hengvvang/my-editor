use crate::typst_compiler;

#[tauri::command]
pub fn compile_typst(content: String, file_path: Option<String>) -> Result<String, String> {
    typst_compiler::compile(content, file_path)
}

#[tauri::command]
pub fn export_typst_pdf(
    content: String,
    file_path: Option<String>,
    save_path: String,
) -> Result<(), String> {
    typst_compiler::export_pdf(content, file_path, save_path)
}
