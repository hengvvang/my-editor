export interface Hint {
    id: string; // The generated label characters, e.g., "AA", "AB"
    element: HTMLElement;
    rect: DOMRect;
}

// Optimized key set for ergonomics (left hand + right hand home row priority)
const HINT_CHARS = "asdfghjklqwertyuiopzxcvbnm";

/**
 * Generates a unique label for a given index using the HINT_CHARS base.
 * Uses a bijective base-N conversion.
 */
export function generateLabel(index: number): string {
    let label = "";
    let i = index;
    const base = HINT_CHARS.length;

    if (i === 0) return HINT_CHARS[0];

    // standard bijective base-n
    while (i >= 0) {
        label = HINT_CHARS[i % base] + label;
        i = Math.floor(i / base) - 1;
    }

    return label;
}

/**
 * Scans the document for interactive elements and returns visible ones with hint metadata.
 * Implements ergonomic heuristics to reduce "hint noise" (e.g., charts, grids, decorative blocks).
 */
export function scanClickableElements(): Hint[] {
    const selector = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled]):not([type='hidden'])",
        "textarea:not([disabled])",
        "select:not([disabled])",
        "summary",
        "[role='button']",
        "[role='link']",
        "[role='checkbox']",
        "[role='menuitem']",
        "[role='tab']",
        "[role='option']",
        "[contenteditable='true']",
        "[tabindex]:not([tabindex='-1'])",
        ".vim-clickable",
        // Explicitly include elements with click listeners if marked (standard practice in some apps)
        "[onclick]",
        "[ng-click]",
        "[items-on-click]"
    ].join(",");

    // Optimized: Only get elements that likely matter
    const root = document.body || document.documentElement;
    const allElements = Array.from(root.querySelectorAll("*"));

    const candidates: Map<Element, Hint> = new Map();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Helper to check visibility
    const isVisible = (rect: DOMRect, style: CSSStyleDeclaration) => {
        return (
            rect.width > 3 &&
            rect.height > 3 &&
            rect.bottom >= 0 &&
            rect.right >= 0 &&
            rect.top <= viewportHeight &&
            rect.left <= viewportWidth &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        );
    };

    // Filter Loop
    for (const el of allElements) {
        if (!el.isConnected) continue;

        // Skip aria-hidden
        if (el.getAttribute("aria-hidden") === "true") continue;

        const element = el as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        // 1. Semantic Match?
        const isSemantic = element.matches(selector);

        // 2. Cursor Match?
        let isCursorClickable = false;
        const style = window.getComputedStyle(element);

        if (!isSemantic) {
            // Strict Cursor Check
            if (style.cursor === 'pointer') {
                isCursorClickable = true;

                // HEURISTIC: SVG Noise Reduction
                // Exclude geometric primitives in SVGs unless they are explicitly semantic (handled above)
                // This fixes "GitHub Contribution Graph" spam.
                if (['rect', 'path', 'circle', 'ellipse', 'line', 'polygon', 'g'].includes(tagName)) {
                    isCursorClickable = false;
                }

                // HEURISTIC: Inherited Pointer Check
                // If parent also points, and we are just a generic container/text, assume inheritance.
                // We typically want the OUTERMOST clickable container for cursor-pointer-divs,
                // OR the innermost semantic button.
                if (element.parentElement) {
                    const parentStyle = window.getComputedStyle(element.parentElement);
                    if (parentStyle.cursor === 'pointer') {
                        // This element is likely just inheriting the cursor. Ignore it to prevent double hints.
                        // Exception: If this element overrides with a specific event? We can't know easily.
                        // Safe bet: Ignore.
                        isCursorClickable = false;
                    }
                }
            }
        }

        if (!isSemantic && !isCursorClickable) continue;

        const rect = element.getBoundingClientRect();
        if (!isVisible(rect, style)) continue;

        // Add to candidates
        candidates.set(element, {
            id: '',
            element: element,
            rect: rect
        });
    }

    // Post-Processing: Deduplication & Cleanup
    const finalHints: Hint[] = [];

    candidates.forEach((hint, element) => {
        // Spatial Containment Cleanup
        // If this element contains another candidate, we need to decide which to keep.
        // Rule:
        // - If semantic child exists inside semantic parent? (e.g. <a><span>Link</span></a>)
        //   Usually keep the Parent (A).
        // - If semantic child inside non-semantic parent? (e.g. <div pointer><button></div>)
        //   Keep child.

        // Simpler Ergonomcs:
        // Use `candidates.has(element.parentElement)` to check hierarchy.

        const parent = element.parentElement;
        if (parent && candidates.has(parent)) {
            // Parent is also a candidate.

            // Case 1: Parent is semantic (e.g. <A>), Current is semantic logic (e.g. <SPAN tabindex=0> or just noise?)
            // If parent is <a> or <button>, we almost ALWAYS want the parent, not the child parts.
            const parentEl = parent as HTMLElement;
            if (parentEl.matches("a, button, [role='button'], [role='link']")) {
                // Ignore this child, Parent handles it.
                return;
            }

            // Case 2: Parent is generic <div pointer>, Current is <button>.
            // We want the Button.
            // But we already added the Parent to candidates map?
            // This is tricky in a single Loop.

            // Alternative:
            // Just output all valid unique leaf-ish nodes?
        }

        finalHints.push(hint);
    });

    // Sort by position (Row-major order)
    finalHints.sort((a, b) => {
        // Quantize Y to create rows (approx 10px buffer)
        // This makes navigation much more predictable reading left-to-right, top-to-bottom.
        const floorA = Math.floor(a.rect.top / 10) * 10;
        const floorB = Math.floor(b.rect.top / 10) * 10;

        if (floorA === floorB) {
            return a.rect.left - b.rect.left;
        }
        return floorA - floorB;
    });

    // Assign optimized labels
    finalHints.forEach((hint, index) => {
        hint.id = generateLabel(index);
    });

    return finalHints;
}
