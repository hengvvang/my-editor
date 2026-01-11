use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use std::time::SystemTime;

use typst::diag::{FileError, FileResult};
use typst::foundations::{Bytes, Datetime};
use typst::syntax::{FileId, Source};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, World};

struct TypstAssets {
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
}

static ASSETS: OnceLock<TypstAssets> = OnceLock::new();

fn get_assets() -> &'static TypstAssets {
    ASSETS.get_or_init(|| {
        let mut fonts = Vec::new();
        // Try to load system fonts for better compatibility
        // We prioritize Cambria for Math support
        let font_paths = [
            "C:\\Windows\\Fonts\\arial.ttf",
            "C:\\Windows\\Fonts\\calibri.ttf",
            "C:\\Windows\\Fonts\\cambria.ttc", // Essential for Math support (Cambria Math)
            "C:\\Windows\\Fonts\\times.ttf",
            "C:\\Windows\\Fonts\\seguisym.ttf", // Segoe UI Symbol
        ];

        for font_path in font_paths {
            if let Ok(data) = std::fs::read(font_path) {
                let buffer = Bytes::from(data);
                for font in Font::iter(buffer) {
                    fonts.push(font);
                }
            }
        }

        // Also try to find a math font if the above didn't yield one?
        // Typst needs an OpenType Math font. Cambria Math inside cambria.ttc usually works.

        let book = FontBook::from_fonts(&fonts);

        // Create the standard library
        let library = Library::builder().build();

        TypstAssets {
            library: LazyHash::new(library),
            book: LazyHash::new(book),
            fonts,
        }
    })
}

/// A simple implementation of Typst World that can compile a single source string.
/// It uses the system fonts and basic library.
pub struct SimpleWorld {
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
    source: Source,
    root: Option<PathBuf>,
    /// current time for `datetime.today()` (kept for future use)
    #[allow(dead_code)]
    now: SystemTime,
}

impl SimpleWorld {
    pub fn new(content: String, root_path: Option<String>) -> Self {
        let assets = get_assets();
        let root = root_path.map(PathBuf::from);

        Self {
            library: assets.library.clone(),
            book: assets.book.clone(),
            fonts: assets.fonts.clone(),
            source: Source::detached(content),
            root,
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
        if let Some(root) = &self.root {
            // Typst uses a virtual path abstraction. We convert it to a local path component.
            // .as_rooted_path() returns a path starting with /, e.g., "/img1.png".
            // We strip the prefix to append it to our root.
            let p = id.vpath().as_rooted_path();
            let rel_path = p.strip_prefix("/").unwrap_or(p);

            // If we have a file path, we assume the root is the directory containing the file.
            // If root is a file, we take its parent.
            let dir = if root.is_file() {
                root.parent().unwrap_or(Path::new("."))
            } else {
                root.as_path()
            };

            let full_path = dir.join(rel_path);

            std::fs::read(&full_path)
                .map(Bytes::from)
                .map_err(|e| FileError::from_io(e, &full_path))
        } else {
            Err(FileError::NotFound(id.vpath().as_rooted_path().into()))
        }
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.get(index).cloned()
    }

    fn today(&self, _offset: Option<i64>) -> Option<Datetime> {
        // Minimal implementation
        Some(Datetime::from_ymd(1970, 1, 1).unwrap())
    }
}

pub fn compile(content: String, file_path: Option<String>) -> Result<String, String> {
    // Inject default font configuration for Windows to ensure Math support (Cambria)
    // We explicitly set the math font to "Cambria Math" which is contained in cambria.ttc
    let content_with_font = format!(
        "#set text(font: (\"Cambria\", \"Arial\"))\n#show math.equation: set text(font: \"Cambria Math\")\n{}",
        content
    );

    let world = SimpleWorld::new(content_with_font, file_path);

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

pub fn export_pdf(
    content: String,
    file_path: Option<String>,
    save_path: String,
) -> Result<(), String> {
    // Same font injection as compile
    let content_with_font = format!(
        "#set text(font: (\"Cambria\", \"Arial\"))\n#show math.equation: set text(font: \"Cambria Math\")\n{}",
        content
    );

    let world = SimpleWorld::new(content_with_font, file_path);

    let document = match typst::compile(&world).output {
        Ok(doc) => doc,
        Err(diags) => {
            let msg = diags
                .iter()
                .map(|d| d.message.to_string())
                .collect::<Vec<_>>()
                .join("\n");
            return Err(msg);
        }
    };

    let pdf_options = typst_pdf::PdfOptions::default();
    let buffer = typst_pdf::pdf(&document, &pdf_options).map_err(|diags| {
        diags
            .iter()
            .map(|d| d.message.to_string())
            .collect::<Vec<_>>()
            .join("\n")
    })?;

    std::fs::write(save_path, buffer).map_err(|e| e.to_string())?;
    Ok(())
}
