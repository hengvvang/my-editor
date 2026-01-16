import React, { useRef, useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { Copy, Download, Check, Moon, Sun, Code2, Eye, ZoomIn, ZoomOut, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from "@codemirror/view";
import { syntaxHighlighting } from "@codemirror/language";
import { getLanguageExtension } from '../../../utils/languageManager';
import { hybridHighlightStyle } from '../../../config/editor';

interface CodeSnapProps {
    code: string;
    language?: string;
    fileName?: string;
    renderPreview?: (content: string, isDark: boolean, scale: number) => React.ReactNode;
}

const hybridTheme = syntaxHighlighting(hybridHighlightStyle);

export const CodeSnap: React.FC<CodeSnapProps> = ({ code, fileName, renderPreview }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [mode, setMode] = useState<'code' | 'preview'>('code');
    const [scale, setScale] = useState(1);
    const [padding, setPadding] = useState(3); // 1-6 scale

    const toggleTheme = () => setIsDark(!isDark);

    const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 3));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));
    const handleResetZoom = () => setScale(1);

    const handlePaddingInc = () => setPadding(p => Math.min(p + 1, 8));
    const handlePaddingDec = () => setPadding(p => Math.max(p - 1, 0));

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

            const suggestedName = `code-snap-${fileName ? fileName.replace(/\.[^/.]+$/, "") : 'capture'}-${Date.now()}.png`;
            const filePath = await save({
                filters: [{
                    name: 'PNG Image',
                    extensions: ['png'],
                }],
                defaultPath: suggestedName
            });

            if (!filePath) return;

            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            await writeFile(filePath, binaryData);
        } catch (err) {
            console.error("Failed to download image:", err);
            alert("Failed to generate or save image.");
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
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden items-center justify-center relative group">
            <div className="preview-actions absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-white/80 backdrop-blur-sm p-1 rounded-md shadow-sm border border-slate-200">
                <button
                    onClick={onCopy}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                    title={copied ? "Copied!" : "Copy Image"}
                >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>

                <button
                    onClick={onDownload}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                    title="Save as PNG"
                >
                    <Download size={14} />
                </button>

                {/* Mode Switcher */}
                {renderPreview && (
                    <button
                        onClick={() => setMode(m => m === 'code' ? 'preview' : 'code')}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                        title={mode === 'code' ? "Switch to Preview" : "Switch to Code"}
                    >
                        {mode === 'code' ? <Eye size={14} /> : <Code2 size={14} />}
                    </button>
                )}

                <button
                    onClick={toggleTheme}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                <div className="w-[1px] h-4 bg-slate-200 my-auto mx-0.5" />

                <button
                    onClick={handleZoomOut}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut size={14} />
                </button>

                <span className="text-[10px] text-slate-400 font-mono flex items-center min-w-[32px] justify-center select-none">
                    {Math.round(scale * 100)}%
                </span>

                <button
                    onClick={handleZoomIn}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn size={14} />
                </button>

                <button
                    onClick={handleResetZoom}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                    title="Reset Zoom"
                >
                    <RefreshCw size={12} />
                </button>

                <div className="w-[1px] h-4 bg-slate-200 my-auto mx-0.5" />

                <button
                    onClick={handlePaddingDec}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                    title="Decrease Padding"
                >
                    <Minimize2 size={14} />
                </button>

                <button
                    onClick={handlePaddingInc}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                    title="Increase Padding"
                >
                    <Maximize2 size={14} />
                </button>
            </div>

            {/* The Capture Container */}
            <div className="relative w-full h-full overflow-auto p-4 flex">
                {/* Background: Transparent for clean capture */}
                <div
                    ref={ref}
                    className="snap-container relative rounded-xl w-full max-w-[95%] m-auto flex items-center justify-center transition-transform duration-200 origin-center"
                    style={{ padding: `${padding * 8}px` }}
                >
                    <style>{snapFontStyles}</style>
                    {/* The Editor Window */}
                    <div className={`rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden border ring-1 transition-colors duration-200 w-full ${isDark
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
                        <div className={`p-6 transition-colors duration-200 min-h-[120px] ${isDark ? 'bg-[#282a36] text-gray-300' : 'bg-white text-slate-800'
                            }`}
                            style={{ fontSize: `${scale * 14}px` }}
                        >
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
                                    {renderPreview ? renderPreview(code, isDark, scale) : <div className="p-4 text-center text-slate-400">Preview not available</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Watermark (Optional) */}
                    <div className={`absolute bottom-2 right-8 text-[10px] font-sans font-bold tracking-widest uppercase pointer-events-none transition-colors duration-200 ${isDark ? 'text-white/20' : 'text-slate-400/30'
                        }`}>
                        Typoly Code Snap
                    </div>
                </div>
            </div>

            <p className="mt-2 text-gray-500 text-xs text-center">
                Snap from <span className="text-gray-400">{fileName || 'Untitled'}</span>
            </p>
        </div>
    );
};
