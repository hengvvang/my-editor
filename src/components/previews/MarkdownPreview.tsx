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
    const containerRef = useRef<HTMLDivElement>(null);

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
        <div className={`relative group ${className || ''}`}>
            <PreviewActions targetRef={containerRef} fileName={fileName} />
            <div
                ref={containerRef}
                className={`prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600 p-8 h-full overflow-auto ${className?.includes('prose-invert') ? 'prose-invert bg-transparent' : 'bg-white'}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
};
