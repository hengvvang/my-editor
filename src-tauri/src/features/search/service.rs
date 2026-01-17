use super::models::{FileResult, SearchMatch};
use anyhow::Result;
use grep_regex::RegexMatcherBuilder;
use grep_searcher::{sinks::UTF8, Searcher};
use ignore::{WalkBuilder, WalkState};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc;
use std::sync::Arc;

// Max number of files to return to prevent UI freezing
const MAX_FILE_RESULTS: usize = 2000;
// Max matches per file to prevent huge payloads
const MAX_MATCHES_PER_FILE: usize = 100;

pub fn search(
    root_path: &str,
    query: &str,
    case_sensitive: bool,
    whole_word: bool,
    is_regex: bool,
) -> Result<Vec<FileResult>> {
    let (tx, rx) = mpsc::channel();
    let file_count = Arc::new(AtomicUsize::new(0));

    // 1. Build Matcher
    let mut builder = RegexMatcherBuilder::new();
    builder.case_insensitive(!case_sensitive);
    builder.word(whole_word);

    let matcher = if is_regex {
        builder.build(query)?
    } else {
        builder.build_literals(&[query])?
    };

    // 2. Parallel Walk
    let walker = WalkBuilder::new(root_path)
        .hidden(true)
        .git_ignore(true)
        .threads(num_cpus::get())
        .build_parallel();

    walker.run(|| {
        let tx = tx.clone();
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

                // Double check limit before sending
                if file_count.fetch_add(1, Ordering::Relaxed) >= MAX_FILE_RESULTS {
                    return WalkState::Quit;
                }

                let _ = tx.send(FileResult {
                    path,
                    matches: matches_in_file,
                });
            }

            WalkState::Continue
        })
    });

    drop(tx);

    let mut final_results: Vec<FileResult> = rx.iter().collect();

    // Sort to keep UI consistent
    final_results.sort_by(|a, b| a.path.cmp(&b.path));

    Ok(final_results)
}
