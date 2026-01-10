import React, { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { Eye, Keyboard, Type, ListOrdered, Map as MapIcon, Code } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { vim } from "@replit/codemirror-vim";
import { syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { latexLivePreview } from "../utils/codemirror-latex";

import { Tab } from "../types";
import { hybridHighlightStyle } from "../config/editor";
import { getLanguageExtension, getLanguageInfo } from "../utils/languageManager";
import { MinimapView } from "./MinimapView";
import { StatusBar, colorSchemes } from "./StatusBar";
import { CodeSnap } from "./CodeSnap";
import { EditorViewStateManager } from "../hooks/useEditorViewState";

import { TypstPreview } from "./previews/TypstPreview";
import { MermaidPreview } from "./previews/MermaidPreview";
import { MarkdownPreview } from "./previews/MarkdownPreview";
import { LatexPreview } from "./previews/LatexPreview";

import { EditorTabs } from "./editor/EditorTabs";
import { EditorBreadcrumbs } from "./editor/EditorBreadcrumbs";
import { EditorEmptyState } from "./editor/EditorEmptyState";
import { GlobalFontStyles } from "./editor/GlobalFontStyles";

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
    onCloseGroup,
    onOpenFile,
    viewStateManager
}) => {
    // --- Theme ---
    const scheme = colorSchemes[groupIndex % colorSchemes.length];

    // --- View State from Manager (persistent across layout changes) ---
    const viewState = viewStateManager.getViewState(groupId);
    const { isSourceMode, showSplitPreview, isVimMode, useMonospace, showLineNumbers, showMinimap, minimapWidth, showCodeSnap, editorSize, previewSize, codeSnapSize } = viewState;

    // --- Setters for View State ---
    const setIsSourceMode = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { isSourceMode: val }), [viewStateManager, groupId]);
    const setIsVimMode = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { isVimMode: val }), [viewStateManager, groupId]);
    const setUseMonospace = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { useMonospace: val }), [viewStateManager, groupId]);
    const setShowLineNumbers = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { showLineNumbers: val }), [viewStateManager, groupId]);
    const setShowMinimap = useCallback((val: boolean) => viewStateManager.setViewState(groupId, { showMinimap: val }), [viewStateManager, groupId]);
    const setMinimapWidth = useCallback((val: number) => viewStateManager.setViewState(groupId, { minimapWidth: val }), [viewStateManager, groupId]);

    // --- Panel Size Handlers ---
    const handlePanelResize = useCallback((sizes: number[]) => {
        // sizes array order: [editor, preview?, codesnap?]
        const updates: Partial<typeof viewState> = { editorSize: sizes[0] };
        let idx = 1;
        if (showSplitPreview && sizes[idx] !== undefined) {
            updates.previewSize = sizes[idx];
            idx++;
        }
        if (showCodeSnap && sizes[idx] !== undefined) {
            updates.codeSnapSize = sizes[idx];
        }
        viewStateManager.setViewState(groupId, updates);
    }, [viewStateManager, groupId, showSplitPreview, showCodeSnap]);

    // --- Content Rendering State ---
    const editorViewRef = useRef<EditorView | null>(null);
    const [snapCode, setSnapCode] = useState<string>('');

    // --- Derived State ---
    const getDocType = useCallback((path: string | null): 'markdown' | 'typst' | 'mermaid' | 'latex' | 'text' => {
        if (!path) return 'text';
        if (path.endsWith('.typ')) return 'typst';
        if (path.endsWith('.md')) return 'markdown';
        if (path.endsWith('.mmd') || path.endsWith('.mermaid')) return 'mermaid';
        if (path.endsWith('.tex') || path.endsWith('.latex')) return 'latex';
        return 'text';
    }, []);

    const docType = getDocType(activePath);
    const languageName = getLanguageInfo(activePath).name;

    // --- Memoized CodeMirror Extensions (Critical Performance Optimization) ---
    const editorExtensions = useMemo(() => [
        ...getLanguageExtension(activePath),
        ...(isVimMode ? [vim({ status: true })] : []),
        ...(docType === 'latex' && !isSourceMode ? [latexLivePreview()] : []),
        // Line wrapping for all modes, plus visual styling for visual mode
        EditorView.lineWrapping,
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
        if (docType === 'typst') return <TypstPreview content={content} className="h-full overflow-auto" />;
        if (docType === 'mermaid' || activePath?.endsWith('.mmd')) return <MermaidPreview content={content} idPrefix={groupId} />;
        if (docType === 'latex') return <LatexPreview content={content} />;
        if (docType === 'markdown') return <MarkdownPreview content={content} className="h-full" />;

        // Generic Source Preview
        return (
            <div className="h-full relative bg-slate-50">
                <CodeMirror
                    value={content}
                    height="100%"
                    extensions={[
                        ...getLanguageExtension(activePath),
                        EditorView.editable.of(false),
                        EditorView.lineWrapping
                    ]}
                    theme="light"
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: false,
                    }}
                    className="h-full text-sm"
                />
            </div>
        );
    }, [docType, content, activePath, groupId]);

    // --- Empty State ---
    if (!activePath) {
        return <EditorEmptyState onCloseGroup={onCloseGroup} useMonospace={useMonospace} />;
    }

    // --- Determine Panel Visibility ---
    const hasRightPanels = showSplitPreview || showCodeSnap;

    return (
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white border-r border-slate-200 last:border-r-0">
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
            />

            <EditorBreadcrumbs
                activePath={activePath}
                rootDir={rootDir}
                onSwitchTab={onSwitchTab}
                onOpenFile={onOpenFile}
            />

            {/* Editor Area */}
            {activePath?.startsWith('typoly://codesnap') ? (
                <div className="flex-1 relative bg-white overflow-hidden">
                    <CodeSnap
                        code={content}
                        fileName={tabs.find(t => t.path === activePath)?.name}
                    />
                </div>
            ) : (
                <div className="flex-1 relative bg-white overflow-hidden" id={`scroll-${groupId}`}>
                    <div className="flex min-h-full w-full h-full flex-col">
                        {/* View Controls Overlay */}
                        <div className="sticky top-0 z-20 flex justify-end px-2 py-1 pointer-events-none">
                            <div className="pointer-events-auto flex items-center gap-0.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-1 shadow-sm">
                                {/* Edit Mode Toggle */}
                                <div className="flex items-center bg-slate-100 rounded-md p-0.5">
                                    <button
                                        onClick={() => setIsSourceMode(true)}
                                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${isSourceMode ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Source Mode - Edit raw code"
                                    >
                                        <Code size={12} className="inline mr-1" />Source
                                    </button>
                                    <button
                                        onClick={() => setIsSourceMode(false)}
                                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${!isSourceMode ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Visual Mode - Styled editing"
                                    >
                                        <Eye size={12} className="inline mr-1" />Visual
                                    </button>
                                </div>

                                <div className="w-[1px] h-4 bg-slate-200 mx-1" />

                                {/* Editor Options */}
                                <div className="flex items-center gap-0.5">
                                    <button
                                        onClick={() => setUseMonospace(!useMonospace)}
                                        className={`p-1.5 rounded-md transition-all ${useMonospace ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                        title={`Font: ${useMonospace ? 'Monospace' : 'Sans-serif'}`}
                                    ><Type size={13} /></button>
                                    <button
                                        onClick={() => setIsVimMode(!isVimMode)}
                                        className={`p-1.5 rounded-md transition-all ${isVimMode ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                        title={`Vim Mode: ${isVimMode ? 'ON' : 'OFF'} (Ctrl+Shift+V)`}
                                    ><Keyboard size={13} /></button>
                                    <button
                                        onClick={() => setShowLineNumbers(!showLineNumbers)}
                                        className={`p-1.5 rounded-md transition-all ${showLineNumbers ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                        title={`Line Numbers: ${showLineNumbers ? 'ON' : 'OFF'}`}
                                    ><ListOrdered size={13} /></button>
                                    <button
                                        onClick={handleToggleMinimap}
                                        className={`p-1.5 rounded-md transition-all ${showMinimap ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                        title={`Minimap: ${showMinimap ? 'ON' : 'OFF'} (Ctrl+Shift+M)`}
                                    ><MapIcon size={13} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area with Resizable Panels */}
                        <div className="flex-1 min-w-0 flex min-h-0 relative">
                            <PanelGroup
                                direction="horizontal"
                                onLayout={handlePanelResize}
                                className="flex-1"
                            >
                                {/* Editor Panel */}
                                <Panel
                                    defaultSize={hasRightPanels ? editorSize : 100}
                                    minSize={20}
                                    id="editor"
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
                                        >
                                            <div className="h-full overflow-hidden border-l border-slate-200 bg-white">
                                                {renderPreviewContent()}
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
                                        >
                                            <div className="h-full overflow-hidden border-l border-slate-200 bg-[#1e1e1e]">
                                                <CodeSnap
                                                    code={snapCode}
                                                    fileName={tabs.find(t => t.path === activePath)?.name}
                                                    renderPreview={(previewCode, isDark) => {
                                                        const baseClass = "h-auto overflow-visible p-4";
                                                        const themeClass = isDark ? "bg-[#282a36] text-gray-300" : "bg-white text-slate-900";

                                                        if (docType === 'markdown') return <MarkdownPreview content={previewCode} className={`${baseClass} ${isDark ? 'bg-[#282a36] prose-invert' : 'bg-white'}`} />;
                                                        if (docType === 'typst') return <TypstPreview content={previewCode} isDark={isDark} className={`${baseClass} ${themeClass}`} />;
                                                        if (docType === 'mermaid') return <MermaidPreview content={previewCode} isDark={isDark} idPrefix={`snap-${groupId}`} className={`${baseClass} ${themeClass}`} />;
                                                        if (docType === 'latex') return <LatexPreview content={previewCode} className={`${baseClass} ${themeClass}`} />;

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
