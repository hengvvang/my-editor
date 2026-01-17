import React from "react";
import { Search, ListTree, Files, FolderKanban, Keyboard, PenTool, Calendar, Globe2 } from "lucide-react";
import { FileEntry } from "../../../shared/types";
import { SearchResult, SearchScope } from "../types";
import { SearchPane } from "./SearchPane";
import { ExplorerPane } from "./ExplorerPane";
import { OutlinePane } from "./OutlinePane";
import { WorkspacesPane } from "./WorkspacesPane";
import { TypingPane } from "./TypingPane";
import { CanvasPane, CanvasConfig } from "./CanvasPane";
import { CalendarPane } from "./CalendarPane";
import { WorldClockPane } from "./WorldClockPane/WorldClockPane";
import appLogo from "../../../assets/logo.png";

export interface SidebarProps {
    isOpen: boolean;
    activeSideTab: 'explorer' | 'search' | 'outline' | 'workspaces' | 'typing' | 'canvas' | 'calendar' | 'world-clock';
    onActiveSideTabChange: (tab: 'explorer' | 'search' | 'outline' | 'workspaces' | 'typing' | 'canvas' | 'calendar' | 'world-clock') => void;
    onQuickTyping?: (dictId: string, chapter: number, config: any, forceNew?: boolean) => void;
    onQuickDraw?: (config: CanvasConfig) => void;
    onOpenCalendar?: () => void;
    rootDir: string | null;
    rootFiles: FileEntry[];
    currentPath: string | null;
    onOpenFile: (path: string) => void;
    onOpenFileAtLine?: (path: string, line: number) => void;
    onOpenFolder: () => void;
    outline: { level: number; text: string; line: number }[];
    workspaces?: { path: string; name: string; pinned?: boolean; active?: boolean }[];
    onSwitchWorkspace?: (path: string) => void;
    onRemoveWorkspace?: (path: string, e: React.MouseEvent) => void;
    onTogglePinWorkspace?: (path: string, e: React.MouseEvent) => void;
    onToggleActiveWorkspace?: (path: string, e: React.MouseEvent) => void;
    onCreateFile?: (parentPath: string | null, name: string) => Promise<boolean>;
    onCreateFolder?: (parentPath: string | null, name: string) => Promise<boolean>;
    onDeleteItem?: (path: string) => Promise<boolean>;
    search?: {
        query: string;
        setQuery: (q: string) => void;
        options: { caseSensitive: boolean; wholeWord: boolean; isRegex: boolean; scope: SearchScope };
        setOption: (k: "caseSensitive" | "wholeWord" | "isRegex" | "scope", v: any) => void;
        results: SearchResult[];
        isSearching: boolean;
        search: (root: string | null, currentPath: string | null, activeGroupFiles: string[]) => void;
    };
    activeGroupFiles?: string[];
}

const SidebarBase: React.FC<SidebarProps> = ({
    isOpen,
    activeSideTab,
    onActiveSideTabChange,
    rootDir,
    rootFiles,
    currentPath,
    onOpenFile,
    onOpenFolder,
    outline,
    workspaces = [],
    onSwitchWorkspace,
    onRemoveWorkspace,
    onTogglePinWorkspace,
    onToggleActiveWorkspace,
    onCreateFile,
    onCreateFolder,
    onDeleteItem,
    search,
    onOpenFileAtLine,
    activeGroupFiles = [],
    onQuickTyping,
    onQuickDraw
}) => {

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full w-full border-r border-slate-200 bg-slate-50/80 backdrop-blur-md">
            {/* 1. Header ("EXPLORER" / "SEARCH" / "OUTLINE") */}
            <div className="h-[40px] flex items-center px-4 font-bold text-slate-500 text-[11px] tracking-widest uppercase bg-slate-50/50 border-b border-slate-200 shrink-0 select-none" data-tauri-drag-region>
                {activeSideTab === 'explorer' && "EXPLORER"}
                {activeSideTab === 'search' && "SEARCH"}
                {activeSideTab === 'outline' && "OUTLINE"}
                {activeSideTab === 'workspaces' && "WORKSPACES"}
                {activeSideTab === 'typing' && "TYPING"}
                {activeSideTab === 'canvas' && "CANVAS"}
                {activeSideTab === 'calendar' && "CALENDAR"}
            </div>

            {/* 2. Main Body: Left Tabs + Right Pane */}
            <div className="flex-1 flex min-h-0">
                {/* Left Side: Tabs (Activity Bar inside) */}
                <div className="w-[52px] flex flex-col items-center py-3 gap-3 bg-slate-100/50 border-r border-slate-200 shrink-0">
                    <button
                        onClick={() => onActiveSideTabChange('explorer')}
                        className={`p-2.5 rounded-2xl transition-all active:scale-95 duration-200 ${activeSideTab === 'explorer' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Explorer"
                    >
                        <Files size={20} className="transition-transform duration-300" />
                    </button>
                    <button
                        onClick={() => onActiveSideTabChange('search')}
                        className={`p-2.5 rounded-2xl transition-all active:scale-95 duration-200 ${activeSideTab === 'search' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Search"
                    >
                        <Search size={20} className="transition-transform duration-300" />
                    </button>
                    <button
                        onClick={() => onActiveSideTabChange('outline')}
                        className={`p-2.5 rounded-2xl transition-all active:scale-95 duration-200 ${activeSideTab === 'outline' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Outline"
                    >
                        <ListTree size={20} className="transition-transform duration-300" />
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={() => onActiveSideTabChange('typing')}
                        className={`p-2.5 rounded-2xl transition-all active:scale-95 duration-200 ${activeSideTab === 'typing' ? 'bg-white shadow-sm text-green-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Typing Practice"
                    >
                        <Keyboard size={20} className="transition-transform duration-300" />
                    </button>

                    <button
                        onClick={() => onActiveSideTabChange('canvas')}
                        className={`p-2.5 rounded-2xl transition-all active:scale-95 duration-200 ${activeSideTab === 'canvas' ? 'bg-white shadow-sm text-orange-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Canvas"
                    >
                        <PenTool size={20} className="transition-transform duration-300" />
                    </button>

                    <button
                        onClick={() => onActiveSideTabChange('calendar')}
                        className={`p-2.5 rounded-2xl transition-all active:scale-95 duration-200 ${activeSideTab === 'calendar' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Calendar"
                    >
                        <Calendar size={20} className="transition-transform duration-300" />
                    </button>

                    <button
                        onClick={() => onActiveSideTabChange('world-clock')}
                        className={`p-2.5 rounded-2xl transition-all active:scale-95 duration-200 ${activeSideTab === 'world-clock' ? 'bg-white shadow-sm text-purple-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="World Clock"
                    >
                        <Globe2 size={20} className="transition-transform duration-300" />
                    </button>

                    <button
                        onClick={() => onActiveSideTabChange('workspaces')}
                        className={`p-2.5 rounded-2xl transition-all active:scale-95 duration-200 ${activeSideTab === 'workspaces' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Workspaces"
                    >
                        <FolderKanban size={20} className="transition-transform duration-300" />
                    </button>
                </div>

                {/* Right Side: Window / Panel Content */}
                <div className="flex-1 bg-white/50 overflow-hidden flex flex-col">

                    {activeSideTab === 'explorer' && (
                        <ExplorerPane
                            rootDir={rootDir}
                            rootFiles={rootFiles}
                            currentPath={currentPath}
                            onOpenFile={onOpenFile}
                            onOpenFolder={onOpenFolder}
                            onCreateFile={onCreateFile}
                            onCreateFolder={onCreateFolder}
                            onDeleteItem={onDeleteItem}
                        />
                    )}

                    {activeSideTab === 'search' && search && (
                        <SearchPane
                            search={search}
                            rootDir={rootDir}
                            currentPath={currentPath}
                            activeGroupFiles={activeGroupFiles}
                            allWorkspaces={workspaces ? workspaces.map(w => w.path) : []}
                            onOpenFileAtLine={onOpenFileAtLine}
                        />
                    )}

                    {activeSideTab === 'outline' && (
                        <OutlinePane
                            outline={outline}
                            onItemClick={(line) => onOpenFileAtLine && currentPath ? onOpenFileAtLine(currentPath, line) : undefined}
                        />
                    )}

                    {activeSideTab === 'workspaces' && (
                        <WorkspacesPane
                            rootDir={rootDir}
                            workspaces={workspaces}
                            onSwitchWorkspace={onSwitchWorkspace}
                            onRemoveWorkspace={onRemoveWorkspace}
                            onTogglePinWorkspace={onTogglePinWorkspace}
                            onToggleActiveWorkspace={onToggleActiveWorkspace}
                            onOpenFolder={onOpenFolder}
                        />
                    )}

                    {activeSideTab === 'typing' && (
                        <TypingPane
                            onStartPractice={onQuickTyping}
                            isTypingActive={!!currentPath && currentPath.includes('typing-practice')}
                        />
                    )}

                    {activeSideTab === 'canvas' && (
                        <CanvasPane
                            onStartDrawing={onQuickDraw}
                            isCanvasActive={!!currentPath && currentPath.includes('drawing-')}
                        />
                    )}

                    {activeSideTab === 'calendar' && (
                        <CalendarPane />
                    )}

                    <div style={{ display: activeSideTab === 'world-clock' ? 'block' : 'none', height: '100%' }}>
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

export const Sidebar = React.memo(SidebarBase);
