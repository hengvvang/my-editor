import React from "react";
import { Search, ListTree, Files } from "lucide-react";
import { FileEntry, SearchResult, SearchScope } from "../types";
import { SearchPane } from "./sidebar/SearchPane";
import { ExplorerPane } from "./sidebar/ExplorerPane";
import { OutlinePane } from "./sidebar/OutlinePane";
import { WorkspacesPane } from "./sidebar/WorkspacesPane";

export interface SidebarProps {
    isOpen: boolean;
    width: number;
    activeSideTab: 'explorer' | 'search' | 'outline';
    onActiveSideTabChange: (tab: 'explorer' | 'search' | 'outline') => void;
    rootDir: string | null;
    rootFiles: FileEntry[];
    currentPath: string | null;
    onOpenFile: (path: string) => void;
    onOpenFileAtLine?: (path: string, line: number) => void;
    onOpenFolder: () => void;
    outline: { level: number; text: string; line: number }[];
    onResizeStart: () => void;
    workspaces?: { path: string; name: string }[];
    onSwitchWorkspace?: (path: string) => void;
    onRemoveWorkspace?: (path: string, e: React.MouseEvent) => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
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
            </div>

            {/* 2. Main Body: Left Tabs + Right Pane */}
            <div className="flex-1 flex min-h-0">
                {/* Left Side: Tabs (Activity Bar inside) */}
                <div className="w-[40px] flex flex-col items-center py-2 gap-2 bg-slate-100 border-r border-slate-200 shrink-0">
                    <button
                        onClick={() => onActiveSideTabChange('explorer')}
                        className={`p-2 rounded-md transition-all ${activeSideTab === 'explorer' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Explorer"
                    >
                        <Files size={18} />
                    </button>
                    <button
                        onClick={() => onActiveSideTabChange('search')}
                        className={`p-2 rounded-md transition-all ${activeSideTab === 'search' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Search"
                    >
                        <Search size={18} />
                    </button>
                    <button
                        onClick={() => onActiveSideTabChange('outline')}
                        className={`p-2 rounded-md transition-all ${activeSideTab === 'outline' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                        title="Outline"
                    >
                        <ListTree size={18} />
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
                </div>
            </div>

            {/* Lower: Workspaces Panel */}
            <WorkspacesPane
                rootDir={rootDir}
                workspaces={workspaces}
                onSwitchWorkspace={onSwitchWorkspace}
                onRemoveWorkspace={onRemoveWorkspace}
                onOpenFolder={onOpenFolder}
            />

            {/* Resizer */}
            <div
                className="absolute top-0 bottom-0 right-[-2px] w-1 cursor-col-resize z-50 hover:bg-blue-400"
                onMouseDown={(e) => { e.preventDefault(); onResizeStart(); }}
            />

        </div >
    );
};
