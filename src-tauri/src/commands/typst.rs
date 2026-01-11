use crate::typst_compiler;

#[tauri::command]
pub fn compile_typst(content: String, file_path: Option<String>) -> Result<String, String> {
    typst_compiler::compile(content, file_path)
}
