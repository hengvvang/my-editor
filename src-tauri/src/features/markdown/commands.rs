use comrak::{markdown_to_html, ComrakOptions};

#[tauri::command]
pub fn markdown_render(text: String) -> String {
    let mut options = ComrakOptions::default();

    // Enable extensions to match typical GitHub Flavored Markdown
    options.extension.strikethrough = true;
    options.extension.table = true;
    options.extension.tasklist = true;
    options.extension.footnotes = true;
    options.extension.autolink = true;
    options.extension.description_lists = true;
    options.extension.superscript = true;

    // Allow raw HTML but sanitize later
    options.render.unsafe_ = true;

    // CRITICAL: Enable source position for sync scrolling
    // Adds `data-sourcepos="start_line:start_col-end_line:end_col"` to block elements
    options.render.sourcepos = true;

    let html = markdown_to_html(&text, &options);

    // Sanitize HTML but whitelist the sourcepos attribute
    let mut builder = ammonia::Builder::default();
    builder.add_generic_attributes(&["data-sourcepos"]);

    // Also allow 'class' and 'style' for some styling if needed
    builder.add_generic_attributes(&["class", "style"]);

    builder.clean(&html).to_string()
}
