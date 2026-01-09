import React, { useState, useEffect, useRef } from "react";
import { FileText, Folder, Save, ChevronRight, X, Lock, SplitSquareHorizontal, SplitSquareVertical, Columns, Code, Eye, Keyboard, Map as MapIcon, Type, ListOrdered, Camera } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { markdown as markdownLang } from '@codemirror/lang-markdown';
import { vim } from "@replit/codemirror-vim";
import { syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { latexLivePreview } from "../codemirror-latex";
import { invoke } from "@tauri-apps/api/core";

import { Tab, FileEntry } from "../types";
import { markdownExtensions, hybridHighlightStyle } from "../editorConfig";
import { MinimapView } from "./MinimapView";
import { StatusBar, colorSchemes } from "./StatusBar";
import { CodeSnap } from "./CodeSnap";

import { TypstPreview } from "./previews/TypstPreview";
import { MermaidPreview } from "./previews/MermaidPreview";
import { MarkdownPreview } from "./previews/MarkdownPreview";
import { LatexPreview } from "./previews/LatexPreview";

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
    onSplit: (direction?: 'horizontal' | 'vertical') => void; // Trigger split (clone group)
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
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [showMinimap, setShowMinimap] = useState(false);
    const [splitRatio, setSplitRatio] = useState(0.5);
    const [rightPanelSplitRatio, setRightPanelSplitRatio] = useState(0.5); // New variable for right panel internal split
    const [minimapWidth, setMinimapWidth] = useState(100);
    const [resizingTarget, setResizingTarget] = useState<'editorSplit' | 'rightPanelSplit' | 'minimap' | null>(null);

    // --- Content Rendering State ---
    const editorViewRef = useRef<EditorView | null>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const [showCodeSnap, setShowCodeSnap] = useState(false); // Independent toggle
    const [snapCode, setSnapCode] = useState('');
    const lockedCodeSnapWidthRef = useRef<number | null>(null); // To store pixel width of CodeSnap during editor resize
    const lockedPreviewWidthRef = useRef<number | null>(null); // To store pixel width of Preview during simple drag
    const lockedRightPanelWidthRef = useRef<number | null>(null); // To store pixel width of RightPanel during minimap resize

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

    // Click outside breadcrumb
    useEffect(() => {
        const h = () => setBreadcrumbDropdown(null);
        window.addEventListener('click', h);
        return () => window.removeEventListener('click', h);
    }, []);

    // --- Helper Functions for State Transitions ---
    const getWrapperWidth = () => {
        if (!mainContentRef.current) return 0;
        const totalW = mainContentRef.current.getBoundingClientRect().width;
        // If minimap is currently shown, the wrapper is already totalW - 100.
        // Wait, mainContentRef wraps both Wrapper and Minimap.
        // So internal wrapper width is (Total - MinimapWidth).
        const minimapW = showMinimap ? minimapWidth : 0;
        return totalW - minimapW;
    };

    const handleToggleMinimap = () => {
        const currentWrapperW = getWrapperWidth();
        if (currentWrapperW <= 0) {
            setShowMinimap(!showMinimap);
            if (!showMinimap && minimapWidth === 0) setMinimapWidth(100);
            return;
        }

        const isOpening = !showMinimap;
        const nextWrapperW = isOpening ? currentWrapperW - minimapWidth : currentWrapperW + minimapWidth;

        // We want to preserve RightPanel Width (pixels)
        if (showSplitPreview || showCodeSnap) {
            const currentRightPanelW = currentWrapperW * (1 - splitRatio);
            // newRightPanelW should be same pixels.
            // Ratio = 1 - (Right / Total)
            const rw = Math.max(1, nextWrapperW);
            let newSplit = 1 - (currentRightPanelW / rw);

            // Allow bounds check
            newSplit = Math.max(0.1, Math.min(0.95, newSplit));
            setSplitRatio(newSplit);
        }

        setShowMinimap(!showMinimap);
    };

    const handleTogglePreview = () => {
        const wrapperW = getWrapperWidth();
        if (wrapperW <= 0) {
            setShowSplitPreview(!showSplitPreview);
            return;
        }

        if (showSplitPreview) {
            // Closing Preview
            if (showCodeSnap) {
                // Must preserve CodeSnap width
                // Current Right Panel = Preview + Snap
                // Target Right Panel = Snap
                const currentRightW = wrapperW * (1 - splitRatio);
                const currentSnapW = currentRightW * (1 - rightPanelSplitRatio);

                // Calculate new split ratio for Editor vs Snap(only)
                let newSplit = 1 - (currentSnapW / wrapperW);
                newSplit = Math.max(0.1, Math.min(0.95, newSplit));
                setSplitRatio(newSplit);
                // rightPanelSplitRatio becomes irrelevant for single panel but reset/ignore
            } else {
                // Just closing right panel completely
                // splitRatio stays or resets? Usually keeps memory or resets to 0.5
                // Let's keep it, logic doesn't require change if panel is gone.
            }
            setShowSplitPreview(false);
        } else {
            // Opening Preview
            if (showCodeSnap) {
                // Snap exists. Insert Preview to Left of Snap.
                // Snap Width Fixed. Preview takes from Editor.

                const currentRightW = wrapperW * (1 - splitRatio); // This is just Snap width currently
                const snapW = currentRightW;

                let previewW = Math.min(400, (wrapperW - snapW) * 0.4);
                if (previewW < 100) previewW = 100;

                const newRightW = previewW + snapW;

                let newSplit = 1 - (newRightW / wrapperW);
                newSplit = Math.max(0.1, Math.min(0.9, newSplit));

                // New Right Panel Split: Preview / (Preview + Snap)
                let newRightSplit = previewW / newRightW;

                setSplitRatio(newSplit);
                setRightPanelSplitRatio(newRightSplit);
            } else {
                // Only Editor exists.
                // If previous split was extreme, reset.
                if (splitRatio > 0.9) setSplitRatio(0.5);
            }
            setShowSplitPreview(true);
        }
    };

    const handleToggleCodeSnap = () => {
        const wrapperW = getWrapperWidth();
        if (wrapperW <= 0) {
            // fallback
            if (!showCodeSnap) {
                const sel = editorViewRef.current?.state.selection.main;
                const textRaw = sel && !sel.empty ? editorViewRef.current?.state.sliceDoc(sel.from, sel.to) : content;
                setSnapCode(textRaw || '');
            }
            setShowCodeSnap(!showCodeSnap);
            return;
        }

        if (showCodeSnap) {
            // Closing Snap
            if (showSplitPreview) {
                // Editor + Preview + Snap -> Editor + Preview
                // Preserve Preview Width.
                const currentRightW = wrapperW * (1 - splitRatio);
                // currentRightW = Preview + Snap
                // internal split: Preview is (Right * split), Snap is (Right * (1-split))
                const currentPreviewW = currentRightW * rightPanelSplitRatio;

                // New logic: Right Panel is ONLY Preview
                // Target Right Width = currentPreviewW

                let newSplit = 1 - (currentPreviewW / wrapperW);
                newSplit = Math.max(0.1, Math.min(0.95, newSplit));

                setSplitRatio(newSplit);
                setShowCodeSnap(false);
            } else {
                setShowCodeSnap(false);
            }
        } else {
            // Opening Snap
            const sel = editorViewRef.current?.state.selection.main;
            const textRaw = sel && !sel.empty ? editorViewRef.current?.state.sliceDoc(sel.from, sel.to) : content;
            setSnapCode(textRaw || '');

            if (showSplitPreview) {
                // Editor + Preview -> Editor + Preview + Snap
                // Preserve Preview Width. Snap takes from Editor.
                const currentRightW = wrapperW * (1 - splitRatio); // This is just Preview
                const previewW = currentRightW;

                let snapW = 340;
                // Constraints
                if (wrapperW - previewW - snapW < 100) {
                    snapW = Math.max(200, wrapperW - previewW - 100);
                }

                const newRightW = previewW + snapW;
                let newSplit = 1 - (newRightW / wrapperW);
                newSplit = Math.max(0.1, Math.min(0.9, newSplit));

                // New Right Internal Split: Preview / (Preview + Snap)
                let newRightSplit = previewW / newRightW;

                setSplitRatio(newSplit);
                setRightPanelSplitRatio(newRightSplit);
            } else {
                if (splitRatio > 0.9) setSplitRatio(0.5);
            }
            setShowCodeSnap(true);
        }
    };

    // Resize Handler
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!mainContentRef.current) return;
            const currentMinimapW = showMinimap ? minimapWidth : 0;
            const rect = mainContentRef.current.getBoundingClientRect();
            // The "Wrapper" starts at rect.left (since flex container row, wrapper is first)
            // Wrapper width is rect.width - currentMinimapW.
            // Note: If dragging minimap, currentMinimapW is dynamic.

            // NOTE: We need careful access to current minimap width during drag if we want smooth updates.
            // Since this is react state, 'minimapWidth' is from closure.
            // But we update it.

            if (resizingTarget === 'editorSplit') {
                const wrapperW = rect.width - currentMinimapW;
                const relativeX = e.clientX - rect.left;
                let newEditorRatio = relativeX / wrapperW;
                newEditorRatio = Math.max(0.1, Math.min(0.9, newEditorRatio));

                setSplitRatio(newEditorRatio);

                // Preserve CodeSnap width if 3-pane
                if (showSplitPreview && showCodeSnap && lockedCodeSnapWidthRef.current) {
                    const newRightPanelPx = wrapperW * (1 - newEditorRatio);
                    const snapPx = lockedCodeSnapWidthRef.current;
                    let newRightRatio = (newRightPanelPx - snapPx) / newRightPanelPx;
                    newRightRatio = Math.max(0.05, Math.min(0.95, newRightRatio));
                    setRightPanelSplitRatio(newRightRatio);
                }

            } else if (resizingTarget === 'rightPanelSplit') {
                const wrapperW = rect.width - currentMinimapW;
                if (showSplitPreview && showCodeSnap && lockedPreviewWidthRef.current) {
                    const mouseRelative = e.clientX - rect.left;
                    const previewPx = lockedPreviewWidthRef.current;
                    let div1Pos = mouseRelative - previewPx;

                    if (div1Pos < wrapperW * 0.1) div1Pos = wrapperW * 0.1;
                    if (div1Pos > wrapperW * 0.9) div1Pos = wrapperW * 0.9;

                    const newEditorRatio = div1Pos / wrapperW;
                    setSplitRatio(newEditorRatio);

                    const actualRightPanelWidth = wrapperW - div1Pos;
                    let newRightRatio = previewPx / actualRightPanelWidth;
                    newRightRatio = Math.max(0.05, Math.min(0.95, newRightRatio));
                    setRightPanelSplitRatio(newRightRatio);

                } else {
                    const rightPanelWidth = wrapperW * (1 - splitRatio);
                    const rightPanelLeft = rect.left + (splitRatio * wrapperW);
                    const relativeX = e.clientX - rightPanelLeft;
                    let newRatio = relativeX / rightPanelWidth;
                    if (newRatio < 0.1) newRatio = 0.1;
                    if (newRatio > 0.9) newRatio = 0.9;
                    setRightPanelSplitRatio(newRatio);
                }
            } else if (resizingTarget === 'minimap') {
                // Dragging Minimap Resizer (Left of Minimap)
                // New Minimap W = Rect Right - MouseX
                // Rect Right should be close to window right usually, but trust Rect.
                const relativeX = e.clientX - rect.left;

                let newMinimapW = rect.width - relativeX;
                if (newMinimapW < 50) newMinimapW = 50;
                if (newMinimapW > 400) newMinimapW = 400;
                if (newMinimapW > rect.width * 0.5) newMinimapW = rect.width * 0.5;

                const newWrapperW = rect.width - newMinimapW;

                // Preserve RightPanel Width (if exists)
                if ((showSplitPreview || showCodeSnap) && lockedRightPanelWidthRef.current && newWrapperW > 0) {
                    const targetRightW = lockedRightPanelWidthRef.current;
                    // New Split = 1 - (Right / Wrapper)
                    let newSplit = 1 - (targetRightW / newWrapperW);
                    newSplit = Math.max(0.1, Math.min(0.95, newSplit));
                    setSplitRatio(newSplit);
                }

                setMinimapWidth(newMinimapW);
            }
        };
        const handleMouseUp = () => {
            setResizingTarget(null);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            lockedCodeSnapWidthRef.current = null;
            lockedPreviewWidthRef.current = null;
            lockedRightPanelWidthRef.current = null;
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
    }, [resizingTarget, splitRatio, showSplitPreview, showCodeSnap, showMinimap, minimapWidth]);

    // --- Font Styles Injection ---
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
                <div onClick={() => onSplit('horizontal')} className="cursor-pointer mb-2 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
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
                        onClick={handleTogglePreview}
                        className={`p-1 rounded-md transition-all ${showSplitPreview ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-white/50 hover:text-slate-600'}`} // adjusted hover
                        title="Toggle Split View"
                    >
                        <Columns size={14} />
                    </button>
                    <button
                        onClick={() => onSplit('horizontal')}
                        className="p-1 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all"
                        title="Split Editor Right"
                    >
                        <SplitSquareHorizontal size={14} />
                    </button>
                    <button
                        onClick={() => onSplit('vertical')}
                        className="p-1 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all"
                        title="Split Editor Down"
                    >
                        <SplitSquareVertical size={14} />
                    </button>
                    <button
                        onClick={onToggleLock}
                        className={`p-1 rounded-md transition-all ${isReadOnly ? 'bg-amber-50 text-amber-600' : 'hover:bg-white/50 hover:text-slate-600'}`}
                        title={isReadOnly ? "Unlock Group" : "Lock Group (Read-Only)"}
                    >
                        <Lock size={14} />
                    </button>

                    <button
                        onClick={handleToggleCodeSnap}
                        className={`p-1 rounded-md transition-all ${showCodeSnap ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-white/50 hover:text-slate-600'}`}
                        title="Code Snap"
                    >
                        <Camera size={14} />
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
            {activePath?.startsWith('typoly://codesnap') ? (
                <div className="flex-1 relative bg-white overflow-hidden">
                    <CodeSnap code={content} language={getDocType(tabs.find(t => t.path === activePath)?.name || '') === 'text' ? 'javascript' : getDocType(tabs.find(t => t.path === activePath)?.name || '')} fileName={tabs.find(t => t.path === activePath)?.name} />
                </div>
            ) : (
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
                                <button onClick={() => setShowLineNumbers(!showLineNumbers)} className={`p-1 rounded ${showLineNumbers ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`} title="Line Numbers"><ListOrdered size={12} /></button>
                                <button onClick={handleToggleMinimap} className={`p-1 rounded ${showMinimap ? 'bg-slate-200 text-slate-800' : 'text-slate-400'}`} title="Minimap"><MapIcon size={12} /></button>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 flex min-h-0 relative" ref={mainContentRef}>

                            {/* Wrapper for Editor + Panel Area */}
                            {(() => {
                                const isRightPanelOpen = showSplitPreview || showCodeSnap;
                                return (
                                    <div className={`transition-all duration-300 h-full flex-1 min-w-0 flex`}>
                                        {/* Primary Editor */}
                                        <div
                                            className={`h-full relative overflow-hidden ${!isSourceMode && (docType === 'markdown' || docType === 'latex') ? 'preview-mode-cm' : ""}`}
                                            style={{ width: isRightPanelOpen ? `${splitRatio * 100}%` : '100%', borderRight: isRightPanelOpen ? '1px solid #e2e8f0' : 'none' }}
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
                                                onUpdate={(viewUpdate) => {
                                                    if (showCodeSnap) {
                                                        if (viewUpdate.selectionSet || viewUpdate.docChanged) {
                                                            const state = viewUpdate.view.state;
                                                            const sel = state.selection.main;
                                                            if (!sel.empty) {
                                                                setSnapCode(state.sliceDoc(sel.from, sel.to));
                                                            } else {
                                                                setSnapCode(state.doc.toString());
                                                            }
                                                        }
                                                    }
                                                }}
                                                basicSetup={{
                                                    lineNumbers: showLineNumbers,
                                                    foldGutter: showLineNumbers,
                                                    highlightActiveLine: true,
                                                }}
                                                className="h-full"
                                            />
                                        </div>

                                        {/* Resizer */}
                                        {isRightPanelOpen && (
                                            <div
                                                className={`w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 h-full shrink-0 -ml-[1px] ${resizingTarget === 'editorSplit' ? 'bg-blue-600' : 'bg-transparent'}`}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setResizingTarget('editorSplit');

                                                    // Capture CodeSnap pixel width if both panels are open (3-column mode)
                                                    if (showSplitPreview && showCodeSnap && mainContentRef.current) {
                                                        const rect = mainContentRef.current.getBoundingClientRect();
                                                        const rightPanelWidth = rect.width * (1 - splitRatio);
                                                        const codeSnapWidth = rightPanelWidth * (1 - rightPanelSplitRatio);
                                                        lockedCodeSnapWidthRef.current = codeSnapWidth;
                                                    }
                                                }}
                                            />
                                        )}

                                        {/* Right Panel Wrapper */}
                                        {isRightPanelOpen && (
                                            <div className="h-full flex overflow-hidden bg-slate-50/50" style={{ width: `${(1 - splitRatio) * 100}%` }}>

                                                {/* Preview Pane */}
                                                {showSplitPreview && (
                                                    <div
                                                        className={`h-full min-w-0 overflow-y-auto border-r border-slate-200 last:border-r-0 ${showCodeSnap ? '' : 'flex-1'}`}
                                                        style={showCodeSnap ? { width: `${rightPanelSplitRatio * 100}%` } : {}}
                                                    >
                                                        {docType === 'typst' ? (
                                                            <TypstPreview content={content} />
                                                        ) : (docType === 'mermaid' || activePath?.endsWith('.mmd')) ? (
                                                            <MermaidPreview content={content} idPrefix={groupId} />
                                                        ) : docType === 'latex' ? (
                                                            <LatexPreview content={content} />
                                                        ) : docType === 'markdown' ? (
                                                            <MarkdownPreview content={content} />
                                                        ) : (
                                                            <div className="h-full relative bg-white flex items-center justify-center text-slate-400 text-sm">
                                                                No preview available
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Internal Resizer */}
                                                {showSplitPreview && showCodeSnap && (
                                                    <div
                                                        className={`w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 h-full shrink-0 -ml-[0.5px] -mr-[0.5px] ${resizingTarget === 'rightPanelSplit' ? 'bg-blue-600' : 'bg-transparent'}`}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setResizingTarget('rightPanelSplit');
                                                            if (mainContentRef.current) {
                                                                const rect = mainContentRef.current.getBoundingClientRect();
                                                                const rightPanelW = rect.width * (1 - splitRatio);
                                                                lockedPreviewWidthRef.current = rightPanelW * rightPanelSplitRatio;
                                                            }
                                                        }}
                                                    />
                                                )}

                                                {/* CodeSnap Pane */}
                                                {showCodeSnap && (
                                                    <div
                                                        className={`h-full min-w-0 overflow-hidden bg-[#1e1e1e] ${showSplitPreview ? '' : 'flex-1'}`}
                                                        style={showSplitPreview ? { width: `${(1 - rightPanelSplitRatio) * 100}%` } : {}}
                                                    >
                                                        <CodeSnap code={snapCode || content} language={docType === 'text' ? 'javascript' : docType} fileName={tabs.find(t => t.path === activePath)?.name} />
                                                    </div>
                                                )}

                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Minimap */}
                            {showMinimap && (
                                <>
                                    <div
                                        className={`w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 h-full shrink-0 -ml-[0.5px] -mr-[0.5px] ${resizingTarget === 'minimap' ? 'bg-blue-600' : 'bg-transparent'}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setResizingTarget('minimap');
                                            if (mainContentRef.current) {
                                                const rect = mainContentRef.current.getBoundingClientRect();
                                                const currentMinimapW = showMinimap ? minimapWidth : 0;
                                                const wrapperW = rect.width - currentMinimapW;
                                                // Capture pixel width of RightPanel
                                                if (showSplitPreview || showCodeSnap) {
                                                    lockedRightPanelWidthRef.current = wrapperW * (1 - splitRatio);
                                                }
                                            }
                                        }}
                                    />
                                    <div className="shrink-0 border-l border-slate-200 bg-slate-50/30 h-full" style={{ width: `${minimapWidth}px` }}>
                                        <MinimapView content={content} scrollContainerId={`scroll-${groupId}`} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Status Bar for this group */}
            <StatusBar
                language={docType}
                groupId={groupId} groupIndex={groupIndex} isActive={isActiveGroup}
            />
        </div>
    );
};
