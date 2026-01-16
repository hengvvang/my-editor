import { cpp } from "@codemirror/lang-cpp";
import { css } from "@codemirror/lang-css";
import { go } from "@codemirror/lang-go";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sass } from "@codemirror/lang-sass";
import { sql } from "@codemirror/lang-sql";
import { vue } from "@codemirror/lang-vue";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { Extension } from "@codemirror/state";

import { markdownExtensions } from "../config/editor";

// 1. Define supported language mappings
// Only using Modern Lezer parsers for maximum performance
const languageRegistry: Record<string, () => Extension> = {
  // --- Modern Lezer Parsers Only ---
  js: () => javascript(),
  jsx: () => javascript({ jsx: true }),
  ts: () => javascript({ typescript: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  py: () => python(),
  rs: () => rust(),
  json: () => json(),
  c: () => cpp(),
  cpp: () => cpp(),
  h: () => cpp(),
  hpp: () => cpp(),
  html: () => html(),
  css: () => css(),
  java: () => java(),
  go: () => go(),
  sql: () => sql(),
  yml: () => yaml(),
  yaml: () => yaml(),
  xml: () => xml(),
  svg: () => xml(),
  php: () => php(),
  sass: () => sass(),
  scss: () => sass(),
  vue: () => vue(),
};

// 2. Display Name Mapping (Best Practice for Ergonomics)
// Maps extension to human-readable format
const displayNames: Record<string, string> = {
    js: "JavaScript",
    jsx: "React (JSX)",
    ts: "TypeScript",
    tsx: "React (TSX)",
    py: "Python",
    rs: "Rust",
    json: "JSON",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    sass: "Sass",
    c: "C",
    cpp: "C++",
    h: "C Header",
    hpp: "C++ Header",
    java: "Java",
    go: "Go",
    sql: "SQL",
    sh: "Shell Script",
    bash: "Bash",
    zsh: "Zsh",
    toml: "TOML",
    yaml: "YAML",
    yml: "YAML",
    xml: "XML",
    svg: "SVG",
    php: "PHP",
    vue: "Vue",
    lua: "Lua",
    swift: "Swift",
    kt: "Kotlin",
    kts: "Kotlin Script",
    dockerfile: "Dockerfile"
};

export interface LanguageInfo {
    extension: Extension[];
    name: string;
    isGeneric: boolean;
}

export function getLanguageInfo(filename: string | null): LanguageInfo {
  if (!filename) return { extension: [], name: "Text", isGeneric: true };

  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // Specialized formats
  if (ext === 'md' || ext === 'markdown') {
      return { extension: [markdown({ extensions: [markdownExtensions] })], name: "Markdown", isGeneric: false };
  }
  if (ext === 'typ') {
       return { extension: [], name: "Typst", isGeneric: false };
  }
  if (ext === 'tex' || ext === 'latex') {
      return { extension: [], name: "LaTeX", isGeneric: false };
  }
  if (ext === 'mmd' || ext === 'mermaid') {
      return { extension: [], name: "Mermaid", isGeneric: false };
  }

  // Determine Display Name
  const displayName = displayNames[ext] || ext.toUpperCase();

  // Lookup registry for Highlighting
  if (languageRegistry[ext]) {
    return {
        extension: [languageRegistry[ext]()],
        name: displayName,
        isGeneric: true
    };
  }

  // Fallback (Highlighting missing, but correct name displayed)
  if (ext.length > 0 && ext.length < 10) {
      return { extension: [], name: displayName, isGeneric: true };
  }

  return { extension: [], name: "Text", isGeneric: true };
}

export function getLanguageExtension(filename: string | null): Extension[] {
    return getLanguageInfo(filename).extension;
}
