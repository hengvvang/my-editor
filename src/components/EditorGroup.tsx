import React, { useState, useEffect, useRef } from "react";
import { FileText, Folder, Save, ChevronRight, X, Lock, SplitSquareHorizontal, Columns, Code, Eye, Keyboard, Map as MapIcon, Type } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { markdown as markdownLang } from '@codemirror/lang-markdown';
import { vim } from "@replit/codemirror-vim";
import { syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import mermaid from "mermaid";
// @ts-ignore
import renderMathInElement from "katex/dist/contrib/auto-render";
import { latexLivePreview } from "../codemirror-latex";
import { invoke } from "@tauri-apps/api/core";
// 引入字体
import "lxgw-wenkai-screen-webfont/style.css";

import DOMPurify from "dompurify";
import { Tab, FileEntry } from "../types";
import { markdownExtensions, hybridHighlightStyle } from "../editorConfig";
import { MinimapView } from "./MinimapView";
import { StatusBar, colorSchemes } from "./StatusBar";

const hybridTheme = syntaxHighlighting(hybridHighlightStyle);

interface EditorGroupProps {
    groupId: string;
    groupIndex: number; // For color cycling
    isActiveGroup: boolean; // Needs to be passed from parent
    tabs: Tab[];
    activePath: string | null;
    content: string; // Content of the active file
    isReadOnly: boolean;
    onSwitchTab: (path: string) => void;
    onCloseTab: (e: React.MouseEvent, path: string) => void;
    onContentChange: (value: string) => void;
    onSave: () => void;
    onSplit: () => void; // Trigger split (clone group)
    maximized?: boolean; // If only one group is visible
    rootDir: string | null;
    onToggleLock: () => void;
    onCloseGroup?: () => void;
}

export const EditorGroup: React.FC<EditorGroupProps> = ({
    groupId,
    groupIndex,
    isActiveGroup,
    tabs,
    activePath,
    content,
    isReadOnly,
    onSwitchTab,
    onCloseTab,
    onContentChange,
    onSave,
    onSplit,
    rootDir,
    onToggleLock,
    onCloseGroup
}) => {
    // --- Theme ---
    const scheme = colorSchemes[groupIndex % colorSchemes.length];

    // --- Local View State ---
    const [isSourceMode, setIsSourceMode] = useState(true);
    const [showSplitPreview, setShowSplitPreview] = useState(false);
    const [isVimMode, setIsVimMode] = useState(false);
    const [useMonospace, setUseMonospace] = useState(false);
    const [showLineNumbers] = useState(true);
    const [showMinimap, setShowMinimap] = useState(false);
    const [splitRatio, setSplitRatio] = useState(0.5);
    const [resizingTarget, setResizingTarget] = useState<'editorSplit' | null>(null);

    // --- Content Rendering State ---
    const [htmlContent, setHtmlContent] = useState('');
    const [typstSvg, setTypstSvg] = useState<string>('');
    const [mermaidSvg, setMermaidSvg] = useState<string>('');
    const editorViewRef = useRef<EditorView | null>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);

    // --- Breadcrumbs State ---
    const [breadcrumbDropdown, setBreadcrumbDropdown] = useState<{ path: string; type: 'file' | 'outline'; items: any[] } | null>(null);

    // --- Derived State ---
    const getDocType = (path: string | null): 'markdown' | 'typst' | 'mermaid' | 'latex' | 'text' => {
        if (!path) return 'text';
        if (path.endsWith('.typ')) return 'typst';
        if (path.endsWith('.md')) return 'markdown';
        if (path.endsWith('.mmd') || path.endsWith('.mermaid')) return 'mermaid';
        if (path.endsWith('.tex') || path.endsWith('.latex')) return 'latex';
        return 'text';
    };
    const docType = getDocType(activePath);

    // --- Effects ---

    // Mermaid Rendering
    useEffect(() => {
        if (docType === 'mermaid' && content) {
            const timer = setTimeout(async () => {
                try {
                    const id = `mermaid-${groupId}-${Date.now()}`;
                    const { svg } = await mermaid.render(id, content);
                    setMermaidSvg(svg);
                } catch (e) {
                    setMermaidSvg(`<div class="text-red-500 p-4">Mermaid Syntax Error:<br/>${(e as Error).message}</div>`);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [content, docType, groupId]);

    // Typst Compilation
    useEffect(() => {
        if (docType === 'typst' && content) {
            const timer = setTimeout(async () => {
                try {
                    const svg = await invoke<string>('compile_typst', { content });
                    setTypstSvg(svg);
                } catch (e) {
                    console.error("Typst compilation failed:", e);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [content, docType]);

    // Markdown Rendering for Preview
    useEffect(() => {
        // Fix: Render markdown even if showSplitPreview is true, regardless of docType check here (safety)
        // ideally checking docType === 'markdown' is correct, but let's ensure it runs.
        if (showSplitPreview && docType === 'markdown') {
            const timer = setTimeout(() => {
                invoke('render_markdown', { text: content }).then((html) => {
                    setHtmlContent(DOMPurify.sanitize(html as string));
                });
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [content, showSplitPreview, docType]);

    // Latex Rendering
    useEffect(() => {
        if (docType === 'latex' && content) {
            const timer = setTimeout(() => {
                const previewContainer = document.getElementById(`latex-preview-${groupId}`);
                if (previewContainer) {
                    previewContainer.textContent = content;
                    try {
                        renderMathInElement(previewContainer, {
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
        }
    }, [content, docType, groupId]);

    // Click outside breadcrumb
    useEffect(() => {
        const h = () => setBreadcrumbDropdown(null);
        window.addEventListener('click', h);
        return () => window.removeEventListener('click', h);
    }, []);

    // Resize Handler
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (resizingTarget === 'editorSplit' && mainContentRef.current) {
                const rect = mainContentRef.current.getBoundingClientRect();
                const relativeX = e.clientX - rect.left;
                let newRatio = relativeX / rect.width;
                if (newRatio < 0.1) newRatio = 0.1;
                if (newRatio > 0.9) newRatio = 0.9;
                setSplitRatio(newRatio);
            }
        };
        const handleMouseUp = () => {
            setResizingTarget(null);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
        if (resizingTarget) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingTarget]);


    // --- Font Styles Injection ---
    const fontStyles = `
        /* 1. 基础 UI 和 Markdown 预览正文 -> 始终主要使用 "LXGW WenKai Screen" */
        :root, body, button, input, select, .breadcrumbs, .prose {
            font-family: "LXGW WenKai Screen", "Microsoft YaHei", sans-serif !important;
        }

        /* 2. 代码编辑器核心 (CodeMirror) -> 动态切换 */
        .cm-editor, .cm-scroller, .cm-content, .cm-line {
            font-family: ${useMonospace ? 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace' : '"LXGW WenKai Screen", sans-serif'} !important;
        }

        /* 3. 预览区域内的代码块 (pre, code) -> 始终建议用 Mono */
        .prose pre, .prose code {
             font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace !important;
        }

        /* 优化行高 */
        .cm-line {
            line-height: 1.6 !important;
        }
    `;

    // --- Breadcrumb Logic ---
    const breadcrumbs = React.useMemo(() => {
        if (!activePath) return [];
        const parts: { name: string; path: string; isDir: boolean }[] = [];
        let displayPath = activePath.replace(/\\/g, '/');
        const rootRaw = rootDir ? rootDir.replace(/\\/g, '/') : null;
        if (rootRaw) {
            const rootName = rootRaw.split('/').pop() || rootRaw;
            parts.push({ name: rootName, path: rootRaw, isDir: true });
            if (displayPath.startsWith(rootRaw)) {
                displayPath = displayPath.substring(rootRaw.length);
            }
        }
        if (displayPath.startsWith('/')) displayPath = displayPath.substring(1);
        const segments = displayPath.split('/');
        let currentAccumulated = rootRaw || "";
        segments.forEach((seg, index) => {
            if (!seg) return;
            if (currentAccumulated === "") currentAccumulated = seg;
            else if (currentAccumulated.endsWith('/')) currentAccumulated += seg;
            else currentAccumulated += '/' + seg;
            const isLast = index === segments.length - 1;
            parts.push({ name: seg, path: currentAccumulated, isDir: !isLast });
        });
        return parts;
    }, [activePath, rootDir]);

    const handleBreadcrumbClick = async (e: React.MouseEvent, item: { path: string; isDir: boolean }) => {
        e.stopPropagation();
        if (breadcrumbDropdown?.path === item.path) {
            setBreadcrumbDropdown(null);
            return;
        }
        let targetPath = item.path;
        if (!item.isDir) {
            const s = item.path.replace(/\\/g, '/').split('/');
            s.pop();
            targetPath = s.join('/');
        }
        try {
            const files = await invoke<FileEntry[]>("read_dir", { path: targetPath });
            files.sort((a, b) => {
                if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
                return a.is_dir ? -1 : 1;
            });
            setBreadcrumbDropdown({ path: item.path, type: 'file', items: files });
        } catch (err) {
            console.error(err);
        }
    };

    if (!activePath) {
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-50 items-center justify-center text-slate-400 relative">
                <style>{fontStyles}</style>
                {onCloseGroup && (
                    <button
                        onClick={onCloseGroup}
                        className="absolute top-2 right-2 p-2 hover:bg-slate-200 text-slate-400 hover:text-red-500 rounded-md transition-all"
                        title="Close Group"
                    >
                        <X size={16} />
                    </button>
                )}
                <div onClick={onSplit} className="cursor-pointer mb-2 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                    <SplitSquareHorizontal size={32} className="opacity-50" />
                </div>
                <p>No file open</p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white border-r border-slate-200 last:border-r-0">
            <style>{fontStyles}</style>
            {/* Tab Bar */}
            <div className="flex bg-slate-100/50 border-b border-slate-200 overflow-x-auto overflow-y-hidden no-scrollbar shrink-0 backdrop-blur-sm relative pt-1 h-[35px]">
                {tabs.map(tab => (
                    <div
                        key={tab.path}
                        onClick={() => onSwitchTab(tab.path)}
                        className={`group relative flex items-center gap-2 px-4 min-w-[120px] max-w-[200px] border-r border-slate-200/50 text-xs select-none cursor-pointer transition-all ${tab.path === activePath ? 'bg-white text-blue-600 shadow-sm rounded-t-lg mb-[-1px] border-t-2 border-t-blue-500 border-x border-slate-200' : 'bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 border-t-2 border-t-transparent'}`}
                        style={{ height: 'calc(100% - 1px)' }}
                    >
                        <FileText size={14} className={tab.path === activePath ? 'text-blue-500' : 'text-slate-400'} />
                        <span className="truncate flex-1 font-medium">{tab.name}</span>
                        {tab.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 group-hover:hidden" />}
                        <button
                            onClick={(e) => onCloseTab(e, tab.path)}
                            className={`p-0.5 rounded hover:bg-slate-200 hover:text-red-500 transition-all ${tab.isDirty ? 'hidden group-hover:block' : (tab.path === activePath ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}`}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                {/* Toolbar */}
                <div className={`ml-auto flex items-center pr-2 pl-1 gap-1 border-l border-slate-200/50 h-full sticky right-0 z-40 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] backdrop-blur-sm ${scheme.toolbar}`}>
                    <button
                        onClick={() => setShowSplitPreview(!showSplitPreview)}
                        className={`p-1 rounded-md transition-all ${showSplitPreview ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-white/50 hover:text-slate-600'}`} // adjusted hover
                        title="Toggle Split View"
                    >
                        <Columns size={14} />
                    </button>
                    <button
                        onClick={onSplit}
                        className="p-1 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all"
                        title="Split Editor Right"
                    >
                        <SplitSquareHorizontal size={14} />
                    </button>
                    <button
                        onClick={onToggleLock}
                        className={`p-1 rounded-md transition-all ${isReadOnly ? 'bg-amber-50 text-amber-600' : 'hover:bg-white/50 hover:text-slate-600'}`}
                        title={isReadOnly ? "Unlock Group" : "Lock Group (Read-Only)"}
                    >
                        <Lock size={14} />
                    </button>

                    <button onClick={onSave} className="p-1 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all" title="Save File (Ctrl+S)">
                        <Save size={14} />
                    </button>
                    {onCloseGroup && (
                        <button
                            onClick={onCloseGroup}
                            className="p-1 hover:bg-red-500 hover:text-white rounded-md transition-all ml-1"
                            title="Close Group"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 px-4 py-0.5 text-[11px] text-slate-500 bg-white border-b border-slate-100 shrink-0 select-none relative z-30 h-[22px]">
                {breadcrumbs.map((part, index) => (
                    <React.Fragment key={part.path}>
                        {index > 0 && <ChevronRight size={10} className="opacity-40 shrink-0" />}
                        <div className="relative flex items-center">
                            <span
                                className={`hover:bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${index === breadcrumbs.length - 1 ? 'font-medium text-slate-800' : 'text-slate-500'
                                    } ${breadcrumbDropdown?.path === part.path ? 'bg-slate-100 text-slate-800' : ''}`}
                                onClick={(e) => handleBreadcrumbClick(e, part)}
                            >
                                {part.isDir ? <Folder size={12} className={index === breadcrumbs.length - 1 ? "text-slate-400" : "opacity-70"} /> : <FileText size={12} className="text-blue-500" />}
                                <span className="whitespace-nowrap">{part.name}</span>
                            </span>
                            {/* Dropdown */}
                            {breadcrumbDropdown?.path === part.path && (
                                <div className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-slate-200 rounded-lg py-1 min-w-[200px] w-max max-w-[400px] max-h-[300px] overflow-y-auto z-[100] flex flex-col items-stretch animate-in fade-in zoom-in-95 duration-100">
                                    {breadcrumbDropdown.items.length === 0 && (
                                        <div className="px-4 py-2 text-slate-400 italic text-xs">Empty</div>
                                    )}
                                    {breadcrumbDropdown.type === 'file' && (
                                        (breadcrumbDropdown.items as FileEntry[]).map(file => (
                                            <div
                                                key={file.path}
                                                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${file.path === activePath ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!file.is_dir) {
                                                        // We need to load this file. Since we don't have loadFile prop, we use onSwitchTab if it's open,
                                                        // BUT we might need to open it.
                                                        // Parent manages "onSwitchTab" which presumably loads it if not active, but maybe "onFileSelect" is better?
                                                        // For now, assume onSwitchTab handles loading or reuse parent's loadFile via wrapper.
                                                        // Oh wait, `onSwitchTab` takes a path. Child just calls it. Parent app logic will handle "if not open, open it".
                                                        onSwitchTab(file.path);
                                                        setBreadcrumbDropdown(null);
                                                    }
                                                }}
                                            >
                                                {file.is_dir ? <Folder size={14} className="text-blue-400" /> : <FileText size={14} className={file.path === activePath ? "text-blue-500" : "text-slate-400"} />}
                                                <span className="truncate">{file.name}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative bg-white overflow-hidden" id={`scroll-${groupId}`}>
                <div className="flex min-h-full w-full h-full flex-col">
                    {/* View Controls Overlay (floating top right of editor) */}
                    <div className="sticky top-0 z-20 flex justify-end px-2 py-1 pointer-events-none">
                        <div className="pointer-events-auto flex items-center gap-1 bg-white/80 backdrop-blur border border-slate-200 rounded-md p-0.5 shadow-sm">
                            <button
                                onClick={() => setIsSourceMode(false)}
                                className={`p-1 rounded ${!isSourceMode ? 'bg-purple-100 text-purple-700' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Visual Mode"
                            ><Eye size={12} /></button>
                            <button
                                onClick={() => setIsSourceMode(true)}
                                className={`p-1 rounded ${isSourceMode ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Code Mode"
                            ><Code size={12} /></button>
                            <div className="w-[1px] h-3 bg-slate-200 mx-0.5"></div>
                            <button
                                onClick={() => setUseMonospace(!useMonospace)}
                                className={`p-1 rounded ${useMonospace ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
                                title={useMonospace ? "Switch to Variable Width Font" : "Switch to Monospace Font"}
                            ><Type size={12} /></button>
                            <button onClick={() => setIsVimMode(!isVimMode)} className={`p-1 rounded ${isVimMode ? 'bg-green-100 text-green-700' : 'text-slate-400'}`} title="Vim"><Keyboard size={12} /></button>
                            <button onClick={() => setShowMinimap(!showMinimap)} className={`p-1 rounded ${showMinimap ? 'bg-slate-200 text-slate-800' : 'text-slate-400'}`} title="Minimap"><MapIcon size={12} /></button>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex min-h-0 relative" ref={mainContentRef}>
                        {/* Wrapper for Editor + Preview. Used flex-1 to take available space next to Minimap */}
                        <div className={`transition-all duration-300 h-full flex-1 min-w-0 ${showSplitPreview ? 'flex' : ''}`}>
                            {/* Primary Editor */}
                            <div
                                className={`h-full relative overflow-hidden ${!isSourceMode && (docType === 'markdown' || docType === 'latex') ? 'preview-mode-cm' : ""}`}
                                style={{ width: showSplitPreview ? `${splitRatio * 100}%` : '100%', borderRight: showSplitPreview ? '1px solid #e2e8f0' : 'none' }}
                            >
                                <CodeMirror
                                    value={content}
                                    height="100%"
                                    extensions={[
                                        markdownLang({ extensions: [markdownExtensions] }),
                                        ...(isVimMode ? [vim({ status: true })] : []),
                                        ...(docType === 'latex' && !isSourceMode ? [latexLivePreview()] : []),
                                        ...(!isSourceMode && (docType === 'markdown' || docType === 'latex') ? [hybridTheme, EditorView.lineWrapping] : [])
                                    ]}
                                    onChange={onContentChange}
                                    theme="light"
                                    readOnly={isReadOnly}
                                    onCreateEditor={(view) => {
                                        editorViewRef.current = view;
                                    }}
                                    basicSetup={{
                                        lineNumbers: showLineNumbers,
                                        foldGutter: showLineNumbers,
                                        highlightActiveLine: true,
                                    }}
                                    className="h-full"
                                />
                            </div>

                            {/* Split Preview */}
                            {showSplitPreview && (
                                <>
                                    <div
                                        className={`w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 h-full shrink-0 -ml-[1px] ${resizingTarget === 'editorSplit' ? 'bg-blue-600' : 'bg-transparent'}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setResizingTarget('editorSplit');
                                        }}
                                    />
                                    <div className="h-full overflow-y-auto bg-slate-50/50" style={{ width: `${(1 - splitRatio) * 100}%` }}>
                                        {docType === 'typst' ? (
                                            <div className="typst-preview-container h-full bg-white p-8 overflow-auto flex flex-col items-center" dangerouslySetInnerHTML={{ __html: typstSvg }} />
                                        ) : docType === 'mermaid' ? (
                                            <div className="mermaid-preview-container h-full flex items-center justify-center bg-white p-4 overflow-auto" dangerouslySetInnerHTML={{ __html: mermaidSvg }} />
                                        ) : docType === 'latex' ? (
                                            <div id={`latex-preview-${groupId}`} className="latex-preview-container h-full bg-white p-8 overflow-auto prose max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed" />
                                        ) : docType === 'markdown' ? (
                                            <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600 p-8" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                                        ) : (
                                            /* For other file types, render a read-only source view */
                                            <div className="h-full relative bg-white">
                                                <CodeMirror
                                                    value={content}
                                                    height="100%"
                                                    extensions={[
                                                        markdownLang({ extensions: [markdownExtensions] }),
                                                        EditorView.lineWrapping,
                                                        EditorView.editable.of(false)
                                                    ]}
                                                    readOnly={true}
                                                    editable={false}
                                                    basicSetup={{
                                                        lineNumbers: showLineNumbers,
                                                        foldGutter: showLineNumbers,
                                                        highlightActiveLine: false,
                                                    }}
                                                    className="h-full"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Minimap */}
                        {showMinimap && (
                            <div className="w-[100px] shrink-0 border-l border-slate-200 bg-slate-50/30 h-full">
                                <MinimapView content={content} scrollContainerId={`scroll-${groupId}`} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Simple Status Bar for this group */}
            <StatusBar
                language={docType}
                groupId={groupId} groupIndex={groupIndex} isActive={isActiveGroup}
            />
        </div>
    );
};
