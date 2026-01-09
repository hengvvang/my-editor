use anyhow::Result;
use grep_regex::RegexMatcherBuilder;
use grep_searcher::{sinks::UTF8, Searcher};
use ignore::{WalkBuilder, WalkState};
use serde::Serialize;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};

// Max number of files to return to prevent UI freezing
const MAX_FILE_RESULTS: usize = 2000;
// Max matches per file to prevent huge payloads
const MAX_MATCHES_PER_FILE: usize = 100;

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
    let file_count = Arc::new(AtomicUsize::new(0));

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

    // 2. Parallel Walk
    let walker = WalkBuilder::new(root_path)
        .hidden(true)
        .git_ignore(true)
        .threads(num_cpus::get())
        .build_parallel();

    walker.run(|| {
        let results = results.clone();
        let matcher = matcher.clone();
        let file_count = file_count.clone();

        Box::new(move |result| {
            // Check global limit first
            if file_count.load(Ordering::Relaxed) >= MAX_FILE_RESULTS {
                return WalkState::Quit;
            }

            let entry = match result {
                Ok(entry) => entry,
                Err(_) => return WalkState::Continue,
            };

            if !entry.file_type().map_or(false, |ft| ft.is_file()) {
                return WalkState::Continue;
            }

            let mut matches_in_file = Vec::new();

            let _ = Searcher::new().search_path(
                &matcher,
                entry.path(),
                UTF8(|line_num, line_text| {
                    if matches_in_file.len() >= MAX_MATCHES_PER_FILE {
                        return Ok(false); // Stop searching this file
                    }
                    if line_text.len() < 1000 {
                        matches_in_file.push(SearchMatch {
                            line_number: line_num,
                            line_text: line_text.to_string(),
                        });
                    }
                    Ok(true)
                }),
            );

            if !matches_in_file.is_empty() {
                let path = entry.path().to_string_lossy().to_string();

                // Double check limit before locking
                if file_count.load(Ordering::Relaxed) >= MAX_FILE_RESULTS {
                    return WalkState::Quit;
                }

                if let Ok(mut lock) = results.lock() {
                    if lock.len() >= MAX_FILE_RESULTS {
                        return WalkState::Quit;
                    }
                    lock.push(FileResult {
                        path,
                        matches: matches_in_file,
                    });
                    file_count.fetch_add(1, Ordering::Relaxed);
                }
            }

            WalkState::Continue
        })
    });

    let final_results = match Arc::try_unwrap(results) {
        Ok(mutex) => mutex.into_inner().unwrap_or_default(),
        Err(arc) => arc.lock().unwrap().clone(),
    };
    Ok(final_results)
}
