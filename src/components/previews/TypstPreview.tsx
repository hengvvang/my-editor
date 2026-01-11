import React, { useEffect, useState, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { PreviewActions } from './PreviewActions';

interface Props {
    content: string;
    className?: string;
    isDark?: boolean;
    filePath?: string | null;
    onRef?: (el: HTMLDivElement | null) => void;
    isSyncScroll?: boolean;
    onToggleSyncScroll?: () => void;
}

export const TypstPreview: React.FC<Props> = ({ content, className, isDark, filePath, onRef, isSyncScroll, onToggleSyncScroll }) => {
    const [svg, setSvg] = useState<string>('');
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

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
        const timer = setTimeout(async () => {
            try {
                const result = await invoke<string>('compile_typst', { content, filePath });
                setSvg(result);
            } catch (e) {
                console.error("Typst compilation failed:", e);
                setSvg(`<div class="text-red-500 p-4 font-mono text-sm bg-red-50 rounded border border-red-200 overflow-auto h-full">
                    <p class="font-bold mb-2">Typst Compilation Error</p>
                    <pre class="whitespace-pre-wrap">${e}</pre>
                </div>`);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [content, filePath]);

    return (
        <div className={`typst-preview-wrapper group relative w-full h-full flex flex-col items-center ${className || ''}`}
            ref={containerRef}
            style={{
                color: className?.includes('text-gray-300') ? '#e2e8f0' : 'inherit',
                fill: className?.includes('text-gray-300') ? '#e2e8f0' : 'inherit',
                filter: isDark ? 'invert(1) hue-rotate(180deg)' : 'none'
            }}>
            <PreviewActions
                targetRef={containerRef}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleReset}
                scale={scale}
                isSyncScroll={isSyncScroll}
                onToggleSyncScroll={onToggleSyncScroll}
            />
            <style>
                {`
                .typst-content-host svg {
                    width: 100% !important;
                    height: auto !important;
                }
                `}
            </style>
            <div
                className="typst-content-host w-full transition-transform duration-200 origin-top"
                style={{ transform: `scale(${scale})` }}
            />
        </div>
    );
};
