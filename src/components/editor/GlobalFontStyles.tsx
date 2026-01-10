import React from 'react';

interface GlobalFontStylesProps {
    useMonospace: boolean;
}

export const GlobalFontStyles: React.FC<GlobalFontStylesProps> = ({ useMonospace }) => {
    const fontStyles = `
        /* 1. 基础 UI 和 Markdown 预览正文 -> 使用系统默认字体 */
        :root, body, button, input, select, .breadcrumbs, .prose {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important;
        }

        /* 2. 代码编辑器核心 (CodeMirror) -> 动态切换 */
        .cm-editor, .cm-scroller, .cm-content, .cm-line {
            font-family: ${useMonospace ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'} !important;
        }

        /* 3. 预览区域内的代码块 (pre, code) -> 使用系统等宽字体 */
        .prose pre, .prose code {
             font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }

        /* 优化行高 */
        .cm-line {
            line-height: 1.6 !important;
        }
    `;

    return <style>{fontStyles}</style>;
};
