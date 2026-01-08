use anyhow::Result;
use grep_regex::RegexMatcherBuilder;
use grep_searcher::{sinks::UTF8, Searcher};
use ignore::WalkBuilder;
use serde::Serialize;
use std::sync::{Arc, Mutex};

#[derive(Serialize, Debug, Clone)]
pub struct SearchMatch {
    pub line_number: u64,
    pub line_text: String,
    // We simplify and just return the line text for now.
    // Highlighting logic relies on the line text and query on frontend usually,
    // but for regex we might want indices.
    // Let's stick to line text + line number for MVP efficiency.
}

#[derive(Serialize, Debug, Clone)]
pub struct FileResult {
    pub path: String,
    pub matches: Vec<SearchMatch>,
}

pub fn search(
    root_path: &str,
    query: &str,
    case_sensitive: bool,
    whole_word: bool,
    is_regex: bool,
) -> Result<Vec<FileResult>> {
    let results = Arc::new(Mutex::new(Vec::new()));
    let results_clone = results.clone();

    // 1. Build Matcher
    let mut builder = RegexMatcherBuilder::new();
    builder.case_insensitive(!case_sensitive);
    builder.word(whole_word);

    let matcher = if is_regex {
        builder.build(query)?
    } else {
        // For literal search, we leverage regex escaping
        builder.build_literals(&[query])?
    };

    // 2. Build Walker (Iterator over files)
    let walker = WalkBuilder::new(root_path)
        .hidden(true) // Ignore hidden
        .git_ignore(true) // Respect .gitignore
        .build();

    // 3. Parallel Search (optional, ignore crate supports it, but simple loop is safer for initial impl inside Tauri async cmd)
    // Actually WalkBuilder supports parallel execution via build_parallel(), but let's stick to synchronous iter for now
    // inside the thread pool `tauri::command` provides.
    // Optimization: Depending on codebase size, parallel might be needed.
    // Let's use simple iteration first to avoid 'static lifetime issues with closures in parallel builder.

    for result in walker {
        match result {
            Ok(entry) => {
                if !entry.file_type().map_or(false, |ft| ft.is_file()) {
                    continue;
                }

                let path = entry.path().to_string_lossy().to_string();
                let mut matches_in_file = Vec::new();

                let _ = Searcher::new().search_path(
                    &matcher,
                    entry.path(),
                    UTF8(|line_num, line_text| {
                        // Limit line length to prevent UI freezing on minified files
                        if line_text.len() < 500 {
                            matches_in_file.push(SearchMatch {
                                line_number: line_num,
                                line_text: line_text.to_string(),
                            });
                        }
                        Ok(true) // Continue searching
                    }),
                );

                if !matches_in_file.is_empty() {
                    results_clone.lock().unwrap().push(FileResult {
                        path,
                        matches: matches_in_file,
                    });
                }
            }
            Err(err) => eprintln!("Error walking: {}", err),
        }
    }

    let final_results = results.lock().unwrap().to_vec();
    Ok(final_results)
}
