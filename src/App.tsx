import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Menu, Minus, Square, X } from "lucide-react";

import { LayoutRenderer } from "./components/layout/LayoutRenderer";
import { EditorGroup } from "./components/EditorGroup";
import { Sidebar } from "./components/Sidebar";
import { Tab, GroupState } from "./types";
import "./styles.css";

import { useDocuments } from "./hooks/useDocuments";
import { useEditorGroups } from "./hooks/useEditorGroups";
import { useWorkspace } from "./hooks/useWorkspace";
import { useSidebar } from "./hooks/useSidebar";
import { useOutline } from "./hooks/useOutline";
import { useSearch } from "./hooks/useSearch";


const appWindow = getCurrentWebviewWindow()

function App() {
    // --- State Hooks ---
    const {
        documents,
        ensureDocumentLoaded,
        updateDoc,
        saveDocument
    } = useDocuments();

    const {
        layout,
        groups, // Flat list for checking active path etc
        // setGroups, // Deprecated
        activeGroupId,
        setActiveGroupId,
        // resizingGroupIndex,
        // setResizingGroupIndex,
        openTab,
        closeTab,
        switchTab,
        splitGroup,
        resizeSplit,
        closeGroup,
        toggleLock,
        updateLayout
    } = useEditorGroups();

    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        // Track window maximization state
        const updateState = async () => {
            try {
                const max = await appWindow.isMaximized();
                setIsMaximized(max);
            } catch (e) {
                console.error("Failed to check max state", e);
            }
        };

        updateState();

        const unlistenPromise = appWindow.onResized(updateState);

        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, []);

    // Wrapper for loading a file that also adds it to the active group
    const loadFile = useCallback(async (path: string, addToGroup = true) => {
        const loaded = await ensureDocumentLoaded(path);
        if (loaded && addToGroup) {
            openTab(path);
        }
        return loaded;
    }, [ensureDocumentLoaded, openTab]);

    const openFileAtLine = async (path: string, _line: number) => {
        await loadFile(path);
        // TODO: Implement scroll to line mechanism
        // This requires communicating with the CodeMirror instance inside EditorGroup
    };

    const {
        rootDir,
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
    } = useWorkspace(layout, activeGroupId, updateLayout, setActiveGroupId, loadFile);

    const {
        isOpen: sidebarOpen,
        setIsOpen: setSidebarOpen,
        width: sidebarPanelWidth,
        activeTab: activeSideTab,
        setActiveTab: setActiveSideTab,
        startResizing: startSidebarResizing
    } = useSidebar();

    const outline = useOutline(documents, groups, activeGroupId);

    const search = useSearch();

    // Sync sidebar open state when workspace loads
    useEffect(() => {
        if (shouldShowSidebar) {
            setSidebarOpen(true);
            setShouldShowSidebar(false);
        }
    }, [shouldShowSidebar, setSidebarOpen, setShouldShowSidebar]);

    const groupsContainerRef = useRef<HTMLDivElement>(null);

    // Handle Split Resizing - Deprecated in favor of recursive internal resizing
    // useLayoutResizing(resizingGroupIndex, setResizingGroupIndex, groups, setGroups, groupsContainerRef);

    // --- Helper ---
    function getOpenFilePath() {
        const group = groups.find(g => g.id === activeGroupId);
        return group?.activePath || null;
    }

    // --- Layout Renderer ---
    const renderNodeGroup = (group: GroupState, index: number) => {
        const doc = group.activePath && documents[group.activePath];
        const groupTabs: Tab[] = group.tabs.map(p => {
            const d = documents[p];
            if (d) return { path: d.path, name: d.name, content: d.content, originalContent: d.originalContent, isDirty: d.isDirty };
            return { path: p, name: p.split(/[\\/]/).pop() || "Loading", content: "", originalContent: "", isDirty: false };
        });

        return (
            <div
                key={group.id}
                className="flex flex-col min-w-0 min-h-0 h-full w-full"
                onClick={() => setActiveGroupId(group.id)}
            >
                <EditorGroup
                    groupId={group.id}
                    groupIndex={index} // Just used for color cycling
                    isActiveGroup={group.id === activeGroupId}
                    tabs={groupTabs}
                    activePath={group.activePath}
                    content={doc ? doc.content : ""}
                    isReadOnly={group.isReadOnly}
                    onSwitchTab={(path) => switchTab(group.id, path)}
                    onCloseTab={(e, path) => {
                        e.stopPropagation();
                        closeTab(path, group.id);
                    }}
                    onContentChange={(val) => {
                        if (group.activePath) updateDoc(group.activePath, { content: val, isDirty: true });
                    }}
                    onSave={() => group.activePath && saveDocument(group.activePath)}
                    onSplit={(dir) => splitGroup(group.id, dir)}
                    onToggleLock={() => toggleLock(group.id)}
                    onCloseGroup={groups.length > 1 ? () => closeGroup(group.id) : undefined}
                    rootDir={rootDir}
                />
            </div>
        );
    };

    const activeGroupFiles = useMemo(() =>
        groups.find(g => g.id === activeGroupId)?.tabs || [],
        [groups, activeGroupId]);

    return (
        <div className="h-screen w-screen bg-white flex overflow-hidden text-slate-900">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                width={sidebarPanelWidth}
                activeSideTab={activeSideTab}
                onActiveSideTabChange={setActiveSideTab}
                rootDir={rootDir}
                rootFiles={rootFiles}
                currentPath={getOpenFilePath()}
                onOpenFile={loadFile}
                onOpenFileAtLine={openFileAtLine}
                onOpenFolder={openFolder}
                outline={outline}
                search={search}
                onResizeStart={startSidebarResizing}
                workspaces={workspaces}
                onSwitchWorkspace={loadWorkspace}
                onRemoveWorkspace={removeWorkspace}
                onTogglePinWorkspace={togglePinWorkspace}
                onToggleActiveWorkspace={toggleActiveWorkspace}
                onCreateFile={createFile}
                onCreateFolder={createFolder}
                onDeleteItem={deleteItem}
                activeGroupFiles={activeGroupFiles}
            />

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Top Title Bar / Controls */}
                <div className="h-[35px] border-b border-slate-200 flex items-center justify-between px-2 shrink-0 bg-white z-10">
                    {/* Left: Menu & Filename */}
                    <div className="flex items-center gap-2 z-20 min-w-0 shrink-0">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Menu size={16} /></button>
                        <div className="text-xs font-medium text-slate-600 select-none ml-1 truncate max-w-[300px]" title={groups.find(g => g.id === activeGroupId)?.activePath || "Typoly"}>
                            {groups.find(g => g.id === activeGroupId)?.activePath?.split(/[\\/]/).pop() || "Typoly"}
                        </div>
                    </div>

                    {/* Center: Drag Region */}
                    <div className="flex-1 h-full mx-2" data-tauri-drag-region />

                    {/* Right: Workspaces & Controls */}
                    <div className="flex items-center gap-3 z-50 shrink-0">
                        {/* Active Workspaces Shortcuts */}
                        {workspaces.filter(w => w.active).length > 0 && (
                            <div className="flex items-center gap-1.5" data-tauri-drag-region>
                                {workspaces.filter(w => w.active).map(ws => (
                                    <div key={ws.path} className="relative group">
                                        <button
                                            onClick={() => loadWorkspace(ws.path)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                toggleActiveWorkspace && toggleActiveWorkspace(ws.path, e);
                                            }}
                                            className={`
                                                flex items-center justify-center min-w-[32px] px-2 h-6 rounded text-[10px] font-bold transition-all relative
                                                ${ws.path === rootDir
                                                    ? 'bg-green-100 text-green-700 ring-1 ring-green-300 shadow-sm'
                                                    : 'bg-white text-green-600 border border-green-200 hover:bg-green-50 hover:border-green-300 hover:shadow-sm'
                                                }
                                            `}
                                            title={`Switch to: ${ws.name}\n${ws.path}\nRight-click to deactivate`}
                                        >
                                            {ws.name.slice(0, 1).toUpperCase()}
                                            {/* Status Dot */}
                                            {ws.path === rootDir && (
                                                <div className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 bg-green-500 rounded-full border border-white" />
                                            )}
                                        </button>

                                        {/* Unstar / Deactivate Button (appears on hover) */}
                                        <button
                                            onClick={(e) => toggleActiveWorkspace && toggleActiveWorkspace(ws.path, e)}
                                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-200 hover:bg-red-500 text-slate-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm cursor-pointer"
                                            title="Deactivate Workspace"
                                        >
                                            <X size={8} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

                        <div className="flex items-center gap-1">
                            <button onClick={() => appWindow.minimize()} className="p-2 hover:bg-slate-100 rounded cursor-pointer"><Minus size={14} /></button>
                            <button
                                onClick={async () => {
                                    if (isMaximized) {
                                        await appWindow.unmaximize();
                                    } else {
                                        await appWindow.maximize();
                                    }
                                    // State will be updated by onResized event
                                }}
                                className="p-2 hover:bg-slate-100 rounded cursor-pointer"
                                title={isMaximized ? "Restore" : "Maximize"}
                            >
                                {isMaximized ? (
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
                                        <path d="M3.5 3.5V1.5H10.5V8.5H8.5" />
                                        <rect x="1.5" y="3.5" width="7" height="7" />
                                    </svg>
                                ) : (
                                    <Square size={12} />
                                )}
                            </button>
                            <button onClick={() => appWindow.close()} className="p-2 hover:bg-red-500 hover:text-white rounded cursor-pointer"><X size={14} /></button>
                        </div>
                    </div>
                </div>

                {/* Editors Container */}
                <div className="flex-1 flex overflow-hidden" ref={groupsContainerRef}>
                    <LayoutRenderer
                        node={layout}
                        index={0}
                        path={[]}
                        renderGroup={renderNodeGroup}
                        resizeSplit={resizeSplit}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
