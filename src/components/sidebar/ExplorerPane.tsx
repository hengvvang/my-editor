import React, { useState } from "react";
import { FilePlus, FolderPlus, FolderOpen, Trash2 } from "lucide-react";
import { FileEntry } from "../../types";
import { SidebarItem } from "./SidebarItem";
import { NewItemInput } from "./NewItemInput";

interface ExplorerPaneProps {
    rootDir: string | null;
    rootFiles: FileEntry[];
    currentPath: string | null;
    onOpenFile: (path: string) => void;
    onOpenFolder: () => void;
    onCreateFile?: (parentPath: string | null, name: string) => Promise<boolean>;
    onCreateFolder?: (parentPath: string | null, name: string) => Promise<boolean>;
    onDeleteItem?: (path: string) => Promise<boolean>;
}

export const ExplorerPane: React.FC<ExplorerPaneProps> = ({
    rootDir,
    rootFiles,
    currentPath,
    onOpenFile,
    onOpenFolder,
    onCreateFile,
    onCreateFolder,
    onDeleteItem
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

    return (
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
    );
};
