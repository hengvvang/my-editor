import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileText, Folder, ChevronRight } from "lucide-react";
import { FileEntry } from "../../types";

export interface SidebarItemProps {
    entry: FileEntry;
    level: number;
    onSelect: (entry: FileEntry) => void;
    currentPath: string | null;
    selectedPath: string | null;
    onFocus: (entry: FileEntry) => void;
}

export const SidebarItem = ({
    entry,
    level,
    onSelect,
    currentPath,
    selectedPath,
    onFocus,
}: SidebarItemProps) => {
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

    const isSelected = !entry.is_dir && currentPath === entry.path;
    const isFocused = selectedPath === entry.path;

    return (
        <div>
            <div
                className={`group flex items-center gap-1.5 py-1 pr-2 cursor-pointer text-xs select-none transition-colors border-l-2 ${isSelected ? 'border-blue-500' : 'border-transparent'} ${isFocused ? 'bg-blue-100 text-blue-800' : (isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-600')}`}
                style={{ paddingLeft: `${level * 10 + 4}px` }}
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
