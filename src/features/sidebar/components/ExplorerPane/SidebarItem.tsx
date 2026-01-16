import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileText, Folder, ChevronRight } from "lucide-react";
import { FileEntry } from "../../../../shared/types";
import { NewItemInput } from "./NewItemInput";

export interface SidebarItemProps {
    entry: FileEntry;
    level: number;
    onSelect: (entry: FileEntry) => void;
    currentPath: string | null;
    selectedPath: string | null;
    onFocus: (entry: FileEntry) => void;

    // New Props for specific actions
    creatingItem: { parentPath: string; type: 'file' | 'folder' } | null;
    onConfirmCreate: (name: string) => void;
    onCancelCreate: () => void;
    pathsToRefresh: string[];
    onRefreshComplete: (path: string) => void;
    collapseSignal: number;
}

export const SidebarItem = ({
    entry,
    level,
    onSelect,
    currentPath,
    selectedPath,
    onFocus,
    creatingItem,
    onConfirmCreate,
    onCancelCreate,
    pathsToRefresh,
    onRefreshComplete,
    collapseSignal
}: SidebarItemProps) => {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileEntry[]>([]);

    // Collapse All Effect
    useEffect(() => {
        if (collapseSignal > 0) {
            setExpanded(false);
        }
    }, [collapseSignal]);


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

    // Auto-expand if creating item in this folder
    const isCreatingHere = creatingItem?.parentPath === entry.path;
    useEffect(() => {
        if (isCreatingHere && !expanded) {
            setExpanded(true);
            fetchChildren();
        }
    }, [isCreatingHere]);

    // Refresh listener
    useEffect(() => {
        if (pathsToRefresh.includes(entry.path)) {
            fetchChildren().then(() => onRefreshComplete(entry.path));
        }
    }, [pathsToRefresh, entry.path]);

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
    const isFocused = selectedPath === entry.path; // Focused allows keyboard nav highlight separate from active tab

    const rowHeight = "h-[22px]";

    return (
        <div>
            <div
                className={`
                    group flex items-center gap-0.5 pr-2 cursor-pointer text-[13px] select-none transition-none
                    ${rowHeight}
                    ${isSelected
                        ? 'bg-[#0090f1] text-white'
                        : (isFocused ? 'bg-[#0090f1]/20' : 'hover:bg-[#f0f0f0] text-[#424242]')
                    }
                `}
                style={{ paddingLeft: `${level * 10}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onFocus(entry);
                    if (!entry.is_dir) onSelect(entry);
                    else handleExpand(e);
                }}
            >
                <span className={`shrink-0 flex items-center justify-center w-[16px] h-full transition-transform duration-100 ${entry.is_dir && expanded ? 'rotate-90' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation(); // Only toggle expand, don't focus/select row if just clicking arrow
                        if (entry.is_dir) handleExpand(e);
                    }}
                >
                    {entry.is_dir && <ChevronRight size={14} className={`${isSelected ? 'text-white' : 'text-[#424242]'}`} />}
                </span>

                <div className="shrink-0 flex items-center justify-center w-[18px] mr-1">
                    {entry.is_dir ? (
                        <Folder size={16} className={`${expanded ? (isSelected ? 'text-white' : 'text-[#0090f1]') : (isSelected ? 'text-white' : 'text-[#dcb67a]')}`} fill="currentColor" />
                    ) : (
                        <FileText size={15} className={`${isSelected ? 'text-white' : 'text-[#757575]'}`} />
                    )}
                </div>

                <span className="truncate flex-1 font-normal leading-none -mt-[1px]">{entry.name}</span>
            </div>
            {expanded && (
                <>
                    {isCreatingHere && creatingItem && (
                        <NewItemInput
                            type={creatingItem.type}
                            level={level + 1}
                            onConfirm={onConfirmCreate}
                            onCancel={onCancelCreate}
                        />
                    )}
                    {children.map(child => (
                        <SidebarItem
                            key={child.path}
                            entry={child}
                            level={level + 1}
                            onSelect={onSelect}
                            currentPath={currentPath}
                            selectedPath={selectedPath}
                            onFocus={onFocus}
                            creatingItem={creatingItem}
                            onConfirmCreate={onConfirmCreate}
                            onCancelCreate={onCancelCreate}
                            pathsToRefresh={pathsToRefresh}
                            onRefreshComplete={onRefreshComplete}
                            collapseSignal={collapseSignal}
                        />
                    ))}
                </>
            )}
        </div>
    );
};
