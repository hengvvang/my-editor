import React, { useEffect, useState } from 'react';
import { invoke } from "@tauri-apps/api/core";

interface Props {
    content: string;
    className?: string;
    isDark?: boolean;
}

export const TypstPreview: React.FC<Props> = ({ content, className, isDark }) => {
    const [svg, setSvg] = useState<string>('');

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const result = await invoke<string>('compile_typst', { content });
                setSvg(result);
            } catch (e) {
                console.error("Typst compilation failed:", e);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [content]);

    return (
        <div
            className={`typst-preview-container ${className || ''}`}
            dangerouslySetInnerHTML={{ __html: svg }}
            style={{
                color: className?.includes('text-gray-300') ? '#e2e8f0' : 'inherit',
                fill: className?.includes('text-gray-300') ? '#e2e8f0' : 'inherit',
                filter: isDark ? 'invert(1) hue-rotate(180deg)' : 'none'
            }}
        />
    );
};
