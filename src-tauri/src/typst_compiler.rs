use std::path::Path;
use std::time::SystemTime;

use typst::diag::{FileError, FileResult};
use typst::foundations::{Bytes, Datetime, Smart};
use typst::syntax::{FileId, Source, VirtualPath};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, World};

/// A simple implementation of Typst World that can compile a single source string.
/// It uses the system fonts and basic library.
pub struct SimpleWorld {
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
    source: Source,
    /// current time for `datetime.today()`
    now: SystemTime,
}

impl SimpleWorld {
    pub fn new(content: String) -> Self {
        // Load fonts
        let mut fonts = Vec::new();
        // Try to load Arial from system for basic rendering on Windows
        // In a real production app, use `fontdb` to scan system fonts properly.
        let font_path = "C:\\Windows\\Fonts\\arial.ttf";
        if let Ok(data) = std::fs::read(font_path) {
            let buffer = Bytes::from(data);
            for font in Font::iter(buffer) {
                fonts.push(font);
            }
        }

        let book = FontBook::from_fonts(&fonts);

        // Create the standard library
        let library = Library::builder().build();

        Self {
            library: LazyHash::new(library),
            book: LazyHash::new(book),
            fonts,
            source: Source::detached(content),
            now: SystemTime::now(),
        }
    }
}

impl World for SimpleWorld {
    fn library(&self) -> &LazyHash<Library> {
        &self.library
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &self.book
    }

    fn main(&self) -> FileId {
        self.source.id()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.source.id() {
            Ok(self.source.clone())
        } else {
            Err(FileError::NotFound(id.vpath().as_rooted_path().into()))
        }
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        Err(FileError::NotFound(id.vpath().as_rooted_path().into()))
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.get(index).cloned()
    }

    fn today(&self, _offset: Option<i64>) -> Option<Datetime> {
        // Minimal implementation
        Some(Datetime::from_ymd(1970, 1, 1).unwrap())
    }
}

pub fn compile(content: String) -> Result<String, String> {
    let world = SimpleWorld::new(content);

    // Warn: without fonts, Typst might complain or render nothing text-wise.
    // We heavily rely on Typst's default fallback or need to inject a font.
    // For this exact demo to work "out of the box" without extra font files,
    // we might see empty boxes if no fonts are loaded.

    match typst::compile(&world).output {
        Ok(document) => {
            // Render the first page to SVG
            if let Some(page) = document.pages.first() {
                let svg = typst_svg::svg(page);
                Ok(svg)
            } else {
                Ok("<!-- No pages produced -->".to_string())
            }
        }
        Err(diags) => {
            // Convert diagnostics to string
            let msg = diags
                .iter()
                .map(|d| d.message.to_string())
                .collect::<Vec<_>>()
                .join("\n");
            Err(msg)
        }
    }
}
