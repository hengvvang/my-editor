import React, { useEffect, useRef, useState } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { PreviewActions } from './PreviewActions';

interface Props {
    content: string;
    className?: string;
    fileName?: string;
}

export const MarkdownPreview: React.FC<Props> = ({ content, className, fileName }) => {
    const [html, setHtml] = useState<string>('');
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 3));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));
    const handleReset = () => setScale(1);

    useEffect(() => {
        // Dynamic debounce based on content length to prevent freezing on large files
        const length = content.length;
        const delay = length > 100000 ? 800 : (length > 20000 ? 300 : 100);

        const timer = setTimeout(() => {
            invoke('render_markdown', { text: content }).then((res) => {
                // Backend sanitization via ammonia is used now, no need for DOMPurify here
                setHtml(res as string);
            });
        }, delay);
        return () => clearTimeout(timer);
    }, [content]);

    return (
        <div className={`relative group h-full overflow-hidden ${className || ''}`}>
            <PreviewActions
                targetRef={containerRef}
                fileName={fileName}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleReset}
                scale={scale}
            />
            <div
                ref={containerRef}
                className={`prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600 p-8 h-full overflow-auto transition-all duration-200 origin-top-left ${className?.includes('prose-invert') ? 'prose-invert bg-transparent' : 'bg-white'}`}
                style={{
                    zoom: scale // Use CSS zoom for text reflow if supported (Chrome/Edge), or transform
                    // Note: 'zoom' is non-standard but works well for reflow.
                    // 'transform: scale()' might scale the scrollbar or container.
                    // For better reading experience, 'zoom' or font-size scaling is preferred for Markdown.
                    // Let's stick with transform for consistency or zoom if we want reflow.
                    // Let's try transform first as it's standard.
                    // transform: `scale(${scale})`,
                    // transformOrigin: 'top left',
                    // width: `${100/scale}%` // Compensate width
                }}
            // Actually zoom works best for document-like text reflow
            >
                <div style={{ zoom: scale }}>
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            </div>
        </div>
    );
};
