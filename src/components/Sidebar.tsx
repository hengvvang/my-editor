import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileText, Folder, ChevronRight, Search, ListTree, Files, Info, Database } from "lucide-react";
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
}

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
    onResizeStart
}) => {
    if (!isOpen) return null;

    return (
        <div className="flex flex-col shrink-0 h-full border-r border-slate-200 bg-slate-50/50 relative" style={{ width: width }}>
            {/* 1. Header ("EXPLORER") */}
            <div className="h-[35px] flex items-center px-4 font-bold text-slate-500 text-xs tracking-wider uppercase bg-slate-50 border-b border-slate-200 shrink-0" data-tauri-drag-region>
                EXPLORER
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
                                <SidebarItem key={file.path} entry={file} level={0} currentPath={currentPath} onSelect={f => onOpenFile(f.path)} />
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

            {/* Lower: Info Panel */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                        <Database size={12} className="text-slate-400" />
                        <span>Workspace</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate pl-4.5" title={rootDir || "No Folder"}>
                        {rootDir ? rootDir.split(/[\\/]/).pop() : "No Open Folder"}
                    </div>
                    {rootDir && <div className="text-[10px] text-slate-400 truncate pl-4.5">{rootDir}</div>}
                </div>

                <div className="w-full h-[1px] bg-slate-100"></div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                        <Info size={12} className="text-slate-400" />
                        <span>MarkEditor</span>
                    </div>
                    <div className="text-[10px] text-slate-500 pl-4.5">
                        Version 0.1.0 (Beta)<br />
                        Powered by Tauri & React
                    </div>
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
