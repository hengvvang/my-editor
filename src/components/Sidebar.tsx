import React from "react";
import { Search, ListTree, Files, FolderKanban } from "lucide-react";
import { FileEntry, SearchResult, SearchScope } from "../types";
import { SearchPane } from "./sidebar/SearchPane";
import { ExplorerPane } from "./sidebar/ExplorerPane";
import { OutlinePane } from "./sidebar/OutlinePane";
import { WorkspacesPane } from "./sidebar/WorkspacesPane";
import appLogo from "../assets/logo.png";

export interface SidebarProps {
    isOpen: boolean;
    width: number;
    activeSideTab: 'explorer' | 'search' | 'outline' | 'workspaces';
    onActiveSideTabChange: (tab: 'explorer' | 'search' | 'outline' | 'workspaces') => void;
    rootDir: string | null;
    rootFiles: FileEntry[];
    currentPath: string | null;
    onOpenFile: (path: string) => void;
    onOpenFileAtLine?: (path: string, line: number) => void;
    onOpenFolder: () => void;
    outline: { level: number; text: string; line: number }[];
    onResizeStart: () => void;
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
    width,
    activeSideTab,
    onActiveSideTabChange,
    rootDir,
    rootFiles,
    currentPath,
    onOpenFile,
    onOpenFolder,
    outline,
    onResizeStart,
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
}) => {

    if (!isOpen) return null;

    return (
        <div className="flex flex-col shrink-0 h-full border-r border-slate-200 bg-slate-50/50 relative" style={{ width: width }}>
            {/* 1. Header ("EXPLORER" / "SEARCH" / "OUTLINE") */}
            <div className="h-[35px] flex items-center px-4 font-bold text-slate-500 text-xs tracking-wider uppercase bg-slate-50 border-b border-slate-200 shrink-0" data-tauri-drag-region>
                {activeSideTab === 'explorer' && "EXPLORER"}
                {activeSideTab === 'search' && "SEARCH"}
                {activeSideTab === 'outline' && "OUTLINE"}
                {activeSideTab === 'workspaces' && "WORKSPACES"}
            </div>

            {/* 2. Main Body: Left Tabs + Right Pane */}
            <div className="flex-1 flex min-h-0">
                {/* Left Side: Tabs (Activity Bar inside) */}
                <div className="w-[48px] flex flex-col items-center py-2 gap-2 bg-slate-100 border-r border-slate-200 shrink-0">
                    <button
                        onClick={() => onActiveSideTabChange('explorer')}
                        className={`p-2.5 rounded-md transition-all ${activeSideTab === 'explorer' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Explorer"
                    >
                        <Files size={20} />
                    </button>
                    <button
                        onClick={() => onActiveSideTabChange('search')}
                        className={`p-2.5 rounded-md transition-all ${activeSideTab === 'search' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Search"
                    >
                        <Search size={20} />
                    </button>
                    <button
                        onClick={() => onActiveSideTabChange('outline')}
                        className={`p-2.5 rounded-md transition-all ${activeSideTab === 'outline' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Outline"
                    >
                        <ListTree size={20} />
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={() => onActiveSideTabChange('workspaces')}
                        className={`p-2.5 rounded-md transition-all ${activeSideTab === 'workspaces' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Workspaces"
                    >
                        <FolderKanban size={20} />
                    </button>
                </div>

                {/* Right Side: Window / Panel Content */}
                <div className="flex-1 bg-white overflow-hidden flex flex-col">

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

            {/* Resizer */}
            <div
                className="absolute top-0 bottom-0 right-[-2px] w-1 cursor-col-resize z-50 hover:bg-blue-400"
                onMouseDown={(e) => { e.preventDefault(); onResizeStart(); }}
            />

        </div >
    );
};

export const Sidebar = React.memo(SidebarBase);
