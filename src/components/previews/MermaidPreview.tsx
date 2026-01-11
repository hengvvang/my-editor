import React, { useEffect, useState, useRef } from 'react';
import mermaid from "mermaid";
import { PreviewActions } from './PreviewActions';

interface Props {
    content: string;
    className?: string;
    idPrefix: string;
    isDark?: boolean;
}

export const MermaidPreview: React.FC<Props> = ({ content, className, idPrefix, isDark = false }) => {
    const [svg, setSvg] = useState<string>('');
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 3));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));
    const handleReset = () => setScale(1);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            suppressErrorRendering: true,
        });
    }, []);

    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(async () => {
            if (!content.trim()) {
                if (isMounted) setSvg('');
                return;
            }

            try {
                // Prepend theme directive
                const themeDirective = `%%{init: {'theme': '${isDark ? 'dark' : 'default'}'} }%%\n`;
                const finalContent = themeDirective + content;

                // Try to parse first
                await mermaid.parse(finalContent);

                const id = `mermaid-${idPrefix}-${Date.now()}`;
                const { svg } = await mermaid.render(id, finalContent);

                // Post-process SVG to ensure colors are correct for dark mode if needed
                // Sometimes mermaid themes don't apply fully to text
                let processedSvg = svg;
                if (isDark) {
                    // Force styling for text and strokes if the theme didn't catch everything
                    // This is a naive replacement but effective for many diagrams
                    // processedSvg = processedSvg.replace(/fill="#333"/g, 'fill="#eee"').replace(/stroke="#333"/g, 'stroke="#eee"');
                }

                if (isMounted) setSvg(processedSvg);
            } catch (e) {
                console.error("Mermaid Render Error", e);
                // Simplify the error message for the user
                if (isMounted) setSvg(`<div class="text-red-500 p-4 font-mono text-sm bg-red-50 rounded border border-red-200">
                    <p class="font-bold mb-2">Diagram Syntax Error</p>
                    <pre class="whitespace-pre-wrap">${(e as Error).message}</pre>
                </div>`);
            }
        }, 500);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [content, idPrefix, isDark]);

    return (
        <div className={`mermaid-preview-wrapper relative group h-full overflow-hidden ${className || ''}`}>
            <PreviewActions
                targetRef={containerRef}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleReset}
                scale={scale}
            />
            <div
                ref={containerRef}
                className="mermaid-preview-container h-full flex items-center justify-center p-4 overflow-auto origin-center transition-transform duration-200"
                style={{ transform: `scale(${scale})` }}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
};
