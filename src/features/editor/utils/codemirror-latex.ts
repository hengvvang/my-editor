import { Extension, RangeSetBuilder, StateField } from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    EditorView,
    WidgetType,
} from "@codemirror/view";
import katex from "katex";

class MathWidget extends WidgetType {
    constructor(readonly latex: string, readonly displayMode: boolean) {
        super();
    }

    eq(other: MathWidget) {
        return other.latex === this.latex && other.displayMode === this.displayMode;
    }

    toDOM() {
        const span = document.createElement("span");
        if (this.displayMode) {
            span.style.display = "block";
            span.style.textAlign = "center";
            span.className = "cm-math-block";
        } else {
            span.className = "cm-math-inline";
        }
        try {
            katex.render(this.latex, span, {
                displayMode: this.displayMode,
                throwOnError: false,
                output: "html",
            });
        } catch (e) {
            span.innerText = this.latex;
            span.style.color = "red";
        }
        return span;
    }

    ignoreEvent() {
        return false;
    }
}

// Convert from ViewPlugin to StateField to handle line-break replacements correctly
const latexStateField = StateField.define<DecorationSet>({
    create(state) {
        return buildDecorations(state);
    },
    update(decorations, transaction) {
        if (transaction.docChanged || transaction.selection) {
            return buildDecorations(transaction.state);
        }
        return decorations;
    },
    provide: (field) => EditorView.decorations.from(field),
});

function buildDecorations(state: any): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const doc = state.doc;
    const selection = state.selection;
    const fullText = doc.toString();

    // Regex for block ($$...$$) and inline ($...$) math
    const regex = /(\$\$[\s\S]*?\$\$)|(\$(?:\\.|[^$\n])*?\$)/g;

    let match;
    while ((match = regex.exec(fullText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        const isBlock = match[0].startsWith("$$");
        const content = isBlock ? match[0].slice(2, -2) : match[0].slice(1, -1);

        if (!content.trim()) continue;

        // Check cursor intersection
        let isCursorInside = false;
        for (const range of selection.ranges) {
            if (range.from >= start && range.to <= end) {
                isCursorInside = true;
                break;
            }
        }

        if (!isCursorInside) {
            builder.add(
                start,
                end,
                Decoration.replace({
                    widget: new MathWidget(content, isBlock),
                    block: false
                })
            );
        }
    }

    return builder.finish();
}

const baseTheme = EditorView.baseTheme({
    ".cm-math-block": {
        minHeight: "1em",
        cursor: "default"
    },
    ".cm-math-inline": {
        cursor: "default"
    }
});

export function latexLivePreview(): Extension {
    return [latexStateField, baseTheme];
}
