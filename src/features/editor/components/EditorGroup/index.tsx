import React, { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { Eye, Keyboard, Type, ListOrdered, Map as MapIcon, Code, ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { vim } from "@replit/codemirror-vim";
import { syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { latexLivePreview } from "../../utils/codemirror-latex";

import { Tab } from "../../types";
import { hybridHighlightStyle } from "../../../../shared/config/editor";
import { getLanguageExtension, getLanguageInfo } from "../../../../shared/utils/languageManager";
import { MinimapView } from "./MinimapView";
import { StatusBar, colorSchemes } from "./StatusBar";
import { CodeSnap } from "../CodeSnap";
import { EditorViewStateManager } from "../../hooks/useEditorViewState";
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

// Lazy loading heavy components
const TypstPreview = React.lazy(() => import("./previews/TypstPreview").then(m => ({ default: m.TypstPreview })));
const MermaidPreview = React.lazy(() => import("./previews/MermaidPreview").then(m => ({ default: m.MermaidPreview })));
const MarkdownPreview = React.lazy(() => import("./previews/MarkdownPreview").then(m => ({ default: m.MarkdownPreview })));
const LatexPreview = React.lazy(() => import("./previews/LatexPreview").then(m => ({ default: m.LatexPreview })));
const GenericPreview = React.lazy(() => import("./previews/GenericPreview").then(m => ({ default: m.GenericPreview })));
const ExcalidrawEditor = React.lazy(() => import("./previews/ExcalidrawEditor").then(m => ({ default: m.ExcalidrawEditor })));
const QwertyLearner = React.lazy(() => import("../../../tools/QwertyLearner/QwertyLearner").then(m => ({ default: m.QwertyLearner })));

import { EditorTabs } from "./EditorTabs";
import { EditorBreadcrumbs } from "./EditorBreadcrumbs";
import { EditorEmptyState } from "./EditorEmptyState";
import { GlobalFontStyles } from "./GlobalFontStyles";
import { selectionHighlightExtension } from "../../utils/selectionHighlight";

const hybridTheme = syntaxHighlighting(hybridHighlightStyle);

// --- Resizer Component ---
const ResizeHandle: React.FC<{ className?: string }> = ({ className = '' }) => (
    <PanelResizeHandle
        className={`group relative w-2 bg-transparent flex justify-center items-center transition-colors focus:outline-none outline-none ${className}`}
    >
        {/* Visual Line */}
        <div className="w-[1px] h-full bg-slate-200 group-hover:bg-blue-400 group-active:bg-blue-600 transition-colors" />
    </PanelResizeHandle>
);

interface EditorGroupProps {
    groupId: string;
    groupIndex: number;
    isActiveGroup: boolean;
    tabs: Tab[];
    activePath: string | null;
    content: string;
    isReadOnly: boolean;
    onSwitchTab: (path: string) => void;
    onCloseTab: (e: React.MouseEvent, path: string) => void;
    onContentChange: (value: string) => void;
    onSave: () => void;
    onSplit: (direction?: 'horizontal' | 'vertical') => void;
    maximized?: boolean;
    rootDir: string | null;
    onToggleLock: () => void;
    onCloseGroup?: () => void;
    onOpenFile?: (path: string) => void;
    viewStateManager: EditorViewStateManager;
    onQuickDraw?: () => void;
    onQuickTyping?: () => void;
}

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full text-slate-400">
        <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">Loading component...</span>
        </div>
    </div>
);

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
    onCloseGroup,
    onOpenFile,
    viewStateManager,
    onQuickDraw,
    onQuickTyping
}) => {
    // --- Theme ---
    const scheme = colorSchemes[groupIndex % colorSchemes.length];

    // --- View State from Manager (persistent across layout changes) ---
    const viewState = viewStateManager.getViewState(groupId);
    const { isSourceMode, showSplitPreview, isVimMode, useMonospace, showLineNumbers, showMinimap, minimapWidth, showCodeSnap, editorSize, previewSize, codeSnapSize, isSyncScrollEnabled } = viewState;

    // --- Setters for View State ---
    const setIsSourceMode = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { isSourceMode: val }), [viewStateManager, groupId]);
    const setIsVimMode = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { isVimMode: val }), [viewStateManager, groupId]);
    const setUseMonospace = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { useMonospace: val }), [viewStateManager, groupId]);
    const setShowLineNumbers = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { showLineNumbers: val }), [viewStateManager, groupId]);
    const setShowMinimap = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { showMinimap: val }), [viewStateManager, groupId]);
    const setMinimapWidth = useCallback((val: number) => viewStateManager.setViewState(groupId, { minimapWidth: val }), [viewStateManager, groupId]);
    const toggleSyncScroll = useCallback(() => viewStateManager.setViewState(groupId, { isSyncScrollEnabled: !isSyncScrollEnabled }), [viewStateManager, groupId, isSyncScrollEnabled]);

    // --- Panel Size Handlers ---
    const handlePanelResize = useCallback((sizes: number[]) => {
        // sizes array order: [editor, preview?, codesnap?]
        // Note: react-resizable-panels calls onLayout with the NEW sizes after resize.
        // We just need to persist them to our state.

        const updates: Partial<typeof viewState> = {};

        // The first panel is ALWAYS the editor
        if (sizes.length > 0) {
            updates.editorSize = sizes[0];
        }

        let currentIdx = 1;

        // If preview is open, it takes the next slot
        if (showSplitPreview && currentIdx < sizes.length) {
            updates.previewSize = sizes[currentIdx];
            currentIdx++;
        }

        // If codesnap is open, it takes the next slot
        if (showCodeSnap && currentIdx < sizes.length) {
            updates.codeSnapSize = sizes[currentIdx];
            currentIdx++;
        }

        viewStateManager.setViewState(groupId, updates);
    }, [viewStateManager, groupId, showSplitPreview, showCodeSnap]);

    // --- Content Rendering State ---
    const editorViewRef = useRef<EditorView | null>(null);
    const previewScrollRef = useRef<HTMLDivElement | null>(null);
    const isScrollingRef = useRef<'editor' | 'preview' | null>(null);
    const [snapCode, setSnapCode] = useState<string>('');
    const [toolbarPosition, setToolbarPosition] = useState<'top' | 'bottom'>('top');

    // --- Derived State (Moved Up for dependencies) ---
    const getDocType = useCallback((path: string | null): 'markdown' | 'typst' | 'mermaid' | 'latex' | 'excalidraw' | 'typing' | 'text' => {
        if (!path) return 'text';
        if (path.endsWith('.typ')) return 'typst';
        if (path.endsWith('.md')) return 'markdown';
        if (path.endsWith('.mmd') || path.endsWith('.mermaid')) return 'mermaid';
        if (path.endsWith('.excalidraw') || path.endsWith('.excalidraw.json')) return 'excalidraw';
        if (path.endsWith('.tex') || path.endsWith('.latex')) return 'latex';
        if (path.includes('typing-practice')) return 'typing';
        return 'text';
    }, []);

    const docType = getDocType(activePath);

    // --- Sync Scroll Logic ---
    const handleSyncPreview = useCallback(() => {
        if (!isSyncScrollEnabled) return;

        const editorScroller = editorViewRef.current?.scrollDOM;
        const previewScroller = previewScrollRef.current;
        if (!editorScroller || !previewScroller || isScrollingRef.current === 'preview') return;

        isScrollingRef.current = 'editor';

        if (docType === 'markdown') {
            const view = editorViewRef.current;
            if (view) {
                // Get the line number at the top of the viewport
                const scrollTop = editorScroller.scrollTop;
                // Add half viewport height to center correlation or use 0 for top-sync. VS Code uses top.
                const lineBlock = view.lineBlockAtHeight(scrollTop);
                const lineNum = view.state.doc.lineAt(lineBlock.from).number;

                // Find closest element in preview
                const elements = previewScroller.querySelectorAll('[data-sourcepos]');
                let bestElement: HTMLElement | null = null;

                // Simple linear search is fast enough for most docs.
                // For massive docs, we might want to optimize, but DOM access is the bottleneck anyway.
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i] as HTMLElement;
                    const parts = el.dataset.sourcepos?.split(':');
                    if (parts && parseInt(parts[0]) >= lineNum) {
                        bestElement = el;
                        break;
                    }
                }

                if (bestElement) {
                    // Scroll to element with some padding
                    previewScroller.scrollTo({ top: bestElement.offsetTop - 20, behavior: 'auto' });
                }
            } else {
                // Fallback if view not ready (rare)
            }
        } else {
            // Percentage-based fallback for other types
            const percentage = editorScroller.scrollTop / (editorScroller.scrollHeight - editorScroller.clientHeight);
            if (percentage > 0.99) {
                previewScroller.scrollTop = previewScroller.scrollHeight;
            } else {
                previewScroller.scrollTop = percentage * (previewScroller.scrollHeight - previewScroller.clientHeight);
            }
        }

        setTimeout(() => { if (isScrollingRef.current === 'editor') isScrollingRef.current = null; }, 100);
    }, [isSyncScrollEnabled, docType]);

    const handleSyncEditor = useCallback(() => {
        if (!isSyncScrollEnabled) return;

        const editorScroller = editorViewRef.current?.scrollDOM;
        const previewScroller = previewScrollRef.current;
        if (!editorScroller || !previewScroller || isScrollingRef.current === 'editor') return;

        isScrollingRef.current = 'preview';

        if (docType === 'markdown') {
            const scrollTop = previewScroller.scrollTop;
            // Find element at this scroll position
            // Using elementFromPoint is risky because it relies on layout.
            // Better to iterate children and find the one crossing scrollTop.
            // Or find the first element with offsetTop > scrollTop.
            const elements = previewScroller.querySelectorAll('[data-sourcepos]');
            let bestLine = 1;

            for (let i = 0; i < elements.length; i++) {
                const el = elements[i] as HTMLElement;
                if (el.offsetTop + el.offsetHeight > scrollTop) {
                    // This element is likely visible
                    const parts = el.dataset.sourcepos?.split(':');
                    if (parts) {
                        bestLine = parseInt(parts[0]);
                        break;
                    }
                }
            }

            const view = editorViewRef.current;
            if (view && bestLine > 1) {
                const lineInfo = view.state.doc.line(Math.min(bestLine, view.state.doc.lines));
                // Scroll editor to this line
                const block = view.lineBlockAt(lineInfo.from);
                editorScroller.scrollTo({ top: block.top, behavior: 'auto' });
            }

        } else {
            const percentage = previewScroller.scrollTop / (previewScroller.scrollHeight - previewScroller.clientHeight);
            if (percentage > 0.99) {
                editorScroller.scrollTop = editorScroller.scrollHeight;
            } else {
                editorScroller.scrollTop = percentage * (editorScroller.scrollHeight - editorScroller.clientHeight);
            }
        }

        setTimeout(() => { if (isScrollingRef.current === 'preview') isScrollingRef.current = null; }, 100);
    }, [isSyncScrollEnabled, docType]);

    useEffect(() => {
        const editorScroller = editorViewRef.current?.scrollDOM;
        const previewScroller = previewScrollRef.current;

        if (!editorScroller || !previewScroller) return;

        editorScroller.addEventListener('scroll', handleSyncPreview);
        previewScroller.addEventListener('scroll', handleSyncEditor);

        // Initial sync
        handleSyncPreview();

        return () => {
            editorScroller.removeEventListener('scroll', handleSyncPreview);
            previewScroller.removeEventListener('scroll', handleSyncEditor);
        };
    }, [handleSyncPreview, handleSyncEditor, showSplitPreview]);

    const languageName = getLanguageInfo(activePath).name;

    // --- Memoized CodeMirror Extensions (Critical Performance Optimization) ---
    const editorExtensions = useMemo(() => [
        ...getLanguageExtension(activePath),
        ...(isVimMode ? [vim({ status: true })] : []),
        ...(docType === 'latex' && !isSourceMode ? [latexLivePreview()] : []),
        // Line wrapping for all modes, plus visual styling for visual mode
        EditorView.lineWrapping,
        selectionHighlightExtension,
        ...(!isSourceMode && (docType === 'markdown' || docType === 'latex') ? [hybridTheme] : [])
    ], [activePath, isVimMode, docType, isSourceMode]);

    // --- Toggle Handlers with Smart Resizing ---
    const handleToggleMinimap = useCallback(() => {
        setShowMinimap(!showMinimap);
    }, [showMinimap, setShowMinimap]);

    const handleTogglePreview = useCallback(() => {
        if (!showSplitPreview) {
            // Opening preview - adjust sizes to make room
            const newEditorSize = showCodeSnap ? 40 : 50;
            const newPreviewSize = showCodeSnap ? 30 : 50;
            viewStateManager.setViewState(groupId, {
                showSplitPreview: true,
                editorSize: newEditorSize,
                previewSize: newPreviewSize
            });
        } else {
            // Closing preview - give space back to editor
            const newEditorSize = showCodeSnap ? 70 : 100;
            viewStateManager.setViewState(groupId, {
                showSplitPreview: false,
                editorSize: newEditorSize
            });
        }
    }, [showSplitPreview, showCodeSnap, viewStateManager, groupId]);

    const handleExportPdf = useCallback(async () => {
        try {
            if (docType === 'typst') {
                const filePath = await save({
                    filters: [{
                        name: 'PDF Document',
                        extensions: ['pdf'],
                    }],
                    defaultPath: activePath ? activePath.replace(/\.[^/.]+$/, "") + ".pdf" : "document.pdf"
                });

                if (!filePath) return;

                await invoke('typst_export_pdf', {
                    content: content,
                    filePath: activePath || null,
                    savePath: filePath
                });
            } else {
                const previewContainer = document.getElementById(`group-${groupId}-preview-container`);

                if (previewContainer) {
                    // Create a dedicated print host outside the app root
                    const printHost = document.createElement('div');
                    printHost.className = 'print-host';

                    // Clone the content to ensure we don't mess with the live React/Editor DOM
                    const content = previewContainer.cloneNode(true) as HTMLElement;

                    // Reset layout constraints on the cloned content
                    content.style.height = 'auto';
                    content.style.overflow = 'visible';
                    content.style.position = 'relative';
                    content.style.transform = 'none';

                    printHost.appendChild(content);
                    document.body.appendChild(printHost);
                    document.body.classList.add('printing-mode');

                    // Allow a brief moment for styles to apply before printing
                    setTimeout(() => {
                        window.print();

                        // Cleanup after print dialog closes
                        document.body.classList.remove('printing-mode');
                        if (document.body.contains(printHost)) {
                            document.body.removeChild(printHost);
                        }
                    }, 50);
                }
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export PDF: " + error);
        }
    }, [activePath, content, docType, groupId]);

    const handleToggleCodeSnap = useCallback(() => {
        if (!showCodeSnap) {
            // Opening CodeSnap - capture selection and adjust sizes
            const sel = editorViewRef.current?.state.selection.main;
            const textRaw = sel && !sel.empty
                ? editorViewRef.current?.state.sliceDoc(sel.from, sel.to)
                : ''; // Default to empty if nothing selected
            setSnapCode(textRaw || '');

            // Adjust sizes
            const newEditorSize = showSplitPreview ? 40 : 65;
            const newPreviewSize = showSplitPreview ? 30 : previewSize;
            const newCodeSnapSize = showSplitPreview ? 30 : 35;
            viewStateManager.setViewState(groupId, {
                showCodeSnap: true,
                editorSize: newEditorSize,
                previewSize: newPreviewSize,
                codeSnapSize: newCodeSnapSize
            });
        } else {
            // Closing CodeSnap - redistribute space
            const newEditorSize = showSplitPreview ? 50 : 100;
            const newPreviewSize = showSplitPreview ? 50 : previewSize;
            viewStateManager.setViewState(groupId, {
                showCodeSnap: false,
                editorSize: newEditorSize,
                previewSize: newPreviewSize
            });
        }
    }, [showCodeSnap, showSplitPreview, content, previewSize, viewStateManager, groupId]);

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        if (!isActiveGroup) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if this group is active
            const isMod = e.ctrlKey || e.metaKey;
            const isShift = e.shiftKey;

            // Ctrl+S - Save
            if (isMod && e.key === 's' && !isShift) {
                e.preventDefault();
                onSave();
                return;
            }

            // Ctrl+\ - Toggle Preview
            if (isMod && e.key === '\\') {
                e.preventDefault();
                handleTogglePreview();
                return;
            }

            // Ctrl+Shift+M - Toggle Minimap
            if (isMod && isShift && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                handleToggleMinimap();
                return;
            }

            // Ctrl+Shift+C - Toggle CodeSnap
            if (isMod && isShift && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                handleToggleCodeSnap();
                return;
            }

            // Ctrl+Shift+V - Toggle Vim Mode
            if (isMod && isShift && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                setIsVimMode(!isVimMode);
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActiveGroup, onSave, handleTogglePreview, handleToggleMinimap, handleToggleCodeSnap, isVimMode, setIsVimMode]);

    // --- Render Preview Content ---
    const renderPreviewContent = useCallback(() => {
        const commonProps = {
            content,
            onRef: (el: HTMLDivElement | null) => { previewScrollRef.current = el; },
            isSyncScroll: isSyncScrollEnabled,
            onToggleSyncScroll: toggleSyncScroll,
            onExportPdf: handleExportPdf
        };

        if (docType === 'typst') return <TypstPreview filePath={activePath} className="h-full overflow-auto" {...commonProps} />;
        if (docType === 'mermaid' || activePath?.endsWith('.mmd')) return <MermaidPreview idPrefix={groupId} {...commonProps} />;
        if (docType === 'latex') return <LatexPreview {...commonProps} />;
        if (docType === 'markdown') return <MarkdownPreview className="h-full" fileName={activePath?.split(/[/\\]/).pop()} {...commonProps} onUpdate={handleSyncPreview} />;

        // Generic Source Preview
        return <GenericPreview filePath={activePath} {...commonProps} />;
        if (docType === 'mermaid' || activePath?.endsWith('.mmd')) return <MermaidPreview idPrefix={groupId} {...commonProps} />;
        if (docType === 'latex') return <LatexPreview {...commonProps} />;
        if (docType === 'markdown') return <MarkdownPreview className="h-full" fileName={activePath?.split(/[/\\]/).pop()} {...commonProps} />;

        // Generic Source Preview
        return <GenericPreview filePath={activePath} {...commonProps} />;
    }, [docType, content, activePath, groupId, isSyncScrollEnabled, toggleSyncScroll, handleExportPdf]);

    // --- Empty State ---
    if (!activePath) {
        return <EditorEmptyState onCloseGroup={onCloseGroup} useMonospace={useMonospace} />;
    }


    // --- Render Toolbar Content ---
    const renderEditorToolbar = () => (
        <div className={`flex justify-end px-2 py-0.5 bg-white border-slate-200 z-10 w-full ${toolbarPosition === 'top' ? 'border-b' : 'border-t'}`}>
            <div className="flex items-center gap-0.5 bg-slate-50/50 border border-slate-200 rounded-lg p-0.5 shadow-sm">
                {/* Edit Mode Toggle */}
                <div className="flex items-center bg-slate-100 rounded-md p-0.5">
                    <button
                        onClick={() => setIsSourceMode(true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${isSourceMode ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Source Mode - Edit raw code"
                    >
                        <Code size={12} className="inline mr-1" />Source
                    </button>
                    <button
                        onClick={() => setIsSourceMode(false)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${!isSourceMode ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Visual Mode - Styled editing"
                    >
                        <Eye size={12} className="inline mr-1" />Visual
                    </button>
                </div>

                <div className="w-[1px] h-3 bg-slate-200 mx-1" />

                {/* Editor Options */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => setUseMonospace(!useMonospace)}
                        className={`p-1 rounded-md transition-all ${useMonospace ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        title={`Font: ${useMonospace ? 'Monospace' : 'Sans-serif'}`}
                    ><Type size={13} /></button>
                    <button
                        onClick={() => setIsVimMode(!isVimMode)}
                        className={`p-1 rounded-md transition-all ${isVimMode ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        title={`Vim Mode: ${isVimMode ? 'ON' : 'OFF'} (Ctrl+Shift+V)`}
                    ><Keyboard size={13} /></button>
                    <button
                        onClick={() => setShowLineNumbers(!showLineNumbers)}
                        className={`p-1 rounded-md transition-all ${showLineNumbers ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        title={`Line Numbers: ${showLineNumbers ? 'ON' : 'OFF'}`}
                    ><ListOrdered size={13} /></button>
                    <button
                        onClick={handleToggleMinimap}
                        className={`p-1 rounded-md transition-all ${showMinimap ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        title={`Minimap: ${showMinimap ? 'ON' : 'OFF'} (Ctrl+Shift+M)`}
                    ><MapIcon size={13} /></button>
                    <button
                        onClick={() => setToolbarPosition(pos => pos === 'top' ? 'bottom' : 'top')}
                        className="p-1 rounded-md transition-all text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        title={`Move toolbar to ${toolbarPosition === 'top' ? 'bottom' : 'top'}`}
                    >
                        {toolbarPosition === 'top' ? <ArrowDownToLine size={13} /> : <ArrowUpToLine size={13} />}
                    </button>
                </div>
            </div>
        </div>
    );

    // --- Determine Panel Visibility ---
    const hasRightPanels = showSplitPreview || showCodeSnap;

    return (
        <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 border-r border-slate-200 last:border-r-0">
            <GlobalFontStyles useMonospace={useMonospace} />

            <EditorTabs
                tabs={tabs}
                activePath={activePath}
                onSwitchTab={onSwitchTab}
                onCloseTab={onCloseTab}
                scheme={scheme}
                showSplitPreview={showSplitPreview}
                onTogglePreview={handleTogglePreview}
                onSplit={onSplit}
                isReadOnly={isReadOnly}
                onToggleLock={onToggleLock}
                showCodeSnap={showCodeSnap}
                onToggleCodeSnap={handleToggleCodeSnap}
                onSave={onSave}
                onCloseGroup={onCloseGroup}
                onQuickDraw={onQuickDraw}
                onQuickTyping={onQuickTyping}
            />

            <EditorBreadcrumbs
                activePath={activePath}
                rootDir={rootDir}
                onSwitchTab={onSwitchTab}
                onOpenFile={onOpenFile}
            />

            {/* Editor Area - Enforce rounded top corner to match the detached tab feel if desired, or keep flat */}
            {activePath?.startsWith('typoly://codesnap') ? (
                <div className="flex-1 relative bg-white overflow-hidden shadow-sm border-t border-slate-200/50">
                    <CodeSnap
                        code={content}
                        fileName={tabs.find(t => t.path === activePath)?.name}
                    />
                </div>
            ) : docType === 'excalidraw' ? (
                <div className="flex-1 relative bg-white overflow-hidden shadow-sm border-t border-slate-200/50">
                    <React.Suspense fallback={<LoadingFallback />}>
                        <ExcalidrawEditor
                            content={content}
                            onChange={onContentChange}
                            theme="light"
                        />
                    </React.Suspense>
                </div>
            ) : docType === 'typing' ? (
                <div className="flex-1 relative bg-white overflow-hidden shadow-sm border-t border-slate-200/50">
                    <React.Suspense fallback={<LoadingFallback />}>
                        {(() => {
                            let props = {};
                            try {
                                props = JSON.parse(content || '{}');
                            } catch (e) {
                                // Support legacy string content or invalid JSON
                                console.warn('Invalid typing config', e);
                            }
                            return <QwertyLearner {...props} />;
                        })()}
                    </React.Suspense>
                </div>
            ) : (
                <div className="flex-1 relative bg-white overflow-hidden shadow-sm border-t border-slate-200/50" id={`scroll-${groupId}`}>
                    <div className="flex min-h-full w-full h-full flex-col">
                        {toolbarPosition === 'top' && renderEditorToolbar()}

                        {/* Main Content Area with Resizable Panels */}
                        <div className="flex-1 min-w-0 flex min-h-0 relative">
                            <PanelGroup
                                direction="horizontal"
                                onLayout={handlePanelResize}
                                className="flex-1"
                                autoSaveId={`group-${groupId}-layout`}
                            >
                                {/* Editor Panel */}
                                <Panel
                                    defaultSize={hasRightPanels ? editorSize : 100}
                                    minSize={20}
                                    id="editor"
                                    order={1}
                                >
                                    <div className={`h-full relative overflow-hidden
                                        ${!isSourceMode ? 'preview-mode-cm' : ''}
                                        ${!showLineNumbers ? 'cm-no-numbers' : ''}
                                    `}>
                                        <CodeMirror
                                            value={content}
                                            height="100%"
                                            extensions={editorExtensions}
                                            onChange={onContentChange}
                                            theme="light"
                                            readOnly={isReadOnly}
                                            onCreateEditor={(view) => {
                                                editorViewRef.current = view;
                                            }}
                                            onUpdate={(viewUpdate) => {
                                                if (showCodeSnap && (viewUpdate.selectionSet || viewUpdate.docChanged)) {
                                                    const state = viewUpdate.view.state;
                                                    const sel = state.selection.main;
                                                    const newSnap = sel.empty ? '' : state.sliceDoc(sel.from, sel.to);
                                                    setSnapCode(newSnap);
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
                                </Panel>

                                {/* Preview Panel */}
                                {showSplitPreview && (
                                    <>
                                        <ResizeHandle />
                                        <Panel
                                            defaultSize={previewSize}
                                            minSize={15}
                                            id="preview"
                                            order={2}
                                        >
                                            <div id={`group-${groupId}-preview-container`} className="h-full overflow-hidden border-l border-slate-200 bg-white">
                                                <React.Suspense fallback={<LoadingFallback />}>
                                                    {renderPreviewContent()}
                                                </React.Suspense>
                                            </div>
                                        </Panel>
                                    </>
                                )}

                                {/* CodeSnap Panel */}
                                {showCodeSnap && (
                                    <>
                                        <ResizeHandle />
                                        <Panel
                                            defaultSize={codeSnapSize}
                                            minSize={15}
                                            id="codesnap"
                                            order={showSplitPreview ? 3 : 2}
                                        >
                                            <div className="h-full overflow-hidden border-l border-slate-200 bg-[#1e1e1e]">
                                                <CodeSnap
                                                    code={snapCode}
                                                    fileName={tabs.find(t => t.path === activePath)?.name}
                                                    renderPreview={(previewCode, isDark, scale) => {
                                                        const baseClass = "h-auto overflow-visible p-4";
                                                        const themeClass = isDark ? "bg-[#282a36] text-gray-300" : "bg-white text-slate-900";

                                                        if (docType === 'markdown') return <MarkdownPreview content={previewCode} className={`${baseClass} ${isDark ? 'bg-[#282a36] prose-invert' : 'bg-white'}`} showActions={false} scale={scale} />;
                                                        if (docType === 'typst') return <TypstPreview content={previewCode} isDark={isDark} filePath={activePath} className={`${baseClass} ${themeClass}`} showActions={false} scale={scale} />;
                                                        if (docType === 'mermaid') return <MermaidPreview content={previewCode} isDark={isDark} idPrefix={`snap-${groupId}`} className={`${baseClass} ${themeClass}`} showActions={false} scale={scale} />;
                                                        if (docType === 'latex') return <LatexPreview content={previewCode} className={`${baseClass} ${themeClass}`} showActions={false} scale={scale} />;

                                                        // Generic Code Preview
                                                        return (
                                                            <div className={`h-full ${isDark ? 'bg-[#282a36]' : 'bg-white'}`}>
                                                                <CodeMirror
                                                                    value={previewCode}
                                                                    extensions={[
                                                                        ...getLanguageExtension(activePath),
                                                                        EditorView.editable.of(false),
                                                                        EditorView.lineWrapping,
                                                                        ...(isDark ? [hybridTheme] : [])
                                                                    ]}
                                                                    theme={isDark ? 'dark' : 'light'}
                                                                    basicSetup={{
                                                                        lineNumbers: false,
                                                                        foldGutter: false,
                                                                        highlightActiveLine: false,
                                                                    }}
                                                                    className="h-full text-sm font-mono"
                                                                />
                                                            </div>
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </Panel>
                                    </>
                                )}
                            </PanelGroup>

                            {/* Minimap (Outside PanelGroup - fixed width) */}
                            {showMinimap && (
                                <div
                                    className="shrink-0 border-l border-slate-200 bg-slate-50/30 h-full relative"
                                    style={{ width: `${minimapWidth}px` }}
                                >
                                    {/* Minimap Resize Handle (manual for fixed-width minimap) */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            const startX = e.clientX;
                                            const startWidth = minimapWidth;

                                            const onMouseMove = (moveEvent: MouseEvent) => {
                                                const delta = startX - moveEvent.clientX;
                                                const newWidth = Math.max(50, Math.min(300, startWidth + delta));
                                                setMinimapWidth(newWidth);
                                            };

                                            const onMouseUp = () => {
                                                document.removeEventListener('mousemove', onMouseMove);
                                                document.removeEventListener('mouseup', onMouseUp);
                                                document.body.style.cursor = '';
                                                document.body.style.userSelect = '';
                                            };

                                            document.addEventListener('mousemove', onMouseMove);
                                            document.addEventListener('mouseup', onMouseUp);
                                            document.body.style.cursor = 'col-resize';
                                            document.body.style.userSelect = 'none';
                                        }}
                                    />
                                    <MinimapView content={content} scrollContainerId={`scroll-${groupId}`} />
                                </div>
                            )}
                        </div>

                        {toolbarPosition === 'bottom' && renderEditorToolbar()}

                        <StatusBar
                            language={languageName}
                            groupId={groupId}
                            groupIndex={groupIndex}
                            isActive={isActiveGroup}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
