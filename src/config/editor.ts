import { HighlightStyle } from "@codemirror/language";
import { tags as t, Tag } from "@lezer/highlight";

// --- Custom Tags ---
export const customTags = {
    listMark: Tag.define(),
    quoteMark: Tag.define(),
    codeBlockText: Tag.define(),
    codeBlockInfo: Tag.define(),
    taskMarker: Tag.define()
};

// --- Hybrid Preview Theme ---
export const hybridHighlightStyle = HighlightStyle.define([
    // Headings
    { tag: t.heading1, class: 'cm-md-h1' },
    { tag: t.heading2, class: 'cm-md-h2' },
    { tag: t.heading3, class: 'cm-md-h3' },
    { tag: t.heading4, class: 'cm-md-h4' },
    { tag: t.heading5, class: 'cm-md-h5' },
    { tag: t.heading6, class: 'cm-md-h6' },

    // Inline formatting
    { tag: t.strong, class: 'cm-md-bold' },
    { tag: t.emphasis, class: 'cm-md-italic' },
    { tag: t.link, class: 'cm-md-link' },
    { tag: t.url, class: 'cm-md-url' },

    // Code
    { tag: t.monospace, class: 'cm-md-code' },
    { tag: customTags.codeBlockText, class: 'cm-md-block-code' },
    { tag: customTags.codeBlockInfo, class: 'cm-md-block-info' },
    { tag: customTags.taskMarker, class: 'cm-md-task' },

    // Markdown Syntax Markers (The #, *, -, etc.)
    { tag: t.processingInstruction, class: 'cm-md-mark' },

    // Specific Overrides for structural markers we might want to keep visible or style differently
    { tag: customTags.listMark, class: 'cm-md-list' }, // List bullets -, *, 1.
    { tag: customTags.quoteMark, class: 'cm-md-quote' }, // Blockquote >
    { tag: t.meta, class: 'cm-md-meta' }, // Misc meta info
    { tag: t.separator, class: 'cm-md-table-border' }, // Table |
    { tag: t.contentSeparator, class: 'cm-md-hr' }, // Horizontal Rule ---
    { tag: t.strikethrough, class: 'cm-md-strike' }, // ~~Strike~~

    // HTML Support
    { tag: t.tagName, class: 'cm-md-html-tag' },
    { tag: t.comment, class: 'cm-md-html-comment' },
]);

// --- Extended Markdown Configuration ---
import { styleTags } from "@lezer/highlight";

export const markdownExtensions = {
    props: [
        styleTags({
            "TableDelimiter": t.separator,
            "HorizontalRule": t.contentSeparator,
            "Strikethrough": t.strikethrough,
            "StrikethroughMark": t.processingInstruction,
            "CodeMark": t.processingInstruction,

            // Differentiate Inline Code vs Block Code
            "InlineCode": t.monospace,
            "CodeText": customTags.codeBlockText,
            "CodeInfo": customTags.codeBlockInfo,

            // Task Lists
            "TaskMarker": customTags.taskMarker,

            // Specific override for Ordered List markers to avoid the .cm-md-list styling
            // This MUST come before "ListMark" if the engine processes specifically
            // (However, for safety, we used a different tag t.labelName above, so order is less critical, but let's be safe)
            "OrderedList/ListMark": t.labelName,

            // Broadly match all (other) ListMarks
            "ListMark": customTags.listMark,

            "QuoteMark": customTags.quoteMark,

            // Block markers
            "HeaderMark": t.processingInstruction,
            "EmphasisMark": t.processingInstruction,
            "LinkMark": t.processingInstruction,

            // HTML Tags (Map to known tags, or custom ones)
            "HTMLTag": t.tagName,
            "Comment": t.comment,
        })
    ]
};
