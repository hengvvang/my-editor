import React, { useEffect, useState } from 'react';
import { invoke } from "@tauri-apps/api/core";
import DOMPurify from "dompurify";

interface Props {
    content: string;
    className?: string;
}

export const MarkdownPreview: React.FC<Props> = ({ content, className }) => {
    const [html, setHtml] = useState<string>('');

    useEffect(() => {
        const timer = setTimeout(() => {
            invoke('render_markdown', { text: content }).then((res) => {
                setHtml(DOMPurify.sanitize(res as string));
            });
        }, 200);
        return () => clearTimeout(timer);
    }, [content]);

    return (
        <div
            className={`prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600 p-8 ${className || ''}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};
