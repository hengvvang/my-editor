use crate::search::{self, FileResult};

#[tauri::command]
pub async fn search_in_files(
    path: String,
    query: String,
    case_sensitive: bool,
    whole_word: bool,
    is_regex: bool,
) -> Result<Vec<FileResult>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        search::search(&path, &query, case_sensitive, whole_word, is_regex)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
