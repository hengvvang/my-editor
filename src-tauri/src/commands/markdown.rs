use comrak::{markdown_to_html, ComrakOptions};

#[tauri::command]
pub fn render_markdown(text: String) -> String {
    let mut options = ComrakOptions::default();

    // Enable extensions to match or exceed pulldown-cmark
    options.extension.strikethrough = true;
    options.extension.table = true;
    options.extension.tasklist = true;
    options.extension.footnotes = true;
    options.extension.autolink = true;
    options.extension.description_lists = true;
    options.extension.superscript = true;

    // Allow raw HTML (sanitized by frontend DOMPurify)
    options.render.unsafe_ = true;

    markdown_to_html(&text, &options)
}
