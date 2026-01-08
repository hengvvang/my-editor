import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import DOMPurify from "dompurify";
import { FileText, Folder, FolderOpen, Save, ChevronRight, Menu, Code, Eye, Keyboard, Minus, Square, X, BookOpen, TextCursorInput, Search, ListTree, Files, ListOrdered, Map as MapIcon, Columns } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { markdown as markdownLang } from '@codemirror/lang-markdown';
import { vim } from "@replit/codemirror-vim";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t, styleTags, Tag } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";
import mermaid from "mermaid"; // Import mermaid

import "./styles.css";
const appWindow = getCurrentWebviewWindow()

// --- Custom Tags ---
const customTags = {
    listMark: Tag.define(),
    quoteMark: Tag.define(),
    codeBlockText: Tag.define(),
    codeBlockInfo: Tag.define(),
    taskMarker: Tag.define()
};

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
    onSelect,
    currentPath
}: {
    entry: FileEntry,
    level: number,
    onSelect: (entry: FileEntry) => void,
    currentPath: string | null
}) => {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileEntry[]>([]);

    const handleExpand = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!entry.is_dir) return;

        if (!expanded) {
            try {
                const files = await invoke<FileEntry[]>("read_dir", { path: entry.path });
                // Sort folders first
                files.sort((a, b) => {
                    if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
                    return a.is_dir ? -1 : 1;
                });
                setChildren(files);
            } catch (err) {
                console.error("Failed to read dir", err);
            }
        }
        setExpanded(!expanded);
    }

    const isSelected = !entry.is_dir && currentPath === entry.path;

    return (
        <div>
            <div
                className={`group flex items-center gap-1.5 py-1 pr-2 cursor-pointer text-xs select-none transition-colors border-l-2 ${isSelected ? 'bg-blue-50/50 border-blue-500 text-blue-700 font-medium' : 'border-transparent hover:bg-slate-100 text-slate-600'}`}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
                onClick={() => entry.is_dir ? handleExpand({ stopPropagation: () => { } } as any) : onSelect(entry)}
            >
                <span className={`shrink-0 flex items-center justify-center w-4 h-4 transition-transform duration-200 ${entry.is_dir && expanded ? 'rotate-90' : ''}`}
                    onClick={(e) => {
                        if (entry.is_dir) handleExpand(e);
                    }}
                >
                    {entry.is_dir && <ChevronRight size={12} className="text-slate-400 group-hover:text-slate-600" />}
                </span>

                {entry.is_dir ? (
                    <Folder size={14} className={`shrink-0 ${expanded ? 'text-blue-500' : 'text-blue-400/80 group-hover:text-blue-500'}`} />
                ) : (
                    <FileText size={14} className={`shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
                )}
                <span className="truncate flex-1 pt-0.5">{entry.name}</span>
            </div>
            {expanded && children.map(child => (
                <SidebarItem key={child.path} entry={child} level={level + 1} onSelect={onSelect} currentPath={currentPath} />
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
    { tag: customTags.codeBlockText, class: 'cm-md-block-code' },
    { tag: customTags.codeBlockInfo, class: 'cm-md-block-info' },
    { tag: customTags.taskMarker, class: 'cm-md-task' },

    // Markdown Syntax Markers (The #, *, -, etc.)
    { tag: t.processingInstruction, class: 'cm-md-mark' },

    // Specific Overrides for structural markers we might want to keep visible or style differently
    { tag: customTags.listMark, class: 'cm-md-list' }, // List bullets -, *, 1.
    { tag: customTags.quoteMark, class: 'cm-md-quote' }, // Blockquote >
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

            // Differentiate Inline Code vs Block Code
            "InlineCode": t.monospace,
            "CodeText": customTags.codeBlockText,
            "CodeInfo": customTags.codeBlockInfo,

            // Task Lists
            "TaskMarker": customTags.taskMarker,

            // Specific override for Ordered List markers to avoid the .cm-md-list styling
            // This MUST come before "ListMark" if the engine processes specifically
            // (However, for safety, we used a different tag t.labelName above, so order is less critical, but let's be safe)
            "OrderedList/ListMark": t.labelName,

            // Broadly match all (other) ListMarks
            "ListMark": customTags.listMark,

            "QuoteMark": customTags.quoteMark,

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

    const [isSourceMode, setIsSourceMode] = useState(false);
    const [previewType, setPreviewType] = useState<'smart' | 'full'>('smart'); // 'smart' = hybrid edit, 'full' = read only render
    const [showSplitPreview, setShowSplitPreview] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [typstSvg, setTypstSvg] = useState<string>('');
    const [mermaidSvg, setMermaidSvg] = useState<string>(''); // Mermaid SVG state

    // Initialize mermaid
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });
    }, []);

    // Determine current document type based on extension
    const getDocType = (path: string | null): 'markdown' | 'typst' | 'mermaid' | 'text' => {
        if (!path) return 'text';
        if (path.endsWith('.typ')) return 'typst';
        if (path.endsWith('.md')) return 'markdown';
        if (path.endsWith('.mmd') || path.endsWith('.mermaid')) return 'mermaid';
        return 'text';
    };

    const docType = getDocType(currentFile);

    // Auto-enable split preview for Typst and Mermaid
    useEffect(() => {
        if (docType === 'typst' || docType === 'mermaid') {
            setIsSourceMode(true);
            setShowSplitPreview(true);
        } else if (docType === 'markdown') {
            // Restore user preference or default
            // setIsSourceMode(false); // Maybe?
        }
    }, [docType]);

    // Mermaid Rendering Effect
    useEffect(() => {
        if (docType === 'mermaid' && content) {
            const timer = setTimeout(async () => {
                try {
                    // Generate a unique ID for the mermaid diagram container
                    const id = `mermaid-${Date.now()}`;
                    const { svg } = await mermaid.render(id, content);
                    setMermaidSvg(svg);
                } catch (e) {
                    console.error("Mermaid rendering failed:", e);
                    // Optionally set an error message in the preview
                    setMermaidSvg(`<div class="text-red-500 p-4">Mermaid Syntax Error:<br/>${(e as Error).message}</div>`);
                }
            }, 500); // Debounce
            return () => clearTimeout(timer);
        }
    }, [content, docType]);

    // Typst Compilation Effect
    useEffect(() => {
        if (docType === 'typst' && content) {
            const timer = setTimeout(async () => {
                try {
                    console.log("Compiling Typst...");
                    const svg = await invoke<string>('compile_typst', { content });
                    setTypstSvg(svg);
                } catch (e) {
                    console.error("Typst compilation failed:", e);
                }
            }, 500); // Debounce 500ms
            return () => clearTimeout(timer);
        }
    }, [content, docType]);

    useEffect(() => {
        if (isSourceMode && showSplitPreview && docType === 'markdown') {
            const timer = setTimeout(() => {
                invoke('render_markdown', { text: content }).then((html) => {
                    setHtmlContent(DOMPurify.sanitize(html as string));
                });
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [content, isSourceMode, showSplitPreview]);

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
    const [resizingTarget, setResizingTarget] = useState<'sidebar' | 'titleBar' | 'tabBar' | 'footer' | 'activityBar' | 'brand' | 'editorSplit' | null>(null);
    const [splitRatio, setSplitRatio] = useState(0.5);
    const mainContentRef = React.useRef<HTMLDivElement>(null);

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
            } else if (resizingTarget === 'editorSplit') {
                // Improved Resize Logic: Use actual container dimensions for accurate handle position
                if (mainContentRef.current) {
                    const rect = mainContentRef.current.getBoundingClientRect();
                    const relativeX = e.clientX - rect.left;
                    let newRatio = relativeX / rect.width;

                    // Constraints
                    if (newRatio < 0.1) newRatio = 0.1;
                    if (newRatio > 0.9) newRatio = 0.9;

                    setSplitRatio(newRatio);
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
            if (resizingTarget === 'sidebar' || resizingTarget === 'activityBar' || resizingTarget === 'editorSplit') {
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
    }, [resizingTarget, activityBarWidth, sidebarPanelWidth, sidebarOpen]);

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
                            <div className="flex flex-col bg-slate-50/50" style={{ width: `${sidebarPanelWidth}px` }}>

                                {/* Content */}
                                <div className="flex-1 overflow-hidden flex flex-col">
                                    {activeSideTab === 'explorer' && (
                                        <>
                                            <div className="flex items-center px-4 py-3 gap-2 shrink-0 border-b border-transparent">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-1 pl-1">Explorer</span>
                                                <button onClick={handleOpenFolder} className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition-colors" title="Open Folder">
                                                    <FolderOpen size={14} />
                                                </button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-2">
                                                {!rootDir && (
                                                    <div className="flex flex-col items-center justify-center mt-20 text-slate-400 text-sm gap-2">
                                                        <FolderOpen size={32} className="opacity-20" />
                                                        <p className="opacity-60">No folder opened</p>
                                                        <button
                                                            onClick={handleOpenFolder}
                                                            className="mt-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors shadow-sm"
                                                        >
                                                            Open Folder
                                                        </button>
                                                    </div>
                                                )}
                                                {rootFiles.map(file => (
                                                    <SidebarItem
                                                        key={file.path}
                                                        entry={file}
                                                        level={0}
                                                        onSelect={(entry) => loadFile(entry.path)}
                                                        currentPath={currentFile}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {activeSideTab === 'search' && (
                                        <div className="p-4 flex flex-col gap-4">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Search</span>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 group-hover:border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                                <Search size={14} className="absolute left-3 top-2.5 text-slate-400 group-hover:text-slate-500 transition-colors" />
                                            </div>
                                            <div className="text-xs text-slate-400 text-center mt-8 italic opacity-70">
                                                Global search coming soon
                                            </div>
                                        </div>
                                    )}

                                    {activeSideTab === 'outline' && (
                                        <div className="flex flex-col h-full">
                                            <div className="flex items-center px-4 py-3 gap-2 shrink-0">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-1 pl-1">Outline</span>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-2">
                                                {outline.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center mt-20 text-slate-400 text-sm gap-2">
                                                        <ListTree size={32} className="opacity-20" />
                                                        <p className="opacity-60">No headings</p>
                                                    </div>
                                                )}
                                                {outline.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => scrollToLine(item.line)}
                                                        className="cursor-pointer hover:bg-slate-100 px-2 py-1.5 rounded-sm text-sm text-slate-600 truncate transition-colors border-l-2 border-transparent hover:border-slate-300"
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
                    className={`shrink-0 border-b flex items-center px-4 gap-3 bg-white z-20 relative transition-colors overflow-hidden ${scrolled ? 'border-slate-200 shadow-sm' : 'border-slate-100'}`}
                    style={{ height: `${titleBarHeight}px` }}
                >
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded text-slate-500 mr-2 shrink-0 z-30 transition-colors">
                        <Menu size={18} />
                    </button>

                    {/* Title or Breadcrumbs - ACTS AS DRAG REGION */}
                    <div className="flex-1 overflow-hidden h-full flex items-center" data-tauri-drag-region>
                        <div className="font-medium text-slate-700 truncate max-w-[400px] pointer-events-none select-none text-sm" data-tauri-drag-region>
                            {currentFile ? currentFile.split(/[\\/]/).pop() : "Untitled"}
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-2 z-30">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setIsSourceMode(true)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${isSourceMode ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                title="Edit Markdown Source"
                            >
                                <Code size={14} />
                                <span className="hidden sm:inline">Code</span>
                            </button>
                            <button
                                onClick={() => setIsSourceMode(false)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${!isSourceMode ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                title="Visual Edit Mode"
                            >
                                <Eye size={14} />
                                <span className="hidden sm:inline">Visual</span>
                            </button>
                        </div>

                        {/* Sub-mode Toggle for Source: Split View */}
                        {isSourceMode && (
                            <button
                                onClick={() => setShowSplitPreview(!showSplitPreview)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showSplitPreview ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
                                title="Toggle Split Preview"
                            >
                                <Columns size={16} />
                                <span className="hidden sm:inline">Split</span>
                            </button>
                        )}

                        {/* Sub-mode Toggle for Preview */}
                        {!isSourceMode && (
                            <button
                                onClick={() => setPreviewType(prev => prev === 'smart' ? 'full' : 'smart')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-slate-100 text-slate-500"
                                title={previewType === 'smart' ? "Smart Mode: Edit active line source" : "Full Preview: Always rendered"}
                            >
                                {previewType === 'smart' ? <TextCursorInput size={16} /> : <BookOpen size={16} />}
                                <span className="hidden sm:inline">{previewType === 'smart' ? "Smart" : "Full"}</span>
                            </button>
                        )}

                        {/* Line Numbers Toggle */}
                        <button
                            onClick={() => setShowLineNumbers(!showLineNumbers)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showLineNumbers ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
                            title="Toggle Line Numbers"
                        >
                            <ListOrdered size={16} />
                        </button>

                        {/* Minimap Toggle */}
                        <button
                            onClick={() => setShowMinimap(!showMinimap)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showMinimap ? 'bg-purple-50 text-purple-600' : 'hover:bg-slate-100 text-slate-500'}`}
                            title="Toggle Minimap"
                        >
                            <MapIcon size={16} />
                        </button>

                        <button
                            onClick={() => setIsVimMode(!isVimMode)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isVimMode ? 'bg-green-50 text-green-600' : 'hover:bg-slate-100 text-slate-500'}`}
                            title="Toggle Vim Mode"
                        >
                            <Keyboard size={16} />
                            <span className="hidden sm:inline">Vim</span>
                        </button>

                        <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

                        <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-md text-xs font-medium transition-all shadow-sm">
                            <Save size={14} />
                            <span>Save</span>
                        </button>

                        {/* Window Controls */}
                        <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
                        <div className="flex items-center gap-1 -mr-2 text-slate-400">
                            <button
                                onClick={() => appWindow.minimize()}
                                className="p-2 hover:bg-slate-100 rounded-md transition-colors"
                                title="Minimize"
                            >
                                <Minus size={16} />
                            </button>
                            <button
                                onClick={async () => {
                                    if (await appWindow.isMaximized()) {
                                        await appWindow.unmaximize();
                                    } else {
                                        await appWindow.maximize();
                                    }
                                }}
                                className="p-2 hover:bg-slate-100 rounded-md transition-colors"
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
                    className="flex bg-slate-100/50 border-b border-slate-200 overflow-x-auto overflow-y-hidden no-scrollbar shrink-0 backdrop-blur-sm relative pt-1"
                    style={{ height: `${tabBarHeight}px` }}
                >
                    {openedTabs.map(tab => (
                        <div
                            key={tab.path}
                            onClick={() => switchTab(tab.path)}
                            className={`group relative flex items-center gap-2 px-4 min-w-[120px] max-w-[200px] border-r border-slate-200/50 text-xs select-none cursor-pointer transition-all ${tab.path === currentFile ? 'bg-white text-blue-600 shadow-sm rounded-t-lg mb-[-1px] border-t-2 border-t-blue-500 border-x border-slate-200' : 'bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 border-t-2 border-t-transparent'}`}
                            style={{ height: 'calc(100% - 1px)' }}
                        >
                            <FileText size={14} className={tab.path === currentFile ? 'text-blue-500' : 'text-slate-400'} />
                            <span className="truncate flex-1 font-medium">{tab.name}</span>
                            {tab.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                            <button
                                onClick={(e) => handleCloseTab(e, tab.path)}
                                className={`p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-200 hover:text-red-500 transition-all ${tab.isDirty ? 'hidden group-hover:block' : ''}`}
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
                    className={`flex-1 relative bg-white ${isSourceMode && showSplitPreview ? 'overflow-hidden' : 'overflow-auto'}`}
                    onScroll={handleScroll}
                    id="editor-scroll-container"
                >
                    <div className="flex min-h-full w-full">
                        {/* Main Editor Area */}
                        <div className="flex-1 min-w-0" ref={mainContentRef}>
                            {/* Simplified container for both modes to ensure consistent size */}
                            {/* Scaled up for larger editing area while maintaining readable margins */}
                            <div className={`mx-auto min-h-full transition-all duration-300 ${isSourceMode && showSplitPreview ? 'w-full flex h-full' : 'w-full max-w-[900px] py-8 px-8'}`}>
                                <div
                                    className={`${isSourceMode && showSplitPreview ? 'border-r border-slate-200' : 'w-full'} h-full relative ${!isSourceMode ? `preview-mode-cm ${previewType === 'full' ? 'preview-mode-full' : ''}` : ""}`}
                                    style={{ width: isSourceMode && showSplitPreview ? `${splitRatio * 100}%` : '100%' }}
                                >
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
                                        className={isSourceMode && showSplitPreview ? "h-full" : ""}
                                    />
                                </div>

                                {/* Resizer Handle */}
                                {isSourceMode && showSplitPreview && (
                                    <div
                                        className={`w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 h-full shrink-0 -ml-[1px] ${resizingTarget === 'editorSplit' ? 'bg-blue-600' : 'bg-transparent'}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setResizingTarget('editorSplit');
                                        }}
                                    />
                                )}

                                {isSourceMode && showSplitPreview && (
                                    <div
                                        className="h-full overflow-y-auto bg-slate-50/50"
                                        style={{ width: `${(1 - splitRatio) * 100}%` }}
                                    >
                                        {docType === 'typst' ? (
                                            <div
                                                className="typst-preview-container h-full"
                                                dangerouslySetInnerHTML={{ __html: typstSvg }}
                                            />
                                        ) : docType === 'mermaid' ? (
                                            <div
                                                className="mermaid-preview-container h-full flex items-center justify-center bg-white p-4 overflow-auto"
                                                dangerouslySetInnerHTML={{ __html: mermaidSvg }}
                                            />
                                        ) : (
                                            <div
                                                className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600 p-8"
                                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Minimap */}
                        {showMinimap && (
                            <div className="w-[120px] shrink-0 border-l border-slate-200 bg-slate-50/30 sticky top-0 h-screen">
                                <MinimapView content={content} scrollContainerId="editor-scroll-container" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Bar - Floating or Fixed Bottom */}
                <div
                    className="shrink-0 bg-white border-t border-slate-200 flex items-center px-4 text-xs text-slate-500 justify-between relative z-20 overflow-hidden"
                    style={{ height: `${footerHeight}px` }}
                >
                    {/* Footer Resizer */}
                    <div
                        onMouseDown={() => setResizingTarget('footer')}
                        className={`absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-50 ${resizingTarget === 'footer' ? 'bg-blue-600' : 'bg-transparent'}`}
                    />

                    <div className="flex items-center gap-4">
                        {isVimMode && <span className="font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">VIM</span>}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isSourceMode ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                            <span>{isSourceMode ? "Code Mode" : "Visual Mode"}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[10px] opacity-80">
                        <span>{content.length} chars</span>
                        <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
                        <span>Pre-Alpha Build</span>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
