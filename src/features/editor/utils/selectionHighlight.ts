import { Extension, RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

const selectedLineClass = Decoration.line({ attributes: { class: "cm-selected-line" } });

const selectionHighlightPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.decorations = this.getDecorations(view);
    }

    update(update: ViewUpdate) {
        if (update.selectionSet || update.docChanged || update.viewportChanged) {
            this.decorations = this.getDecorations(update.view);
        }
    }

    getDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const { selection, doc } = view.state;

        // Collect all line start positions that are selected
        const selectedLines = new Set<number>();

        for (const range of selection.ranges) {
            const lineStart = doc.lineAt(range.from).number;
            const lineEnd = doc.lineAt(range.to).number;

            for (let i = lineStart; i <= lineEnd; i++) {
                selectedLines.add(i);
            }
        }

        // Convert to sorted array to ensure decorations are added in order
        const sortedLines = Array.from(selectedLines).sort((a, b) => a - b);

        for (const lineNo of sortedLines) {
            const linePos = doc.line(lineNo).from;
            builder.add(linePos, linePos, selectedLineClass);
        }

        return builder.finish();
    }
}, {
    decorations: v => v.decorations
});

/**
 * Fix for Active Line covering Selection.
 * CodeMirror 6 draws the active line background in the content layer (top),
 * and the selection layer behind it.
 * Using mix-blend-mode allows the selection to show through the active line.
 */
const activeLineLayerFix = EditorView.theme({
    ".cm-activeLine": {
        mixBlendMode: "multiply"
    },
    // For dark themes, we might want screen or overlay, but multiply usually works well for light backgrounds
    "&.cm-dark .cm-activeLine": {
        mixBlendMode: "screen"
    }
});

export const selectionHighlightExtension: Extension = [selectionHighlightPlugin, activeLineLayerFix];
