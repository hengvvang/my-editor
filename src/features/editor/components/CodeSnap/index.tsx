import React, { useRef, useCallback, useState, useDeferredValue, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { Copy, Download, Check, Moon, Sun, Code2, Eye, RotateCcw, Maximize2, MoveHorizontal, MoveVertical, Type, LucideIcon } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from "@codemirror/view";
import { syntaxHighlighting } from "@codemirror/language";
import { getLanguageExtension } from '../../../../shared/utils/languageManager';
import { hybridHighlightStyle } from '../../../../shared/config/editor';

interface CodeSnapProps {
    code: string;
    language?: string;
    fileName?: string;
    renderPreview?: (content: string, isDark: boolean, scale: number) => React.ReactNode;
}

const hybridTheme = syntaxHighlighting(hybridHighlightStyle);

interface ControlItemProps {
    icon: LucideIcon;
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ControlItem: React.FC<ControlItemProps> = ({ icon: Icon, label, value, min, max, step = 1, onChange }) => (
    <div className="flex items-center gap-2 px-1.5 group cursor-pointer">
        <Icon size={14} className="text-slate-400" />
        <div className="flex flex-col w-16 sm:w-20 gap-0.5">
            <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">{label}</span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
        </div>
    </div>
);

export const CodeSnap: React.FC<CodeSnapProps> = ({ code, fileName, renderPreview }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [mode, setMode] = useState<'code' | 'preview'>('code');

    // Layout state
    const [padding, setPadding] = useState(3); // 1-6 scale
    const [width, setWidth] = useState(480); // Default width
    const [minHeight, setMinHeight] = useState(0); // Min Height for aspect ratio control
    const [fontSize, setFontSize] = useState(14); // Font size in px

    // Deferred values for performance
    const deferredPadding = useDeferredValue(padding);
    const deferredWidth = useDeferredValue(width);
    const deferredMinHeight = useDeferredValue(minHeight);
    const deferredFontSize = useDeferredValue(fontSize);

    const toggleTheme = () => setIsDark(!isDark);

    const handlePaddingChange = (e: React.ChangeEvent<HTMLInputElement>) => setPadding(Number(e.target.value));
    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => setWidth(Number(e.target.value));
    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => setMinHeight(Number(e.target.value));
    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => setFontSize(Number(e.target.value));

    const resetDimensions = () => {
        setWidth(480);
        setMinHeight(0);
        setPadding(3);
        setFontSize(14);
    };

    const onCopy = useCallback(async () => {
        if (ref.current === null) return;
        try {
            const dataUrl = await toPng(ref.current, {
                cacheBust: true,
                pixelRatio: 3,
                style: { margin: '0' },
                filter: (node) => !node.classList?.contains('preview-actions')
            });
            const blob = await (await fetch(dataUrl)).blob();

            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy image:", err);
            alert("Failed to copy image. Please try downloading instead.");
        }
    }, [ref]);

    const onDownload = useCallback(async () => {
        if (ref.current === null) return;
        try {
            const dataUrl = await toPng(ref.current, {
                cacheBust: true,
                pixelRatio: 3,
                style: { margin: '0' },
                filter: (node) => !node.classList?.contains('preview-actions')
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
    }, [ref, fileName]);

    // Force monospace font within the snapshot
    const snapFontStyles = `
        .snap-container * {
            font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            font-variant-ligatures: active;
        }
    `;

    const editorExtensions = useMemo(() => [
        ...getLanguageExtension(fileName || "code.txt"),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        EditorView.theme({ "&": { fontSize: `${deferredFontSize}px` } })
    ], [fileName, deferredFontSize]);

    const basicSetup = useMemo(() => ({
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
    }), []);

    return (
        <div className="h-full flex flex-col bg-slate-100 dark:bg-[#09090b] overflow-hidden items-center justify-center relative select-none">
            {/* --- Top Right Actions (Execution) --- */}
            <div className="preview-actions absolute top-3 right-6 z-50 flex items-center gap-1.5 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-md p-1 rounded-lg shadow-sm border border-slate-200/60 dark:border-white/10 transition-all print:hidden">
                <button
                    onClick={toggleTheme}
                    className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

                {renderPreview && (
                    <button
                        onClick={() => setMode(m => m === 'code' ? 'preview' : 'code')}
                        className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                        title={mode === 'code' ? "Switch to Preview" : "Switch to Code"}
                    >
                        {mode === 'code' ? <Eye size={14} /> : <Code2 size={14} />}
                    </button>
                )}

                <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

                <button
                    onClick={onCopy}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-medium text-xs transition-all active:scale-[0.98] ${copied
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-slate-100/50 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10'}`}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                <button
                    onClick={onDownload}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-medium text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                    <Download size={14} />
                    Save
                </button>
            </div>

            {/* --- Bottom Center Controls (Configuration) --- */}
            <div className="preview-actions absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-md p-1 rounded-lg shadow-sm border border-slate-200/60 dark:border-white/10 max-w-[96%] transition-all overflow-x-auto print:hidden">
                <div className="flex items-center gap-1 sm:gap-2 px-1 py-0.5 min-w-max">
                    <ControlItem
                        icon={MoveHorizontal}
                        label="Width"
                        value={width}
                        min={300}
                        max={1200}
                        step={10}
                        onChange={handleWidthChange}
                    />

                    <ControlItem
                        icon={MoveVertical}
                        label="Height"
                        value={minHeight}
                        min={0}
                        max={1000}
                        step={10}
                        onChange={handleHeightChange}
                    />

                    <ControlItem
                        icon={Maximize2}
                        label="Padding"
                        value={padding}
                        min={0}
                        max={16}
                        step={1}
                        onChange={handlePaddingChange}
                    />

                    <ControlItem
                        icon={Type}
                        label="Font"
                        value={fontSize}
                        min={10}
                        max={32}
                        step={1}
                        onChange={handleFontSizeChange}
                    />

                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1" />

                    {/* Reset Control */}
                    <div className="flex items-center px-1.5 group cursor-pointer" title="Reset All Settings">
                        <button
                            onClick={resetDimensions}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-2 py-1.5 rounded-md transition-colors"
                        >
                            <RotateCcw size={12} />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Main Workspace Canvas --- */}
            <div className="flex-1 w-full h-full overflow-auto px-6 py-12 flex relative">
                {/* Workspace Grid Pattern for Ergnomic Feel */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
                />

                {/* The Capture Container (Centered) */}
                <div className="origin-center transition-transform duration-100 ease-out m-auto">
                    <div
                        ref={ref}
                        className="snap-container relative rounded-xl flex items-center justify-center transition-all duration-300 ease-out origin-center shadow-sm"
                        style={{
                            padding: `${deferredPadding * 8}px`,
                            backgroundColor: isDark ? '#1e1e1e' : '#e2e8f0', // The "Export Background"
                        }}
                    >
                        <style>{snapFontStyles}</style>
                        {/* The Editor Window */}
                        <div
                            className={`rounded-lg shadow-2xl overflow-hidden border ring-1 transition-colors duration-200 flex flex-col ${isDark
                                ? 'bg-[#282a36] border-white/10 ring-white/5 shadow-black/50'
                                : 'bg-white border-slate-200/60 ring-slate-900/5'
                                }`}
                            style={{ width: `${deferredWidth}px`, minHeight: `${deferredMinHeight}px` }}
                        >
                            {/* Status Bar / Window Controls */}
                            <div className={`flex items-center justify-between px-4 py-3 border-b transition-colors duration-200 shrink-0 ${isDark ? 'bg-[#282a36] border-white/5' : 'bg-white border-slate-100'
                                }`}>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-sm" />
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-sm" />
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-sm" />
                                </div>
                                {fileName && (
                                    <div className={`text-xs font-mono font-medium opacity-60 ml-4 truncate ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                        {fileName}
                                    </div>
                                )}
                                <div className="flex-1" />
                            </div>

                            {/* Code Area */}
                            <div
                                className={`p-6 transition-colors duration-200 min-h-[120px] flex-1 ${isDark ? 'bg-[#282a36] text-gray-300' : 'bg-white text-slate-800'}`}
                                style={{ fontSize: `${deferredFontSize}px` }}
                            >
                                {mode === 'code' ? (
                                    <CodeMirror
                                        value={code}
                                        theme={isDark ? hybridTheme : "light"}
                                        extensions={editorExtensions}
                                        basicSetup={basicSetup}
                                    />
                                ) : (
                                    <div className={`min-h-[100px] min-w-[200px] rounded ${isDark ? 'bg-[#282a36] text-gray-300' : 'bg-white text-slate-800'}`}>
                                        {renderPreview ? renderPreview(code, isDark, 1) : <div className="p-4 text-center text-slate-400">Preview not available</div>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Watermark (Removed) */}
                    </div>
                </div>
            </div>


        </div>
    );
};
