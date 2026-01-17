import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";
import { PreviewActions } from './PreviewActions';

interface Props {
    content: string;
    className?: string;
    onRef?: (el: HTMLDivElement | null) => void;
    isSyncScroll?: boolean;
    onToggleSyncScroll?: () => void;
    onExportPdf?: () => void;
    showActions?: boolean;
    scale?: number;
}

export const LatexPreview: React.FC<Props> = ({ content, className, onRef, isSyncScroll, onToggleSyncScroll, onExportPdf, showActions = true, scale: externalScale }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [internalScale, setInternalScale] = useState(1);

    const scale = externalScale !== undefined ? externalScale : internalScale;
    const setScale = setInternalScale;

    // Expose ref
    useEffect(() => {
        if (onRef) {
            onRef(containerRef.current);
        }
    }, [onRef]);

    const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 3));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));
    const handleReset = () => setScale(1);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (containerRef.current) {
                containerRef.current.textContent = content;
                try {
                    renderMathInElement(containerRef.current, {
                        delimiters: [
                            { left: "$$", right: "$$", display: true },
                            { left: "$", right: "$", display: false },
                            { left: "\\(", right: "\\)", display: false },
                            { left: "\\[", right: "\\]", display: true }
                        ],
                        throwOnError: false
                    });
                } catch (e) {
                    console.error("KaTeX rendering error:", e);
                }
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [content]);

    return (
        <div className={`latex-preview-wrapper relative group h-full overflow-hidden ${className || ''}`}>
            {showActions && (
                <PreviewActions
                    targetRef={containerRef}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onResetZoom={handleReset}
                    scale={scale}
                    isSyncScroll={isSyncScroll}
                    onToggleSyncScroll={onToggleSyncScroll}
                    onExportPdf={onExportPdf}
                />
            )}
            <div
                ref={containerRef}
                className={`latex-preview-container h-full p-8 overflow-auto prose max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed ${className?.includes('bg-[#282a36]') ? 'bg-[#282a36] text-gray-300' : 'bg-white'}`}
                style={{
                    color: className?.includes('text-gray-300') ? '#e2e8f0' : undefined,
                    zoom: scale
                }}
            />
        </div>
    );
};
