import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from 'react';
import { FileEntry } from '../../../shared/types';
import { LayoutNode } from '../features/editor/types';
import { Workspace } from '../features/sidebar/types';

export function useWorkspace(
    layout: LayoutNode,
    activeGroupId: string,
    updateLayout: (l: LayoutNode) => void,
    setActiveGroupId: (id: string) => void,
    onLoadFile: (path: string, addToGroup: boolean) => Promise<boolean>
) {
    const [rootDir, setRootDir] = useState<string | null>(null);
    const [rootFiles, setRootFiles] = useState<FileEntry[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    // Track sidebar visibility request based on workspace load
    const [shouldShowSidebar, setShouldShowSidebar] = useState(false);

    // Load workspaces from local storage
    useEffect(() => {
        const stored = localStorage.getItem('recentWorkspaces');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) setWorkspaces(parsed);
            } catch (e) {
                console.error("Failed to parse workspaces", e);
            }
        }
    }, []);

    // Save workspaces list
    useEffect(() => {
        if (workspaces.length > 0) {
            localStorage.setItem('recentWorkspaces', JSON.stringify(workspaces));
        }
    }, [workspaces]);

    // Auto-save current workspace state (Layout & Active Group)
    useEffect(() => {
        if (!rootDir) return;

        const saveState = () => {
             const state = { layout, activeGroupId };
             localStorage.setItem(`workspace_state:${rootDir}`, JSON.stringify(state));
             // Also update last opened path
             localStorage.setItem('lastOpenedWorkspace', rootDir);
        };

        const timer = setTimeout(saveState, 1000); // Debounce 1s
        return () => clearTimeout(timer);
    }, [rootDir, layout, activeGroupId]);

    // Restore last opened workspace on init
    useEffect(() => {
        // Only run once on mount
        const lastPath = localStorage.getItem('lastOpenedWorkspace');
        if (lastPath) {
             loadWorkspace(lastPath).catch(err => {
                 console.error("Failed to restore last workspace", err);
                 localStorage.removeItem('lastOpenedWorkspace');
             });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadWorkspace = useCallback(async (path: string) => {
        // No need to manually save previous state here anymore,
        // the useEffect above handles it for the *current* rootDir before it changes.

        try {
            const files = await invoke<FileEntry[]>("read_dir", { path });
            setRootFiles(files);
            setRootDir(path);
            setShouldShowSidebar(true);

            // Restore state
            const savedState = localStorage.getItem(`workspace_state:${path}`);
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    // Check if it's new layout format
                    if (parsed.layout) {
                        updateLayout(parsed.layout);
                        // Ensure minimal valid layout if corrupted
                        if (!parsed.activeGroupId) {
                             setActiveGroupId('1');
                        } else {
                            setActiveGroupId(parsed.activeGroupId);
                        }

                        // Need to verify this recursion helper or simple walker
                        const restoreTabs = (node: LayoutNode) => {
                            if (node.type === 'group') {
                                if (node.activePath) onLoadFile(node.activePath, false);
                                // We should also ensure tabs are loaded?
                                // onLoadFile checks ensureDocumentLoaded.
                                node.tabs.forEach(t => onLoadFile(t, false));
                            } else {
                                node.children.forEach(restoreTabs);
                            }
                        }
                        restoreTabs(parsed.layout);
                    } else if (parsed.groups) {
                        // Migration from old flattened groups to new layout
                        // Put first group in root, ignore others or try to split?
                        // Simplest: take the first group as root.
                        const oldGroup = parsed.groups[0];
                         updateLayout({
                             id: oldGroup.id || '1',
                             type: 'group',
                             tabs: oldGroup.tabs || [],
                             activePath: oldGroup.activePath || null,
                             isReadOnly: !!oldGroup.isReadOnly
                         });
                         setActiveGroupId(oldGroup.id || '1');
                         if (oldGroup.activePath) onLoadFile(oldGroup.activePath, false);
                    }
                } catch (e) {
                    console.error("Failed to restore workspace state", e);
                    updateLayout({ id: '1', type: 'group', tabs: [], activePath: null, isReadOnly: false });
                    setActiveGroupId('1');
                }
            } else {
                updateLayout({ id: '1', type: 'group', tabs: [], activePath: null, isReadOnly: false });
                setActiveGroupId('1');
            }

            // Update workspaces list to move current to top
            setWorkspaces(prev => {
                const now = Date.now();
                const existing = prev.find(w => w.path === path);
                const isPinned = existing?.pinned || false;
                // Preserve existing active state, do not auto-activate
                const isActive = existing?.active || false;

                // Filter out current path to re-add at top/sort
                const filtered = prev.filter(w => w.path !== path);
                const name = path.split(/[\\/]/).pop() || path;
                const newEntry = { path, name, lastOpened: now, pinned: isPinned, active: isActive };

                const all = [newEntry, ...filtered];
                 return all.sort((a, b) => {
                    if (a.pinned === b.pinned) return b.lastOpened - a.lastOpened;
                    return a.pinned ? -1 : 1;
                }).slice(0, 20);
            });

            return true;
        } catch (err) {
            console.error("Failed to load workspace", err);
            return false;
        }
    }, [updateLayout, setActiveGroupId, onLoadFile]);

    const openFolder = useCallback(async () => {
         try {
            const selected = await open({ directory: true, multiple: false });
            if (typeof selected === 'string') {
                await loadWorkspace(selected);
                return true;
            }
        } catch (err) { console.error(err); }
        return false;
    }, [loadWorkspace]);

    const removeWorkspace = useCallback((path: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setWorkspaces(prev => prev.filter(w => w.path !== path));
    }, []);

    const togglePinWorkspace = useCallback((path: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setWorkspaces(prev => {
            const next = prev.map(w => w.path === path ? { ...w, pinned: !w.pinned } : w);
            return next.sort((a, b) => {
                if (a.pinned === b.pinned) return b.lastOpened - a.lastOpened;
                return a.pinned ? -1 : 1;
            });
        });
    }, []);

    const toggleActiveWorkspace = useCallback((path: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setWorkspaces(prev => {
            return prev.map(w => w.path === path ? { ...w, active: !w.active } : w);
        });
    }, []);

    const createFile = useCallback(async (parentPath: string | null, name: string) => {
        const targetDir = parentPath || rootDir;
        if (!targetDir) return false;

        try {
            const sep = targetDir.includes("\\") ? "\\" : "/";
            const newPath = `${targetDir}${sep}${name}`;
            await invoke("save_content", { path: newPath, content: "" });
            if (targetDir === rootDir && rootDir) await loadWorkspace(rootDir);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }, [rootDir, loadWorkspace]);

    const createFolder = useCallback(async (parentPath: string | null, name: string) => {
        const targetDir = parentPath || rootDir;
        if (!targetDir) return false;

        try {
            const sep = targetDir.includes("\\") ? "\\" : "/";
            const newPath = `${targetDir}${sep}${name}`;
            await invoke("create_directory", { path: newPath });
            if (targetDir === rootDir && rootDir) await loadWorkspace(rootDir);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }, [rootDir, loadWorkspace]);

    const deleteItem = useCallback(async (path: string) => {
         try {
            await invoke("delete_item", { path });
             if (rootDir && rootFiles.some(f => f.path === path)) {
                  await loadWorkspace(rootDir);
             }
             return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }, [rootDir, rootFiles, loadWorkspace]);

    return {
        rootDir,
        setRootDir,
        rootFiles,
        workspaces,
        loadWorkspace,
        removeWorkspace,
        togglePinWorkspace,
        toggleActiveWorkspace,
        createFile,
        createFolder,
        deleteItem,
        openFolder,
        shouldShowSidebar,
        setShouldShowSidebar
    };
}
