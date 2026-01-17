use std::path::PathBuf;
use std::sync::OnceLock;
use std::time::SystemTime;

use fontdb::{Database, Source as FontDbSource};
use typst::diag::{FileError, FileResult};
use typst::foundations::{Bytes, Datetime};
use typst::syntax::{FileId, Source};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, World};

// Holder for font data to allow lazy loading
enum FontSlot {
    Embedded(Font),
    #[allow(dead_code)]
    System(PathBuf, u32),
}

struct TypstAssets {
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    slots: Vec<FontSlot>,
    // Cache for loaded fonts to avoid re-reading files
    loaded_fonts: Vec<OnceLock<Option<Font>>>,
}

static ASSETS: OnceLock<TypstAssets> = OnceLock::new();

// Helper to get coverage from fontdb - REMOVED since we are using Eager loading for now
// fn get_coverage(face: &fontdb::FaceInfo) -> typst::text::Coverage { ... }

fn get_assets() -> &'static TypstAssets {
    ASSETS.get_or_init(|| {
        let mut book = FontBook::new();
        let mut slots = Vec::new();

        println!("Initializing Typst assets...");

        // 1. Embedded fonts (typst-assets) - Load these FIRST to ensure defaults exist
        let mut embedded_count = 0;
        for data in typst_assets::fonts() {
            let buffer = Bytes::from_static(data);
            for font in Font::iter(buffer) {
                let info = font.info();
                if info.family.to_lowercase().contains("math") {
                    println!("  Loaded Embedded Math Font: {}", info.family);
                }
                book.push(info.clone());
                slots.push(FontSlot::Embedded(font));
                embedded_count += 1;
            }
        }
        println!("Found {} embedded fonts via typst-assets", embedded_count);

        // 2. Load system fonts using fontdb
        let mut db = Database::new();
        db.load_system_fonts();

        // Important: For Typst to select the math font, it needs to know the font has MATH table.
        // FontInfo.coverage is important.
        // If we lazily load, we must provide accurate info.
        // Since we can't get accurate info from fontdb easily without reading the file,
        // we will READ the font file if the name suggests it might be useful (optimization),
        // or just read all of them.
        // Reading all system fonts headers is fast enough usually.

        let mut system_count = 0;
        for face in db.faces() {
            if let FontDbSource::File(path) = &db.face(face.id).unwrap().source {
                // Try to read the font file just to get the info for Typst
                if let Ok(data) = std::fs::read(path) {
                    let buffer = Bytes::from(data);
                    // Use Font::new to parse the specific face from the file
                    if let Some(font) = Font::new(buffer, face.index) {
                        book.push(font.info().clone());
                        // Cache it as Embedded (using memory) to ensure it works perfect conformant to Typst requirements
                        // This uses more memory but guarantees "current font supports math" works if a system font is selected.
                        // And since we already prioritized Embedded Typst fonts, standard math works.
                        slots.push(FontSlot::Embedded(font));
                        system_count += 1;
                    }
                }
            }
        }

        println!("Found {} system fonts (Eager Load)", system_count);

        let loaded_fonts = (0..slots.len()).map(|_| OnceLock::new()).collect();

        TypstAssets {
            library: LazyHash::new(Library::builder().build()),
            book: LazyHash::new(book),
            slots,
            loaded_fonts,
        }
    })
}

pub struct SimpleWorld {
    source: Source,
    #[allow(dead_code)]
    root: Option<PathBuf>,
    #[allow(dead_code)]
    now: SystemTime,
}

impl SimpleWorld {
    pub fn new(content: String, root_path: Option<String>) -> Self {
        let _ = get_assets(); // Ensure initialized
        let root = root_path.map(PathBuf::from);

        Self {
            source: Source::detached(content),
            root,
            now: SystemTime::now(),
        }
    }
}

impl World for SimpleWorld {
    fn library(&self) -> &LazyHash<Library> {
        &get_assets().library
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &get_assets().book
    }

    fn main(&self) -> FileId {
        self.source.id()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.source.id() {
            Ok(self.source.clone())
        } else {
            Ok(Source::detached(""))
        }
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        Err(FileError::NotFound(id.vpath().as_rootless_path().into()))
    }

    fn font(&self, index: usize) -> Option<Font> {
        let assets = get_assets();
        let slot = assets.slots.get(index)?;

        assets.loaded_fonts[index]
            .get_or_init(|| match slot {
                FontSlot::Embedded(font) => Some(font.clone()),
                FontSlot::System(path, index) => {
                    let data = std::fs::read(path).ok().map(Bytes::from)?;
                    Font::new(data, *index)
                }
            })
            .clone()
    }

    fn today(&self, _offset: Option<i64>) -> Option<Datetime> {
        // Dummy date
        Datetime::from_ymd(2024, 1, 1)
    }
}

pub fn compile(content: String, root_path: Option<String>) -> Result<String, String> {
    // Prepend default font configuration to ensure math support
    let defaults = "#set text(font: \"New Computer Modern\")\n";
    let full_content = format!("{}{}", defaults, content);

    let world = SimpleWorld::new(full_content, root_path);
    let warned = typst::compile(&world);

    match warned.output {
        Ok(document) => {
            // Render all pages and concatenate
            let mut svg_output = String::new();
            for page in &document.pages {
                svg_output.push_str(&typst_svg::svg(page));
                svg_output.push_str("\n");
            }
            Ok(svg_output)
        }
        Err(errors) => {
            let mut error_msg = String::new();
            for error in errors {
                error_msg.push_str(&format!("Error: {:?}\n", error.message));
            }
            Err(error_msg)
        }
    }
}

pub fn export_pdf(
    content: String,
    root_path: Option<String>,
    save_path: String,
) -> Result<(), String> {
    // Prepend default font configuration to ensure math support
    let defaults = "#set text(font: \"New Computer Modern\")\n";
    let full_content = format!("{}{}", defaults, content);

    let world = SimpleWorld::new(full_content, root_path);
    let warned = typst::compile(&world);

    match warned.output {
        Ok(document) => {
            let options = typst_pdf::PdfOptions::default();
            let buffer = typst_pdf::pdf(&document, &options)
                .map_err(|e| format!("PDF generation failed: {:?}", e))?;
            std::fs::write(save_path, buffer).map_err(|e| e.to_string())?;
            Ok(())
        }
        Err(errors) => Err(format!("Compilation failed: {:?}", errors)),
    }
}
