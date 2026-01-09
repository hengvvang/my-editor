import React, { useState } from "react";
import { Search, ListTree, Files, Info, Database, X, FilePlus, FolderPlus, Trash2, FolderOpen } from "lucide-react";
import { FileEntry, SearchResult, SearchScope } from "../types";
import { SidebarItem } from "./sidebar/SidebarItem";
import { NewItemInput } from "./sidebar/NewItemInput";
import { SearchPane } from "./sidebar/SearchPane";

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

    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);

    // New File/Folder state
    const [creatingItem, setCreatingItem] = useState<{ parentPath: string; type: 'file' | 'folder' } | null>(null);
    const [pathsToRefresh, setPathsToRefresh] = useState<string[]>([]);

    const handleFocus = (entry: FileEntry) => {
        setSelectedPath(entry.path);
        setSelectedEntry(entry);
    };

    const handleNewFile = async () => {
        if (!onCreateFile) return;

        let parentPath = rootDir;
        if (selectedEntry) {
            if (selectedEntry.is_dir) parentPath = selectedEntry.path;
            else {
                const sep = selectedEntry.path.includes("\\") ? "\\" : "/";
                const parts = selectedEntry.path.split(sep);
                parts.pop();
                parentPath = parts.join(sep);
            }
        }

        if (parentPath) {
            setCreatingItem({ parentPath, type: 'file' });
        }
    };

    const handleNewFolder = async () => {
        if (!onCreateFolder) return;

        let parentPath = rootDir;
        if (selectedEntry) {
            if (selectedEntry.is_dir) parentPath = selectedEntry.path;
            else {
                const sep = selectedEntry.path.includes("\\") ? "\\" : "/";
                const parts = selectedEntry.path.split(sep);
                parts.pop();
                parentPath = parts.join(sep);
            }
        }
        if (parentPath) {
            setCreatingItem({ parentPath, type: 'folder' });
        }
    };

    const handleConfirmCreate = async (name: string) => {
        if (!creatingItem) return;
        const { parentPath, type } = creatingItem;

        try {
            if (type === 'file' && onCreateFile) {
                await onCreateFile(parentPath, name);
            } else if (type === 'folder' && onCreateFolder) {
                await onCreateFolder(parentPath, name);
            }

            // Refresh specific folder if not root
            if (parentPath !== rootDir) {
                setPathsToRefresh(prev => [...prev, parentPath]);
            }
            // Root refresh is handled by App update or prop change usually
        } catch (e) {
            console.error("Create failed", e);
            alert("Failed to create " + type);
        } finally {
            setCreatingItem(null);
        }
    };

    const handleCancelCreate = () => {
        setCreatingItem(null);
    };

    const handleRefreshComplete = (path: string) => {
        setPathsToRefresh(prev => prev.filter(p => p !== path));
    };

    const handleDelete = async () => {

        if (!selectedEntry || !onDeleteItem) return;
        if (confirm(`Delete ${selectedEntry.name}?`)) {
            await onDeleteItem(selectedEntry.path);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="flex flex-col shrink-0 h-full border-r border-slate-200 bg-slate-50/50 relative" style={{ width: width }}>
            {/* 1. Header ("EXPLORER" / "SEARCH" / "OUTLINE") */}
            <div className="h-[35px] flex items-center px-4 font-bold text-slate-500 text-xs tracking-wider uppercase bg-slate-50 border-b border-slate-200 shrink-0" data-tauri-drag-region>
                {activeSideTab === 'explorer' && "EXPLORER"}
                {activeSideTab === 'search' && "SEARCH"}
                {activeSideTab === 'outline' && "OUTLINE"}
            </div>

            {/* 2. Main Body: Left Tabs + Right Window */}
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
                    {/* Content Header (Optional, maybe just showing content) */}


                    {activeSideTab === 'explorer' && (
                        <div className="flex-1 overflow-auto bg-slate-50/30">
                            <div className="flex items-center justify-end px-2 pt-2 pb-1 bg-slate-50/50 sticky top-0 z-10">
                                <div className="flex items-center gap-1">
                                    <button onClick={handleNewFile} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="New File"><FilePlus size={14} /></button>
                                    <button onClick={handleNewFolder} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="New Folder"><FolderPlus size={14} /></button>
                                    <button onClick={onOpenFolder} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Open Folder"><FolderOpen size={14} /></button>
                                    <button onClick={handleDelete} className={`p-1 hover:bg-slate-200 rounded ${selectedEntry ? 'text-slate-500 hover:text-red-500' : 'text-slate-300 cursor-not-allowed'}`} title="Delete"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="px-2">
                                {!rootDir && <button onClick={onOpenFolder} className="w-full py-2 bg-blue-500 text-white rounded text-xs mb-2">Open Folder</button>}

                                {rootDir && creatingItem && creatingItem.parentPath === rootDir && (
                                    <NewItemInput
                                        type={creatingItem.type}
                                        level={0}
                                        onConfirm={handleConfirmCreate}
                                        onCancel={handleCancelCreate}
                                    />
                                )}

                                {rootFiles.map(file => (
                                    <SidebarItem
                                        key={file.path}
                                        entry={file}
                                        level={0}
                                        currentPath={currentPath}
                                        selectedPath={selectedPath}
                                        onSelect={f => onOpenFile(f.path)}
                                        onFocus={handleFocus}
                                        creatingItem={creatingItem}
                                        onConfirmCreate={handleConfirmCreate}
                                        onCancelCreate={handleCancelCreate}
                                        pathsToRefresh={pathsToRefresh}
                                        onRefreshComplete={handleRefreshComplete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSideTab === 'search' && search && (
                        <SearchPane
                            search={search}
                            rootDir={rootDir}
                            currentPath={currentPath}
                            activeGroupFiles={activeGroupFiles}
                            // Pass all workspace paths
                            allWorkspaces={workspaces ? workspaces.map(w => w.path) : []}
                            // TODO: Passing all Open Files from Sidebar parent would require prop drilling from App
                            // For now, AllGroups search will effectively work if we had the list.
                            // Assuming `activeGroupFiles` is just current group.
                            onOpenFileAtLine={onOpenFileAtLine}
                        />
                    )}

                    {activeSideTab === 'outline' && (
                        <div className="flex-1 overflow-auto p-2 bg-slate-50/30">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 pt-2">Outline</div>
                            {outline.length === 0 ? (
                                <div className="p-2 text-xs text-slate-400 italic">No symbols found</div>
                            ) : (
                                outline.map((item, i) => (
                                    <div
                                        key={i}
                                        className="px-2 py-1 hover:bg-slate-100 cursor-pointer truncate text-xs flex items-center gap-1.5 text-slate-600"
                                        style={{ paddingLeft: (item.level - 1) * 12 + 8 }}
                                    >
                                        <span className="opacity-50 text-[10px]">#</span> {item.text}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lower: Workspaces Panel */}
            <div className="flex flex-col shrink-0 border-t border-slate-200 bg-slate-50 min-h-[120px] max-h-[40%]">
                <div className="h-[30px] flex items-center px-4 font-bold text-slate-500 text-xs tracking-wider uppercase bg-slate-100 border-b border-slate-200 shrink-0 select-none">
                    Workspaces
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 min-h-[100px]">
                    {/* Active Workspace Card */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-md shadow-sm cursor-default relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                        <Database size={14} className="text-blue-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs text-slate-800 truncate">{rootDir ? rootDir.split(/[\\/]/).pop() : "No Workspace"}</div>
                            <div className="text-[10px] text-slate-400 truncate">{rootDir || "Open a folder to start"}</div>
                        </div>
                    </div>

                    {/* Recent Workspaces List */}
                    {workspaces
                        .filter(w => w.path !== rootDir)
                        .map((ws) => (
                            <div
                                key={ws.path}
                                onClick={() => onSwitchWorkspace && onSwitchWorkspace(ws.path)}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-transparent hover:border-slate-200 rounded-md shadow-sm cursor-pointer relative overflow-hidden group opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 group-hover:bg-slate-400" />
                                <Database size={14} className="text-slate-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs text-slate-700 truncate">{ws.name}</div>
                                    <div className="text-[10px] text-slate-400 truncate">{ws.path}</div>
                                </div>
                                {onRemoveWorkspace && (
                                    <button
                                        onClick={(e) => onRemoveWorkspace(ws.path, e)}
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove from Recent"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))}

                    <button onClick={onOpenFolder} className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-200 mt-1">
                        <span className="font-bold">+</span>
                        <span>Open New Workspace...</span>
                    </button>
                </div>

                {/* Footer Info (Merged) */}
                <div className="px-3 py-1.5 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between bg-zinc-50">
                    <span className="truncate">Typoly Beta 0.1.0</span>
                    <Info size={12} className="opacity-50 hover:opacity-100 cursor-pointer shrink-0" />
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
