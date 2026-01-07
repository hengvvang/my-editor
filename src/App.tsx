import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open, save } from "@tauri-apps/api/dialog";
import { appWindow } from "@tauri-apps/api/window";
import { FileText, Folder, FolderOpen, Save, ChevronRight, ChevronDown, Menu, Code, Eye, Keyboard, Minus, Square, X, BookOpen, TextCursorInput, Search, ListTree, Files, ListOrdered, Map as MapIcon } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { markdown as markdownLang } from '@codemirror/lang-markdown';
import { vim } from "@replit/codemirror-vim";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t, styleTags } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

import "./styles.css";

// --- Types ---
interface FileEntry {
    name: string;
    path: string;
    is_dir: boolean;
}

interface Tab {
    path: string;
    name: string;
    content: string;
    originalContent: string;
    isDirty: boolean;
    scrollPos?: number;
}

// --- Components ---

const SidebarItem = ({
    entry,
    level,
    onSelect
}: {
    entry: FileEntry,
    level: number,
    onSelect: (entry: FileEntry) => void
}) => {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileEntry[]>([]);

    const handleExpand = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!entry.is_dir) return;

        if (!expanded) {
            try {
                const files = await invoke<FileEntry[]>("read_dir", { path: entry.path });
                setChildren(files);
            } catch (err) {
                console.error("Failed to read dir", err);
            }
        }
        setExpanded(!expanded);
    }

    return (
        <div>
            <div
                className="flex items-center gap-2 p-1 hover:bg-gray-200 cursor-pointer text-sm truncate"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => entry.is_dir ? handleExpand({ stopPropagation: () => { } } as any) : onSelect(entry)}
            >
                {entry.is_dir ? (
                    <span onClick={handleExpand} className="p-0.5 hover:bg-gray-300 rounded">
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                ) : <span className="w-4" />}

                {entry.is_dir ? <Folder size={16} className="text-blue-400" /> : <FileText size={16} className="text-gray-500" />}
                <span className="truncate">{entry.name}</span>
            </div>
            {expanded && children.map(child => (
                <SidebarItem key={child.path} entry={child} level={level + 1} onSelect={onSelect} />
            ))}
        </div>
    );
};

// --- Minimap Component ---
const MinimapView: React.FC<{ content: string; scrollContainerId: string }> = ({ content, scrollContainerId }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [viewportBox, setViewportBox] = React.useState({ top: 0, height: 100 });
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartRef = React.useRef({ y: 0, scrollTop: 0 });
    const [highlightInfo, setHighlightInfo] = React.useState<{ activeLine: number; selection: { from: number; to: number } | null }>({
        activeLine: -1,
        selection: null
    });

    // Poll editor state for active line and selection
    React.useEffect(() => {
        const pollInterval = setInterval(() => {
            const editorElement = document.querySelector('.cm-editor');
            if (!editorElement) return;

            // Get active line
            const activeLine = editorElement.querySelector('.cm-activeLine');
            if (activeLine) {
                const allLines = Array.from(editorElement.querySelectorAll('.cm-line'));
                const activeLineIndex = allLines.indexOf(activeLine as Element);

                // Get selection info from DOM
                const selection = window.getSelection();
                let selectionInfo = null;

                if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
                    const range = selection.getRangeAt(0);
                    const startLine = allLines.findIndex(line => line.contains(range.startContainer));
                    const endLine = allLines.findIndex(line => line.contains(range.endContainer));

                    if (startLine !== -1 && endLine !== -1) {
                        selectionInfo = { from: startLine, to: endLine };
                    }
                }

                setHighlightInfo({
                    activeLine: activeLineIndex,
                    selection: selectionInfo
                });
            }
        }, 100);

        return () => clearInterval(pollInterval);
    }, []);

    // Render minimap content
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = 120;
        const height = containerRef.current?.clientHeight || 600;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, width, height);

        // Draw content - simplified text representation
        const lines = content.split('\n');
        const lineHeight = 2; // Very small line height for minimap
        const fontSize = 2; // Tiny font size
        const leftMargin = 8; // Match editor left margin proportionally

        ctx.font = `${fontSize}px monospace`;

        lines.forEach((line, index) => {
            const y = index * lineHeight;
            if (y > height) return;

            // Draw selection highlight (yellow background)
            if (highlightInfo.selection && index >= highlightInfo.selection.from && index <= highlightInfo.selection.to) {
                ctx.fillStyle = 'rgba(251, 191, 36, 0.3)'; // amber-400 with transparency
                ctx.fillRect(0, y, width, lineHeight);
            }

            // Draw active line highlight (blue background) - renders on top of selection
            if (index === highlightInfo.activeLine) {
                ctx.fillStyle = 'rgba(96, 165, 250, 0.25)'; // blue-400 with transparency
                ctx.fillRect(0, y, width, lineHeight);
            }

            // Draw a simplified representation - just colored blocks for non-empty lines
            if (line.trim().length > 0) {
                // Different colors for headings
                if (line.startsWith('#')) {
                    ctx.fillStyle = '#1e40af'; // Blue for headings
                    ctx.fillRect(leftMargin, y, Math.min(line.length * 0.8, width - leftMargin * 2), lineHeight - 0.5);
                } else {
                    ctx.fillStyle = '#64748b'; // Gray for normal text
                    ctx.fillRect(leftMargin, y, Math.min(line.length * 0.6, width - leftMargin * 2), lineHeight - 0.5);
                }
            }
        });
    }, [content, highlightInfo]);

    // Update viewport box on scroll
    React.useEffect(() => {
        const scrollContainer = document.getElementById(scrollContainerId);
        if (!scrollContainer || !containerRef.current) return;

        const updateViewport = () => {
            const containerHeight = containerRef.current?.clientHeight || 600;
            const scrollHeight = scrollContainer.scrollHeight;
            const scrollTop = scrollContainer.scrollTop;
            const clientHeight = scrollContainer.clientHeight;

            const ratio = containerHeight / scrollHeight;
            const top = scrollTop * ratio;
            const height = clientHeight * ratio;

            setViewportBox({ top, height: Math.max(height, 20) });
        };

        updateViewport();
        scrollContainer.addEventListener('scroll', updateViewport);
        window.addEventListener('resize', updateViewport);

        return () => {
            scrollContainer.removeEventListener('scroll', updateViewport);
            window.removeEventListener('resize', updateViewport);
        };
    }, [scrollContainerId]);

    // Handle minimap drag
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);

        const scrollContainer = document.getElementById(scrollContainerId);
        if (!scrollContainer) return;

        dragStartRef.current = {
            y: e.clientY,
            scrollTop: scrollContainer.scrollTop
        };
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const scrollContainer = document.getElementById(scrollContainerId);
            const container = containerRef.current;
            if (!scrollContainer || !container) return;

            const deltaY = e.clientY - dragStartRef.current.y;
            const containerHeight = container.clientHeight;
            const scrollHeight = scrollContainer.scrollHeight;

            const scrollDelta = (deltaY / containerHeight) * scrollHeight;
            scrollContainer.scrollTop = dragStartRef.current.scrollTop + scrollDelta;
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, scrollContainerId]);

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-pointer select-none">
            <canvas ref={canvasRef} className="w-full h-full" />
            {/* Viewport indicator */}
            <div
                className="absolute left-0 right-0 bg-blue-500/20 border border-blue-500/50 cursor-grab active:cursor-grabbing"
                style={{
                    top: `${viewportBox.top}px`,
                    height: `${viewportBox.height}px`,
                }}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
};

// --- Hybrid Preview Theme ---
const hybridHighlightStyle = HighlightStyle.define([
    // Headings
    { tag: t.heading1, class: 'cm-md-h1' },
    { tag: t.heading2, class: 'cm-md-h2' },
    { tag: t.heading3, class: 'cm-md-h3' },
    { tag: t.heading4, class: 'cm-md-h4' },
    { tag: t.heading5, class: 'cm-md-h5' },
    { tag: t.heading6, class: 'cm-md-h6' },

    // Inline formatting
    { tag: t.strong, class: 'cm-md-bold' },
    { tag: t.emphasis, class: 'cm-md-italic' },
    { tag: t.link, class: 'cm-md-link' },
    { tag: t.url, class: 'cm-md-url' },

    // Code
    { tag: t.monospace, class: 'cm-md-code' },

    // Markdown Syntax Markers (The #, *, -, etc.)
    { tag: t.processingInstruction, class: 'cm-md-mark' },

    // Specific Overrides for structural markers we might want to keep visible or style differently
    { tag: t.list, class: 'cm-md-list' }, // List bullets -, *, 1.
    { tag: t.quote, class: 'cm-md-quote' }, // Blockquote >
    { tag: t.meta, class: 'cm-md-meta' }, // Misc meta info
    { tag: t.separator, class: 'cm-md-table-border' }, // Table |
    { tag: t.contentSeparator, class: 'cm-md-hr' }, // Horizontal Rule ---
    { tag: t.strikethrough, class: 'cm-md-strike' }, // ~~Strike~~
]);

const hybridTheme = syntaxHighlighting(hybridHighlightStyle);

// --- Extended Markdown Configuration ---
const markdownExtensions = {
    props: [
        styleTags({
            "TableDelimiter": t.separator,
            "HorizontalRule": t.contentSeparator,
            "Strikethrough": t.strikethrough,
            "StrikethroughMark": t.processingInstruction,
            "CodeMark": t.processingInstruction,

            // Broadly match all ListMarks first to ensure we catch them
            "ListMark": t.list,
            // Then specifically un-style Ordered List markers if we want them normal
            // (Actually, applying t.list to OrderedList markers is fine, we just need to NOT hide them in CSS)
            // But to separate them in CSS, we need different tags/classes.
            // Let's us t.labelName for OrderedList to avoid the .cm-md-list class
            "OrderedList/ListMark": t.labelName,

            "QuoteMark": t.quote,

            // Block markers
            "HeaderMark": t.processingInstruction,
            "EmphasisMark": t.processingInstruction,
            "LinkMark": t.processingInstruction,
        })
    ]
};

function App() {
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [openedTabs, setOpenedTabs] = useState<Tab[]>([]);
    const [content, setContent] = useState<string>("# Welcome\n\nOpen a folder to get started.");
    // const [editorInitialContent, setEditorInitialContent] = useState<string>("# Welcome\n\nOpen a folder to get started.");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeSideTab, setActiveSideTab] = useState<'explorer' | 'search' | 'outline'>('explorer');
    const [searchQuery, setSearchQuery] = useState('');
    const [outline, setOutline] = useState<{ level: number; text: string; line: number }[]>([]);
    const editorViewRef = React.useRef<EditorView | null>(null);

    // Update outline
    useEffect(() => {
        const lines = content.split('\n');
        const newOutline = [];
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                newOutline.push({
                    level: match[1].length,
                    text: match[2],
                    line: i
                });
            }
        }
        setOutline(newOutline);
    }, [content]);

    const scrollToLine = (lineNumber: number) => {
        const view = editorViewRef.current;
        if (view) {
            const lineInfo = view.state.doc.line(lineNumber + 1);
            view.dispatch({
                effects: EditorView.scrollIntoView(lineInfo.from, { y: "center" }),
                selection: { anchor: lineInfo.from }
            });
        }
    };

    const [isSourceMode, setIsSourceMode] = useState(false);
    const [previewType, setPreviewType] = useState<'smart' | 'full'>('smart'); // 'smart' = hybrid edit, 'full' = read only render
    const [isVimMode, setIsVimMode] = useState(false);
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [showMinimap, setShowMinimap] = useState(true);
    const [rootDir, setRootDir] = useState<string | null>(null);
    const [rootFiles, setRootFiles] = useState<FileEntry[]>([]);

    const [sidebarPanelWidth, setSidebarPanelWidth] = useState(240);
    // Split headerHeight into titleBarHeight and tabBarHeight
    const [titleBarHeight, setTitleBarHeight] = useState(56);
    const [tabBarHeight, setTabBarHeight] = useState(34);
    const [footerHeight, setFooterHeight] = useState(32);
    const [activityBarWidth, setActivityBarWidth] = useState(48);
    const [brandAreaHeight, setBrandAreaHeight] = useState(56);
    const [resizingTarget, setResizingTarget] = useState<'sidebar' | 'titleBar' | 'tabBar' | 'footer' | 'activityBar' | 'brand' | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingTarget) return;

            if (resizingTarget === 'sidebar') {
                // Total width minus activity bar
                const newWidth = e.clientX - activityBarWidth;
                const maxWidth = window.innerWidth - activityBarWidth;

                // Allow range from 0 (collapsed) to maxWidth (full screen sidebar)
                if (newWidth >= 0 && newWidth <= maxWidth) {
                    setSidebarPanelWidth(newWidth);
                } else if (newWidth < 0) {
                    setSidebarPanelWidth(0);
                } else if (newWidth > maxWidth) {
                    setSidebarPanelWidth(maxWidth);
                }
            } else if (resizingTarget === 'titleBar') {
                const newHeight = e.clientY;
                if (newHeight >= 0) {
                    setTitleBarHeight(newHeight);
                }
            } else if (resizingTarget === 'tabBar') {
                // Determine new tab bar height based on mouse position relative to title bar
                const newHeight = e.clientY - titleBarHeight;
                if (newHeight >= 0) {
                    setTabBarHeight(newHeight);
                }
            } else if (resizingTarget === 'footer') {
                const newHeight = window.innerHeight - e.clientY;
                const maxHeight = window.innerHeight;
                if (newHeight >= 0 && newHeight <= maxHeight) {
                    setFooterHeight(newHeight);
                }
            } else if (resizingTarget === 'brand') {
                const newHeight = e.clientY;
                // Allow range from 0 to 200
                if (newHeight >= 0 && newHeight < 200) {
                    setBrandAreaHeight(newHeight);
                }
            } else if (resizingTarget === 'activityBar') {
                const newWidth = e.clientX;
                // Min width 30, max 200
                if (newWidth >= 30 && newWidth < 200) {
                    setActivityBarWidth(newWidth);
                }
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
            if (resizingTarget === 'sidebar' || resizingTarget === 'activityBar') {
                document.body.style.cursor = 'col-resize';
            } else {
                document.body.style.cursor = 'row-resize';
            }
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingTarget, activityBarWidth]);

    const contentRef = React.useRef(content);
    useEffect(() => { contentRef.current = content; }, [content]);

    // Update tab content when user types
    // Note: To avoid re-renders of the whole tab list on every keystroke, we might want to debounce this or only update on switch.
    // However, to show the "dirty" indicator live, we need to update state.
    // Optimization: Only update the "dirty" flag if it changes.
    useEffect(() => {
        if (!currentFile) return;
        setOpenedTabs(prev => prev.map(t => {
            if (t.path === currentFile) {
                const isDirty = content !== t.originalContent;
                if (t.isDirty !== isDirty || t.content !== content) {
                    return { ...t, content, isDirty };
                }
            }
            return t;
        }));
    }, [content, currentFile]);

    // Load a file
    const loadFile = async (path: string) => {
        // If already open, switch to it
        if (openedTabs.find(t => t.path === path)) {
            switchTab(path);
            return;
        }

        try {
            // Save current file's state before switching/loading?
            // The useEffect on [content] handles keeping the CURRENT tab updated.
            // So we just need to ensure that runs (it does).

            const fileContent = await invoke<string>("read_content", { path });
            const fileName = path.split(/[\\/]/).pop() || "Untitled";

            const newTab: Tab = {
                path,
                name: fileName,
                content: fileContent,
                originalContent: fileContent,
                isDirty: false
            };

            setOpenedTabs(prev => [...prev, newTab]);
            setCurrentFile(path);
            setContent(fileContent);
        } catch (err) {
            console.error(err);
        }
    }

    const switchTab = (path: string) => {
        if (path === currentFile) return;
        const target = openedTabs.find(t => t.path === path);
        if (target) {
            setCurrentFile(path);
            setContent(target.content);
        }
    };

    const handleCloseTab = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        const newTabs = openedTabs.filter(t => t.path !== path);
        setOpenedTabs(newTabs);

        if (currentFile === path) {
            if (newTabs.length > 0) {
                const next = newTabs[newTabs.length - 1];
                setCurrentFile(next.path);
                setContent(next.content);
            } else {
                setCurrentFile(null);
                setContent("");
            }
        }
    };

    const handleOpenFolder = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
            });

            if (typeof selected === 'string') {
                setRootDir(selected);
                const files = await invoke<FileEntry[]>("read_dir", { path: selected });
                setRootFiles(files);
                setSidebarOpen(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        try {
            let filePath = currentFile;
            if (!filePath) {
                filePath = await save({
                    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
                });
            }

            if (filePath) {
                await invoke("save_content", { path: filePath, content: contentRef.current });

                // Update dirty state
                setOpenedTabs(prev => prev.map(t => t.path === filePath ? { ...t, originalContent: contentRef.current, isDirty: false } : t));

                setCurrentFile(filePath);
                console.log("Saved to", filePath);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const [scrolled, setScrolled] = useState(false);

    // ... existing contentRef and loadFile ...

    // Scroll listener for the editor area
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrolled(e.currentTarget.scrollTop > 10);
    };

    return (
        <div className="h-screen w-screen bg-white flex overflow-hidden">
            {/* Sidebar - Full Height Left */}
            {sidebarOpen && (
                <>
                    <div
                        className="flex flex-col h-screen shrink-0 bg-gray-50/90 border-r border-gray-200 backdrop-blur-xl"
                        style={{ width: `${sidebarPanelWidth + activityBarWidth}px` }}
                    >

                        {/* Brand Area */}
                        <div
                            data-tauri-drag-region
                            className="flex items-center px-4 border-b border-gray-200/50 shrink-0 select-none cursor-default relative overflow-hidden"
                            style={{ height: `${brandAreaHeight}px` }}
                        >
                            <div className="flex items-center gap-3 text-gray-800 font-bold text-lg tracking-tight pointer-events-none">
                                <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                                    <FileText size={18} />
                                </div>
                                <span className="font-sans">MarkEditor</span>
                            </div>
                            {/* Brand Height Resizer */}
                            <div
                                className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-500/50 z-50 transition-colors"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setResizingTarget('brand');
                                }}
                            />
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Activity Bar */}
                            <div
                                className="bg-gray-100 border-r border-gray-200 flex flex-col items-center py-4 gap-4 z-40 relative shrink-0"
                                style={{ width: `${activityBarWidth}px` }}
                            >
                                <button
                                    onClick={() => setActiveSideTab('explorer')}
                                    className={`p-2 rounded-lg transition-all ${activeSideTab === 'explorer' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Explorer"
                                >
                                    <Files size={20} />
                                </button>
                                <button
                                    onClick={() => setActiveSideTab('search')}
                                    className={`p-2 rounded-lg transition-all ${activeSideTab === 'search' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Search"
                                >
                                    <Search size={20} />
                                </button>
                                <button
                                    onClick={() => setActiveSideTab('outline')}
                                    className={`p-2 rounded-lg transition-all ${activeSideTab === 'outline' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Outline"
                                >
                                    <ListTree size={20} />
                                </button>
                                {/* Activity Bar Resizer */}
                                <div
                                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 z-50 transition-colors"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setResizingTarget('activityBar');
                                    }}
                                />
                            </div>

                            {/* Sidebar Panel */}
                            <div className="flex flex-col" style={{ width: `${sidebarPanelWidth}px` }}>

                                {/* Content */}
                                <div className="flex-1 overflow-hidden flex flex-col">
                                    {activeSideTab === 'explorer' && (
                                        <>
                                            <div className="flex items-center px-4 py-3 gap-2 shrink-0">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-1 pl-1">Explorer</span>
                                                <button onClick={handleOpenFolder} className="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded transition-colors text-gray-400" title="Open Folder">
                                                    <FolderOpen size={16} />
                                                </button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-2">
                                                {!rootDir && (
                                                    <div className="text-center mt-10 text-gray-400 text-sm">
                                                        <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
                                                        <p>No folder opened</p>
                                                    </div>
                                                )}
                                                {rootFiles.map(file => (
                                                    <SidebarItem
                                                        key={file.path}
                                                        entry={file}
                                                        level={0}
                                                        onSelect={(entry) => loadFile(entry.path)}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {activeSideTab === 'search' && (
                                        <div className="p-4 flex flex-col gap-4">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Search</span>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search"
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                                <Search size={14} className="absolute right-3 top-2.5 text-gray-400" />
                                            </div>
                                            <div className="text-xs text-gray-400 text-center mt-4">
                                                Global search not implemented yet.
                                            </div>
                                        </div>
                                    )}

                                    {activeSideTab === 'outline' && (
                                        <div className="flex flex-col h-full">
                                            <div className="flex items-center px-4 py-3 gap-2 shrink-0">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-1 pl-1">Outline</span>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-2">
                                                {outline.length === 0 && (
                                                    <div className="text-center mt-10 text-gray-400 text-sm">
                                                        <ListTree size={32} className="mx-auto mb-2 opacity-50" />
                                                        <p>No headings found</p>
                                                    </div>
                                                )}
                                                {outline.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => scrollToLine(item.line)}
                                                        className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded text-sm text-gray-600 truncate transition-colors"
                                                        style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                                                    >
                                                        {item.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Resizer Handle */}
                    <div
                        onMouseDown={() => setResizingTarget('sidebar')}
                        className={`w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 h-full shrink-0 flex items-center justify-center -ml-[1px] ${resizingTarget === 'sidebar' ? 'bg-blue-600' : 'bg-transparent'}`}
                        title="Drag to resize"
                    />
                </>
            )}

            {/* Right Main Area - Flex Column */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">

                {/* Title Bar (Function Bar) */}
                <div
                    className={`shrink-0 border-b flex items-center px-6 gap-4 bg-white z-20 relative transition-colors overflow-hidden ${scrolled ? 'border-gray-200 shadow-sm' : 'border-gray-100'}`}
                    style={{ height: `${titleBarHeight}px` }}
                >
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100/50 rounded text-gray-600 mr-2 shrink-0 z-30">
                        <Menu size={18} />
                    </button>

                    {/* Title or Breadcrumbs - ACTS AS DRAG REGION */}
                    <div className="flex-1 overflow-hidden h-full flex items-center" data-tauri-drag-region>
                        <div className="font-semibold text-gray-700 truncate max-w-[300px] pointer-events-none select-none opacity-80 decoration-slate-900" data-tauri-drag-region>
                            {currentFile ? currentFile.split(/[\\/]/).pop() : "Untitled"}
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-2 z-30">
                        <button
                            onClick={() => {
                                setIsSourceMode(!isSourceMode);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSourceMode ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100/50 hover:text-gray-900 text-gray-500'}`}
                        >
                            {isSourceMode ? <Eye size={16} /> : <Code size={16} />}
                            <span className="hidden sm:inline">{isSourceMode ? "Preview" : "Source"}</span>
                        </button>

                        {/* Sub-mode Toggle for Preview */}
                        {!isSourceMode && (
                            <button
                                onClick={() => setPreviewType(prev => prev === 'smart' ? 'full' : 'smart')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-gray-100/50 text-gray-500"
                                title={previewType === 'smart' ? "Smart Mode: Edit active line source" : "Full Preview: Always rendered"}
                            >
                                {previewType === 'smart' ? <TextCursorInput size={16} /> : <BookOpen size={16} />}
                                <span className="hidden sm:inline">{previewType === 'smart' ? "Smart" : "Full"}</span>
                            </button>
                        )}

                        {/* Line Numbers Toggle */}
                        <button
                            onClick={() => setShowLineNumbers(!showLineNumbers)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showLineNumbers ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100/50 hover:text-gray-900 text-gray-500'}`}
                            title="Toggle Line Numbers"
                        >
                            <ListOrdered size={16} />
                        </button>

                        {/* Minimap Toggle */}
                        <button
                            onClick={() => setShowMinimap(!showMinimap)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showMinimap ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100/50 hover:text-gray-900 text-gray-500'}`}
                            title="Toggle Minimap"
                        >
                            <MapIcon size={16} />
                        </button>

                        <button
                            onClick={() => setIsVimMode(!isVimMode)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isVimMode ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100/50 hover:text-gray-900 text-gray-500'}`}
                            title="Toggle Vim Mode"
                        >
                            <Keyboard size={16} />
                            <span className="hidden sm:inline">Vim</span>
                        </button>

                        <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>

                        <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 bg-black text-white hover:opacity-80 rounded-lg text-sm font-medium transition-all shadow-sm">
                            <Save size={16} />
                            <span>Save</span>
                        </button>

                        {/* Window Controls */}
                        <div className="h-4 w-[1px] bg-gray-300 mx-2"></div>
                        <div className="flex items-center gap-1 -mr-2 text-gray-500">
                            <button
                                onClick={() => appWindow.minimize()}
                                className="p-2 hover:bg-gray-200/50 rounded-md transition-colors"
                                title="Minimize"
                            >
                                <Minus size={16} />
                            </button>
                            <button
                                onClick={() => appWindow.toggleMaximize()}
                                className="p-2 hover:bg-gray-200/50 rounded-md transition-colors"
                                title="Maximize"
                            >
                                <Square size={14} />
                            </button>
                            <button
                                onClick={() => appWindow.close()}
                                className="p-2 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Title Bar Resizer */}
                    <div
                        onMouseDown={() => setResizingTarget('titleBar')}
                        className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 ${resizingTarget === 'titleBar' ? 'bg-blue-600' : 'bg-transparent'}`}
                    />
                </div>

                {/* Tab Bar Container */}
                <div
                    className="flex bg-gray-50/50 border-b border-gray-200/50 overflow-x-auto overflow-y-hidden no-scrollbar shrink-0 backdrop-blur-sm relative"
                    style={{ height: `${tabBarHeight}px` }}
                >
                    {openedTabs.map(tab => (
                        <div
                            key={tab.path}
                            onClick={() => switchTab(tab.path)}
                            className={`group relative flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] border-r border-gray-200/50 text-xs select-none cursor-pointer transition-colors ${tab.path === currentFile ? 'bg-white text-blue-600 shadow-sm z-10 h-full' : 'bg-transparent text-gray-500 hover:bg-white/50 h-full'}`}
                        >
                            <span className={`absolute top-0 left-0 w-full h-[2px] ${tab.path === currentFile ? 'bg-blue-600' : 'bg-transparent'}`} />
                            <FileText size={14} className={tab.path === currentFile ? 'text-blue-500' : 'text-gray-400'} />
                            <span className="truncate flex-1 font-medium">{tab.name}</span>
                            {tab.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                            <button
                                onClick={(e) => handleCloseTab(e, tab.path)}
                                className={`p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 hover:text-red-500 transition-all ${tab.isDirty ? 'hidden group-hover:block' : ''}`}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}

                    {/* Tab Bar Resizer */}
                    <div
                        onMouseDown={() => setResizingTarget('tabBar')}
                        className={`absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 ${resizingTarget === 'tabBar' ? 'bg-blue-600' : 'bg-transparent'}`}
                    />
                </div>


                {/* Content Scroll Container */}
                <div
                    className="flex-1 overflow-auto relative bg-gray-50/30"
                    onScroll={handleScroll}
                    id="editor-scroll-container"
                >
                    <div className="flex min-h-full">
                        {/* Main Editor Area */}
                        <div className="flex-1">
                            {/* Unified container for both modes to ensure consistent size */}
                            {/* Scaled up for larger editing area while maintaining readable margins */}
                            <div className="w-full max-w-[1400px] mx-auto min-h-full px-10 py-8">
                                <div className={`h-full relative ${!isSourceMode ? `preview-mode-cm ${previewType === 'full' ? 'preview-mode-full' : ''}` : ""}`}>
                                    <CodeMirror
                                        value={content}
                                        height="100%"
                                        minHeight="calc(100vh - 150px)"
                                        extensions={[
                                            markdownLang({ extensions: [markdownExtensions] }), // Apply custom extension
                                            ...(isVimMode ? [vim({ status: true })] : []),
                                            ...(!isSourceMode ? [hybridTheme, EditorView.lineWrapping] : [])
                                        ]}
                                        onChange={(value) => setContent(value)}
                                        theme="light"
                                        onCreateEditor={(view) => {
                                            editorViewRef.current = view;
                                        }}
                                        basicSetup={{
                                            lineNumbers: showLineNumbers,
                                            foldGutter: showLineNumbers,
                                            highlightActiveLine: isSourceMode || previewType === 'smart',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Minimap */}
                        {showMinimap && (
                            <div className="w-[120px] shrink-0 border-l border-gray-200 bg-gray-50/50 sticky top-0 h-screen">
                                <MinimapView content={content} scrollContainerId="editor-scroll-container" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Bar - Floating or Fixed Bottom */}
                <div
                    className="shrink-0 bg-white/90 border-t backdrop-blur-sm flex items-center px-4 text-xs text-gray-500 justify-between relative z-20 overflow-hidden"
                    style={{ height: `${footerHeight}px` }}
                >
                    {/* Footer Resizer */}
                    <div
                        onMouseDown={() => setResizingTarget('footer')}
                        className={`absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 ${resizingTarget === 'footer' ? 'bg-blue-600' : 'bg-transparent'}`}
                    />

                    <div className="flex items-center gap-3">
                        {isVimMode && <span className="font-bold text-green-600">VIM</span>}
                        <span>{isSourceMode ? "Source" : "Preview"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>{content.length} chars</span>
                        <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
