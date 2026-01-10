import React, { useEffect, useRef } from 'react';
// @ts-ignore
import renderMathInElement from "katex/dist/contrib/auto-render";

interface Props {
    content: string;
    className?: string;
}

export const LatexPreview: React.FC<Props> = ({ content, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);

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
        <div
            ref={containerRef}
            className={`latex-preview-container h-full p-8 overflow-auto prose max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed ${className?.includes('bg-[#282a36]') ? 'bg-[#282a36] text-gray-300' : 'bg-white'} ${className || ''}`}
            style={{
                color: className?.includes('text-gray-300') ? '#e2e8f0' : undefined
            }}
        />
    );
};
