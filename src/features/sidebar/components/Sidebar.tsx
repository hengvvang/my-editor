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
import { SidebarMenu } from "./SidebarMenu";
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
            <div className="h-[35px] flex items-center pr-4 bg-slate-50/50 border-b border-slate-200 shrink-0 select-none">
                <SidebarMenu />
                <div className="flex-1 h-full flex items-center font-bold text-slate-500 text-[11px] tracking-widest uppercase pl-1" data-tauri-drag-region>
                    {activeSideTab === 'explorer' && "EXPLORER"}
                    {activeSideTab === 'search' && "SEARCH"}
                    {activeSideTab === 'outline' && "OUTLINE"}
                    {activeSideTab === 'workspaces' && "WORKSPACES"}
                    {activeSideTab === 'typing' && "TYPING"}
                    {activeSideTab === 'canvas' && "CANVAS"}
                    {activeSideTab === 'calendar' && "CALENDAR"}
                </div>
            </div>

            {/* 2. Main Body: Left Tabs + Right Pane */}
            <div className="flex-1 flex min-h-0">
                {/* Left Side: Tabs (Activity Bar inside) */}
                <div className="w-[40px] flex flex-col py-2 gap-1 bg-slate-50 border-r border-slate-200 shrink-0">
                    {[
                        { id: 'explorer', Icon: Files, label: 'Explorer' },
                        { id: 'search', Icon: Search, label: 'Search' },
                        { id: 'outline', Icon: ListTree, label: 'Outline' },
                    ].map(({ id, Icon, label }) => {
                        const isActive = activeSideTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => onActiveSideTabChange(id as any)}
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
                        { id: 'typing', Icon: Keyboard, label: 'Typing Practice' },
                        { id: 'canvas', Icon: PenTool, label: 'Canvas' },
                        { id: 'calendar', Icon: Calendar, label: 'Calendar' },
                        { id: 'world-clock', Icon: Globe2, label: 'World Clock' },
                        { id: 'workspaces', Icon: FolderKanban, label: 'Workspaces' },
                    ].map(({ id, Icon, label }) => {
                        const isActive = activeSideTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => onActiveSideTabChange(id as any)}
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
