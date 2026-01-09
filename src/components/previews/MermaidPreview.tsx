import React, { useEffect, useState } from 'react';
import mermaid from "mermaid";

interface Props {
    content: string;
    className?: string;
    idPrefix: string;
}

export const MermaidPreview: React.FC<Props> = ({ content, className, idPrefix }) => {
    const [svg, setSvg] = useState<string>('');

    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                // Initialize mermaid if needed, usually done globally or here
                // mermaid.initialize({ startOnLoad: false });

                const id = `mermaid-${idPrefix}-${Date.now()}`;
                const { svg } = await mermaid.render(id, content);
                setSvg(svg);
            } catch (e) {
                setSvg(`<div class="text-red-500 p-4">Mermaid Syntax Error:<br/>${(e as Error).message}</div>`);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [content, idPrefix]);

    return (
        <div
            className={`mermaid-preview-container h-full flex items-center justify-center bg-white p-4 overflow-auto ${className || ''}`}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};
