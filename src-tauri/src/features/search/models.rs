use serde::Serialize;

#[derive(Serialize, Debug, Clone)]
pub struct SearchMatch {
    pub line_number: u64,
    pub line_text: String,
}

#[derive(Serialize, Debug, Clone)]
pub struct FileResult {
    pub path: String,
    pub matches: Vec<SearchMatch>,
}
