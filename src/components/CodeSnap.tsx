import React, { useRef, useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { Copy, Download, Check, Moon, Sun } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from "@codemirror/view";
import { syntaxHighlighting } from "@codemirror/language";
import { getLanguageExtension } from '../utils/languageManager';
import { hybridHighlightStyle } from '../config/editor';

interface CodeSnapProps {
    code: string;
    language?: string;
    fileName?: string;
    renderPreview?: (content: string, isDark: boolean) => React.ReactNode;
}

const hybridTheme = syntaxHighlighting(hybridHighlightStyle);

export const CodeSnap: React.FC<CodeSnapProps> = ({ code, fileName, renderPreview }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [mode, setMode] = useState<'code' | 'preview'>('code');

    const toggleTheme = () => setIsDark(!isDark);

    const onCopy = useCallback(async () => {
        if (ref.current === null) return;
        try {
            // Setup for high-res capture
            // We need to slightly modify style during capture to ensure fonts render correctly
            const dataUrl = await toPng(ref.current, {
                cacheBust: true,
                pixelRatio: 3, // Higher pixel ratio for better quality
                style: { margin: '0' },
                backgroundColor: isDark ? '#282a36' : '#ffffff', // Explicit background
                filter: (node) => {
                    // Exclude the preview actions toolbar from the snapshot
                    if (node.classList && node.classList.contains('preview-actions')) {
                        return false;
                    }
                    return true;
                }
            });
            const blob = await (await fetch(dataUrl)).blob();

            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy image:", err);
            alert("Failed to copy image. Please try downloading instead.");
        }
    }, [ref, isDark]);

    const onDownload = useCallback(async () => {
        if (ref.current === null) return;
        try {
            const dataUrl = await toPng(ref.current, {
                cacheBust: true,
                pixelRatio: 3,
                style: { margin: '0' },
                backgroundColor: isDark ? '#282a36' : '#ffffff',
                filter: (node) => {
                    if (node.classList && node.classList.contains('preview-actions')) {
                        return false;
                    }
                    return true;
                }
            });
            const link = document.createElement('a');
            link.download = `code-snap-${fileName || 'capture'}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to download image:", err);
            alert("Failed to generate image.");
        }
    }, [ref, fileName, isDark]);

    // Force monospace font within the snapshot
    const snapFontStyles = `
        .snap-container * {
            font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            font-variant-ligatures: active;
        }
    `;

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden p-4 md:p-8 items-center justify-center relative">
            <div className="mb-6 flex gap-3 z-10 sticky top-0 flex-wrap justify-center">
                {/* Mode Switcher */}
                {renderPreview && (
                    <div className="flex bg-slate-200 p-1 rounded-lg mr-2">
                        <button
                            onClick={() => setMode('code')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'code' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Code
                        </button>
                        <button
                            onClick={() => setMode('preview')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'preview' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Preview
                        </button>
                    </div>
                )}

                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm shadow-sm border border-slate-200 transition-all"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button
                    onClick={onCopy}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all duration-200 border border-slate-200 ${copied ? 'bg-green-500 text-white ring-2 ring-green-600/50' : 'bg-white hover:bg-slate-100 text-slate-700'}`}
                    title="Copy to Clipboard"
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy Image'}
                </button>
                <button
                    onClick={onDownload}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm shadow-sm border border-slate-200 transition-all"
                >
                    <Download size={18} />
                    Save PNG
                </button>
            </div>

            {/* The Capture Container */}
            <div className="relative group max-w-full overflow-x-auto pb-8">
                {/* Background: Transparent for clean capture */}
                <div
                    ref={ref}
                    className="snap-container relative p-12 rounded-xl min-w-[300px]"
                >
                    <style>{snapFontStyles}</style>
                    {/* The Editor Window */}
                    <div className={`rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden border ring-1 transition-colors duration-200 ${isDark
                        ? 'bg-[#282a36] border-white/10 ring-white/5 shadow-black/40'
                        : 'bg-white border-slate-200/60 ring-slate-900/5'
                        }`}>
                        {/* Status Bar / Window Controls */}
                        <div className={`flex items-center justify-between px-4 py-3 border-b transition-colors duration-200 ${isDark ? 'bg-[#282a36] border-white/5' : 'bg-white border-slate-100'
                            }`}>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                                <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                            </div>
                            {fileName && (
                                <div className={`text-xs font-mono font-medium opacity-80 ${isDark ? 'text-gray-400' : 'text-slate-400'
                                    }`}>
                                    {fileName}
                                </div>
                            )}
                            <div className="w-14" /> {/* Spacer for centering */}
                        </div>

                        {/* Code Area */}
                        <div className={`p-6 transition-colors duration-200 ${isDark ? 'bg-[#282a36] text-gray-300' : 'bg-white text-slate-800'
                            }`}>
                            {mode === 'code' ? (
                                <CodeMirror
                                    value={code}
                                    theme={isDark ? hybridTheme : "light"}
                                    extensions={[
                                        ...getLanguageExtension(fileName || "code.txt"),
                                        EditorView.editable.of(false),
                                        EditorView.lineWrapping
                                    ]}
                                    basicSetup={{
                                        lineNumbers: false,
                                        foldGutter: false,
                                        highlightActiveLine: false,
                                        indentOnInput: false,
                                        bracketMatching: false,
                                        closeBrackets: false,
                                        autocompletion: false,
                                        rectangularSelection: false,
                                        crosshairCursor: false,
                                        highlightActiveLineGutter: false,
                                        highlightSelectionMatches: false,
                                        highlightSpecialChars: false,
                                        history: false,
                                        drawSelection: false,
                                        dropCursor: false,
                                        allowMultipleSelections: false,
                                    }}
                                />
                            ) : (
                                <div className={`min-h-[100px] min-w-[200px] rounded ${isDark ? 'bg-[#282a36] text-gray-300' : 'bg-white text-slate-800'}`}>
                                    {renderPreview ? renderPreview(code, isDark) : <div className="p-4 text-center text-slate-400">Preview not available</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Watermark (Optional) */}
                    <div className={`absolute bottom-4 right-16 text-[10px] font-sans font-bold tracking-widest uppercase pointer-events-none transition-colors duration-200 ${isDark ? 'text-white/20' : 'text-slate-400/30'
                        }`}>
                        Typoly Code Snap
                    </div>
                </div>
            </div>

            <p className="mt-8 text-gray-500 text-xs">
                Snap from <span className="text-gray-400">{fileName || 'Untitled'}</span>
            </p>
        </div>
    );
};
