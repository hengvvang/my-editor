import React, { useMemo } from "react";
import { Search, ListTree, Files, FolderKanban, Keyboard, PenTool, Calendar, Globe2, Languages } from "lucide-react";
import { SidebarMenu } from "./SidebarMenu";
import { SearchPane } from "./SearchPane";
import { ExplorerPane } from "./ExplorerPane";
import { OutlinePane } from "./OutlinePane";
import { WorkspacesPane } from "./WorkspacesPane";
import { TypingPane } from "./TypingPane";
import { CanvasPane, CanvasConfig } from "./CanvasPane";
import { CalendarPane } from "./CalendarPane";
import { WorldClockPane } from "./WorldClockPane/WorldClockPane";
import { TranslatePanel } from "../../translate";
import appLogo from "../../../assets/logo.png";

// Contexts
import { useSidebarContext } from '../context/SidebarContext';
import { useWorkspaceContext } from '../../workspace/context/WorkspaceContext';
import { useEditorContext } from '../../editor/context/EditorContext';
import { useDocumentContext } from '../../documents/context/DocumentContext';
import { useOutline } from './OutlinePane/useOutline';
import { useSearch } from './SearchPane/useSearch';

export const Sidebar: React.FC = () => {
    // 1. Context Hooks
    const { isOpen, activeTab, setActiveTab } = useSidebarContext();
    const {
        rootDir, rootFiles, workspaces, loadWorkspace, createFolder, createFile,
        deleteItem, openFolder, togglePinWorkspace, toggleActiveWorkspace, removeWorkspace
    } = useWorkspaceContext();
    const {
        groups, activeGroupId, openTab,
        getSelection
    } = useEditorContext();
    const {
        documents, updateDoc, createVirtualDocument, ensureDocumentLoaded
    } = useDocumentContext();

    // 2. Computed
    const activeGroupFiles = useMemo(() => groups.find(g => g.id === activeGroupId)?.tabs || [], [groups, activeGroupId]);
    const activePath = groups.find(g => g.id === activeGroupId)?.activePath || null;
    const currentDocumentText = activePath ? documents[activePath]?.content : '';

    // 3. Feature Hooks
    const outline = useOutline(documents, groups, activeGroupId);
    const search = useSearch();

    // 4. Handlers
    const handleOpenFile = (path: string) => {
        ensureDocumentLoaded(path).then(loaded => {
            if (loaded) openTab(path);
        });
    };

    const handleOpenFileAtLine = async (path: string, line: number) => {
        await ensureDocumentLoaded(path);
        openTab(path);
        // Todo: scroll to line implementation requires editor access
    };

    // Quick Handlers
    const handleQuickTyping = (dictId: string, chapter: number, config: any, forceNew: boolean = false) => {
        const group = groups.find(g => g.id === activeGroupId);
        if (!forceNew && group?.activePath?.includes('typing-practice')) {
            const newContent = JSON.stringify({ dictId, chapter, config }, null, 2);
            updateDoc(group.activePath, { content: newContent });
            return;
        }

        const timestamp = new Date().getTime();
        const virtualPath = `untitled:typing-practice-${timestamp}`;
        const initialContent = JSON.stringify({ dictId, chapter, config }, null, 2);
        createVirtualDocument(virtualPath, initialContent, "Typing Practice");
        openTab(virtualPath, activeGroupId);
    };

    const handleQuickDraw = (config: any) => {
        const forceNew = config.forceNew;
        const group = groups.find(g => g.id === activeGroupId);
        if (!forceNew && group?.activePath?.endsWith('.excalidraw')) {
            // Logic to update existing drawing if needed
        }

        const timestamp = new Date().getTime();
        const virtualPath = `untitled:drawing-${timestamp}.excalidraw`;
        const initialContent = JSON.stringify({
            type: "excalidraw",
            version: 2,
            source: "typoly",
            elements: [],
            appState: { viewBackgroundColor: config?.background || "#ffffff" },
            files: {}
        }, null, 2);

        createVirtualDocument(virtualPath, initialContent, "Untitled Drawing");
        openTab(virtualPath, activeGroupId);
    };

    const handleOpenCalendar = () => {
        const calendarPath = "untitled:Schedule.cal";
        if (!documents[calendarPath]) {
            const initialContent = JSON.stringify({ initialView: 'dayGridMonth', events: [] }, null, 2);
            createVirtualDocument(calendarPath, initialContent, "Schedule");
        }
        openTab(calendarPath, activeGroupId);
    };

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full w-full border-r border-slate-200 bg-slate-50/80 backdrop-blur-md">
            {/* 1. Header ("EXPLORER" / "SEARCH" / "OUTLINE") */}
            <div className="h-[35px] flex items-center pr-4 bg-slate-50/50 border-b border-slate-200 shrink-0 select-none">
                <SidebarMenu />
                <div className="flex-1 h-full flex items-center font-bold text-slate-500 text-[11px] tracking-widest uppercase pl-1" data-tauri-drag-region>
                    {activeTab === 'explorer' && "EXPLORER"}
                    {activeTab === 'search' && "SEARCH"}
                    {activeTab === 'outline' && "OUTLINE"}
                    {activeTab === 'workspaces' && "WORKSPACES"}
                    {activeTab === 'typing' && "TYPING"}
                    {activeTab === 'canvas' && "CANVAS"}
                    {activeTab === 'calendar' && "CALENDAR"}
                    {activeTab === 'translate' && "TRANSLATE"}
                </div>
            </div>

            {/* 2. Main Body: Left Tabs + Right Pane */}
            <div className="flex-1 flex min-h-0">
                {/* Left Side: Tabs */}
                <div className="w-[40px] flex flex-col py-2 gap-1 bg-slate-50 border-r border-slate-200 shrink-0">
                    {[
                        { id: 'explorer', Icon: Files, label: 'Explorer' },
                        { id: 'search', Icon: Search, label: 'Search' },
                        { id: 'outline', Icon: ListTree, label: 'Outline' },
                    ].map(({ id, Icon, label }) => {
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`relative w-full h-[42px] flex items-center justify-center transition-colors duration-200 group mb-1
                                    ${isActive
                                        ? 'text-slate-900'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }
                                `}
                                title={label}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-sm bg-slate-900" />
                                )}
                                <Icon size={22} strokeWidth={1.5} className={`transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-90 group-hover:scale-100'}`} />
                            </button>
                        );
                    })}

                    <div className="flex-1" />

                    {[
                        { id: 'translate', Icon: Languages, label: 'Translate' },
                        { id: 'typing', Icon: Keyboard, label: 'Typing Practice' },
                        { id: 'canvas', Icon: PenTool, label: 'Canvas' },
                        { id: 'calendar', Icon: Calendar, label: 'Calendar' },
                        { id: 'world-clock', Icon: Globe2, label: 'World Clock' },
                        { id: 'workspaces', Icon: FolderKanban, label: 'Workspaces' },
                    ].map(({ id, Icon, label }) => {
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`relative w-full h-[42px] flex items-center justify-center transition-colors duration-200 group mb-1
                                    ${isActive
                                        ? 'text-slate-900'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }
                                `}
                                title={label}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-sm bg-slate-900" />
                                )}
                                <Icon size={22} strokeWidth={1.5} className={`transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-90 group-hover:scale-100'}`} />
                            </button>
                        );
                    })}
                </div>

                {/* Right Side: Window / Panel Content */}
                <div className="flex-1 bg-white/50 overflow-hidden flex flex-col">

                    {activeTab === 'explorer' && (
                        <ExplorerPane
                            rootDir={rootDir}
                            rootFiles={rootFiles}
                            currentPath={activePath} // currentPath -> activePath
                            activePath={activePath} // ExplorerPane might expect 'activePath' or 'currentPath' prop?
                            onOpenFile={handleOpenFile}
                            onOpenFolder={openFolder}
                            onCreateFile={createFile}
                            onCreateFolder={createFolder}
                            onDeleteItem={deleteItem}
                        />
                    )}

                    {activeTab === 'search' && search && (
                        <SearchPane
                            search={search}
                            rootDir={rootDir}
                            currentPath={activePath}
                            activeGroupFiles={activeGroupFiles}
                            allWorkspaces={workspaces ? workspaces.map(w => w.path) : []}
                            onOpenFileAtLine={handleOpenFileAtLine}
                        />
                    )}

                    {activeTab === 'outline' && (
                        <OutlinePane
                            outline={outline}
                            onItemClick={(line) => activePath && handleOpenFileAtLine(activePath, line)}
                        />
                    )}

                    {activeTab === 'workspaces' && (
                        <WorkspacesPane
                            rootDir={rootDir}
                            workspaces={workspaces}
                            onSwitchWorkspace={loadWorkspace}
                            onRemoveWorkspace={removeWorkspace}
                            onTogglePinWorkspace={togglePinWorkspace}
                            onToggleActiveWorkspace={toggleActiveWorkspace}
                            onOpenFolder={openFolder}
                        />
                    )}

                    {activeTab === 'typing' && (
                        <TypingPane
                            onStartPractice={handleQuickTyping}
                            isTypingActive={!!activePath && activePath.includes('typing-practice')}
                        />
                    )}

                    {activeTab === 'canvas' && (
                        <CanvasPane
                            onStartDrawing={handleQuickDraw}
                            isCanvasActive={!!activePath && activePath.includes('drawing-')}
                        />
                    )}

                    {activeTab === 'calendar' && (
                        <CalendarPane onOpenCalendar={handleOpenCalendar} />
                    )}

                    {activeTab === 'translate' && (
                        <TranslatePanel
                            currentDocumentText={currentDocumentText}
                            onGetSelection={getSelection}
                            onTranslateDocument={() => { }}
                            onTranslateBilingual={() => { }}
                        />
                    )}

                    <div style={{ display: activeTab === 'world-clock' ? 'block' : 'none', height: '100%' }}>
                        <WorldClockPane />
                    </div>
                </div>
            </div>

            {/* App Info Footer */}
            <div className="h-[36px] border-t border-slate-200 bg-white/50 flex items-center px-3 gap-2.5 shrink-0 select-none cursor-default hover:bg-white transition-colors">
                <img src={appLogo} alt="Logo" className="w-5 h-5 rounded shadow-sm object-cover" />
                <div className="flex items-center flex-1 min-w-0 gap-2">
                    <span className="text-[11px] font-bold text-slate-700 tracking-tight truncate">Typoly</span>
                    <div className="flex-1" />
                    <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">v0.1.0</span>
                </div>
            </div>

        </div>
    );
};
