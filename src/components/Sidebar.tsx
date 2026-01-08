import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileText, Folder, ChevronRight, Search, ListTree, Files, Info, Database, X, FilePlus, FolderPlus, Trash2, FolderOpen } from "lucide-react";
import { FileEntry } from "../types";

export interface SidebarProps {
    isOpen: boolean;
    width: number;
    activeSideTab: 'explorer' | 'search' | 'outline';
    onActiveSideTabChange: (tab: 'explorer' | 'search' | 'outline') => void;
    rootDir: string | null;
    rootFiles: FileEntry[];
    currentPath: string | null;
    onOpenFile: (path: string) => void;
    onOpenFolder: () => void;
    outline: { level: number; text: string; line: number }[];
    onResizeStart: () => void;
    workspaces?: { path: string; name: string }[];
    onSwitchWorkspace?: (path: string) => void;
    onRemoveWorkspace?: (path: string, e: React.MouseEvent) => void;
    onCreateFile?: (parentPath: string | null, name: string) => Promise<boolean>;
    onCreateFolder?: (parentPath: string | null, name: string) => Promise<boolean>;
    onDeleteItem?: (path: string) => Promise<boolean>;
}

const SidebarItem = ({
    entry,
    level,
    onSelect,
    currentPath,
    selectedPath,
    onFocus,
}: {
    entry: FileEntry,
    level: number,
    onSelect: (entry: FileEntry) => void,
    currentPath: string | null,
    selectedPath: string | null,
    onFocus: (entry: FileEntry) => void,
}) => {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileEntry[]>([]);

    // We need to expose a way to refresh children if parent updates
    // For now, simpler: expand/collapse toggles fetch.

    const fetchChildren = async () => {
        try {
            const files = await invoke<FileEntry[]>("read_dir", { path: entry.path });
            files.sort((a, b) => {
                if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
                return a.is_dir ? -1 : 1;
            });
            setChildren(files);
        } catch (err) {
            console.error("Failed to read dir", err);
        }
    };

    const handleExpand = async (e: React.MouseEvent) => {
        e.stopPropagation();
        onFocus(entry); // Select directory when toggling too

        if (!entry.is_dir) return;

        if (!expanded) {
            await fetchChildren();
        }
        setExpanded(!expanded);
    }

    // Allow re-fetch
    const refresh = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (expanded) await fetchChildren();
    }

    const isSelected = !entry.is_dir && currentPath === entry.path;
    const isFocused = selectedPath === entry.path;

    return (
        <div>
            <div
                className={`group flex items-center gap-1.5 py-1 pr-2 cursor-pointer text-xs select-none transition-colors border-l-2 ${isSelected ? 'border-blue-500' : 'border-transparent'} ${isFocused ? 'bg-blue-100 text-blue-800' : (isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-600')}`}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onFocus(entry);
                    if (!entry.is_dir) onSelect(entry);
                    else handleExpand(e);
                }}
            >
                <span className={`shrink-0 flex items-center justify-center w-4 h-4 transition-transform duration-200 ${entry.is_dir && expanded ? 'rotate-90' : ''}`}
                    onClick={(e) => {
                        if (entry.is_dir) handleExpand(e);
                    }}
                >
                    {entry.is_dir && <ChevronRight size={12} className={`group-hover:text-slate-600 ${isFocused ? 'text-blue-500' : 'text-slate-400'}`} />}
                </span>

                {entry.is_dir ? (
                    <Folder size={14} className={`shrink-0 ${expanded ? 'text-blue-500' : (isFocused ? 'text-blue-400' : 'text-blue-400/80 group-hover:text-blue-500')}`} />
                ) : (
                    <FileText size={14} className={`shrink-0 ${isSelected ? 'text-blue-500' : (isFocused ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-500')}`} />
                )}
                <span className="truncate flex-1 pt-0.5 font-medium">{entry.name}</span>
            </div>
            {expanded && children.map(child => (
                <SidebarItem key={child.path} entry={child} level={level + 1} onSelect={onSelect} currentPath={currentPath} selectedPath={selectedPath} onFocus={onFocus} />
            ))}
        </div>
    );
};

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
    onDeleteItem
}) => {

    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);

    const handleFocus = (entry: FileEntry) => {
        setSelectedPath(entry.path);
        setSelectedEntry(entry);
    };

    const handleNewFile = async () => {
        const name = prompt("Enter file name:");
        if (!name || !onCreateFile) return;

        let parentPath = rootDir;
        if (selectedEntry) {
            if (selectedEntry.is_dir) parentPath = selectedEntry.path;
            else {
                // Determine parent of file... strict text processing for now
                const sep = selectedEntry.path.includes("\\") ? "\\" : "/";
                const parts = selectedEntry.path.split(sep);
                parts.pop();
                parentPath = parts.join(sep);
            }
        }

        await onCreateFile(parentPath, name);
        // Note: Refresh logic is limited for subdirectories without global signal
        if (parentPath === rootDir) {
            // Root auto-refreshes via prop update
        } else {
            alert("File created. Please collapse and expand folder to refresh.");
        }
    };

    const handleNewFolder = async () => {
        const name = prompt("Enter folder name:");
        if (!name || !onCreateFolder) return;

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
        await onCreateFolder(parentPath, name);
        if (parentPath !== rootDir) {
            alert("Folder created. Please collapse and expand folder to refresh.");
        }
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
            {/* 1. Header ("EXPLORER") */}
            <div className="h-[35px] flex items-center px-4 font-bold text-slate-500 text-xs tracking-wider uppercase bg-slate-50 border-b border-slate-200 shrink-0 justify-between" data-tauri-drag-region>
                <span>EXPLORER</span>
                <div className="flex items-center gap-1">
                    <button onClick={handleNewFile} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="New File"><FilePlus size={14} /></button>
                    <button onClick={handleNewFolder} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="New Folder"><FolderPlus size={14} /></button>
                    <button onClick={onOpenFolder} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Open Folder"><FolderOpen size={14} /></button>
                    <button onClick={handleDelete} className={`p-1 hover:bg-slate-200 rounded ${selectedEntry ? 'text-slate-500 hover:text-red-500' : 'text-slate-300 cursor-not-allowed'}`} title="Delete"><Trash2 size={14} /></button>
                </div>
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
                        <div className="flex-1 overflow-auto p-2 bg-slate-50/30">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 pt-2">Folders</div>
                            {!rootDir && <button onClick={onOpenFolder} className="w-full py-2 bg-blue-500 text-white rounded text-xs mb-2">Open Folder</button>}
                            {rootFiles.map(file => (
                                <SidebarItem
                                    key={file.path}
                                    entry={file}
                                    level={0}
                                    currentPath={currentPath}
                                    selectedPath={selectedPath}
                                    onSelect={f => onOpenFile(f.path)}
                                    onFocus={handleFocus}
                                />
                            ))}
                        </div>
                    )}

                    {activeSideTab === 'search' && (
                        <div className="flex-1 overflow-auto p-4 bg-slate-50/30">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Search</div>
                            <div className="text-xs text-slate-400">Search functionality coming soon.</div>
                        </div>
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
                    <span className="truncate">MarkEditor Beta 0.1.0</span>
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
