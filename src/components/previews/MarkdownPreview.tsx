import React, { useEffect, useRef, useState } from 'react';
import { invoke } from "@tauri-apps/api/core";
import DOMPurify from "dompurify";
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
        const timer = setTimeout(() => {
            invoke('render_markdown', { text: content }).then((res) => {
                setHtml(DOMPurify.sanitize(res as string));
            });
        }, 200);
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
