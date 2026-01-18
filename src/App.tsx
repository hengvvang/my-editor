import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Menu, Minus, Square, X } from "lucide-react";
import { Panel, PanelGroup, ImperativePanelGroupHandle } from "react-resizable-panels";
import { save, confirm } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

import { LayoutRenderer } from "./features/editor/components/LayoutRenderer";
import { EditorGroup } from "./features/editor/components/EditorGroup";
import { GhostResizeHandle } from "./features/editor/components/GhostResizeHandle";
import { Sidebar } from "./features/sidebar/components/Sidebar";
import { Tab, GroupState } from "./features/editor/types";
import "./styles.css";
import "./print.css";

import { useDocuments } from "./features/documents/hooks/useDocuments";
import { useEditorGroups } from "./features/editor/hooks/useEditorGroups";
import { useWorkspace } from "./features/workspace/hooks/useWorkspace";
import { useSidebar } from "./features/sidebar/hooks/useSidebar";
import { useOutline } from "./features/sidebar/components/OutlinePane/useOutline";
import { useSearch } from "./features/sidebar/components/SearchPane/useSearch";
import { useEditorViewState } from "./features/editor/hooks/useEditorViewState";


const appWindow = getCurrentWebviewWindow()

function App() {
    // --- State Hooks ---
    const {
        documents,
        ensureDocumentLoaded,
        updateDoc,
        saveDocument,
        createVirtualDocument,
        removeDocument
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

    const viewStateManager = useEditorViewState();

    const [isMaximized, setIsMaximized] = useState(false);

    // Track documents for event listeners
    const documentsRef = useRef(documents);
    useEffect(() => { documentsRef.current = documents; }, [documents]);


    // Explicit close handler for the UI button
    const handleCloseApp = useCallback(async () => {
        try {
            const unsaved = Object.values(documentsRef.current).filter(d => d.isDirty);
            if (unsaved.length > 0) {
                const confirmed = await confirm(
                    `You have ${unsaved.length} unsaved documents.\nAre you sure you want to exit and discard changes?`,
                    { title: 'Unsaved Changes', kind: 'warning', okLabel: 'Exit', cancelLabel: 'Cancel' }
                );
                if (confirmed) {
                    await appWindow.destroy();
                }
            } else {
                // Force destroy instead of close to avoid event loop issues on custom titlebars
                await appWindow.destroy();
            }
        } catch (e) {
            console.error("Failed to close/destroy window:", e);
            // Fallback
            await appWindow.close();
        }
    }, []);

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

        // Prevent accidental exit with unsaved changes (System Close / Alt+F4)
        const unlistenClosePromise = appWindow.onCloseRequested(async (event) => {
            const unsaved = Object.values(documentsRef.current).filter(d => d.isDirty);
            if (unsaved.length > 0) {
                event.preventDefault();
                const confirmed = await confirm(
                    `You have ${unsaved.length} unsaved documents.\nAre you sure you want to exit and discard changes?`,
                    { title: 'Unsaved Changes', kind: 'warning', okLabel: 'Exit', cancelLabel: 'Cancel' }
                );
                if (confirmed) {
                    await appWindow.destroy();
                }
            }
        });

        return () => {
            unlistenPromise.then(unlisten => unlisten());
            unlistenClosePromise.then(unlisten => unlisten());
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
        activeTab: activeSideTab,
        setActiveTab: setActiveSideTab,
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
    const appContainerRef = useRef<HTMLDivElement>(null);
    const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);

    // Handle Split Resizing - Deprecated in favor of recursive internal resizing
    // useLayoutResizing(resizingGroupIndex, setResizingGroupIndex, groups, setGroups, groupsContainerRef);

    // --- Helper ---
    function getOpenFilePath() {
        const group = groups.find(g => g.id === activeGroupId);
        return group?.activePath || null;
    }

    // --- Custom Save Logic for Untitled Files ---
    const handleSave = async (path: string, groupId: string) => {
        if (path.startsWith("untitled:")) {
            // Don't allow saving typing practice sessions
            if (path.includes('typing-practice')) {
                console.log("Typing practice sessions are not saved");
                return;
            }

            try {
                // Determine default path properly
                let defaultPath = 'drawing.excalidraw';
                if (rootDir) {
                    // Ensure we use correct separator for the OS (Windows uses backslash, but save dialog might handle forward slash too)
                    // Safe bet is to let Tauri/OS handle it or just concatenate with /.
                    // However, for visual consistency in dialog, backslash is better on Windows.
                    // Simple check:
                    const sep = navigator.userAgent.includes("Windows") ? '\\' : '/';
                    defaultPath = `${rootDir}${sep}drawing.excalidraw`;
                }

                const selectedPath = await save({
                    filters: [{ name: 'Excalidraw', extensions: ['excalidraw', 'excalidraw.json'] }],
                    defaultPath: defaultPath
                });

                if (selectedPath) {
                    const doc = documents[path];
                    if (doc) {
                        // 1. Save content to disk
                        await invoke("save_content", { path: selectedPath, content: doc.content });

                        // 2. Load it as a real document
                        await ensureDocumentLoaded(selectedPath);

                        // 3. Switch tab in the group
                        // We need to close the old one and open the new one
                        // Ideally we swap them to keep position, but for now:
                        setActiveGroupId(groupId);
                        await openTab(selectedPath); // Adds to group
                        closeTab(path, groupId);     // Removes old

                        // 4. Cleanup virtual doc
                        removeDocument(path);
                    }
                }
            } catch (err) {
                console.error("Failed to save untitled file", err);
            }
        } else {
            saveDocument(path);
        }
    };

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
                    onCloseTab={async (e, path) => {
                        e.stopPropagation();
                        // Check for unsaved changes
                        const doc = documents[path];
                        if (doc && doc.isDirty) {
                            const confirmed = await confirm(
                                `"${doc.name}" has unsaved changes.\nDo you want to discard them?`,
                                { title: 'Close Document', kind: 'warning', okLabel: 'Discard', cancelLabel: 'Cancel' }
                            );
                            if (!confirmed) return;
                        }

                        closeTab(path, group.id);
                        // Cleanup virtual docs immediately
                        if (path.startsWith("untitled:")) {
                            removeDocument(path);
                        }
                    }}
                    onContentChange={(val) => {
                        if (group.activePath) updateDoc(group.activePath, { content: val, isDirty: true });
                    }}
                    onSave={() => group.activePath && handleSave(group.activePath, group.id)}
                    onSplit={(dir) => {
                        const newGroupId = Date.now().toString();
                        // Copy editor preferences (font, vim mode, etc.) to new group
                        viewStateManager.copyViewState(group.id, newGroupId);
                        splitGroup(group.id, dir, newGroupId);
                    }}
                    onToggleLock={() => toggleLock(group.id)}
                    onCloseGroup={groups.length > 1 ? () => {
                        closeGroup(group.id);
                        viewStateManager.clearViewState(group.id);
                    } : undefined}
                    rootDir={rootDir}
                    onOpenFile={(path) => loadFile(path)}
                    viewStateManager={viewStateManager}
                    onQuickDraw={() => {
                        const timestamp = new Date().getTime();
                        const virtualPath = `untitled:drawing-${timestamp}.excalidraw`;
                        // Create empty excalidraw JSON
                        const initialContent = JSON.stringify({
                            type: "excalidraw",
                            version: 2,
                            source: "typoly",
                            elements: [],
                            appState: { viewBackgroundColor: "#ffffff", gridSize: null },
                            files: {}
                        }, null, 2);

                        createVirtualDocument(virtualPath, initialContent, "Untitled Drawing");
                        setActiveGroupId(group.id);
                        openTab(virtualPath);
                    }}
                    onQuickTyping={() => {
                        const timestamp = new Date().getTime();
                        const virtualPath = `untitled:typing-practice-${timestamp}`;
                        // Create a minimal placeholder content with defaults
                        const initialContent = JSON.stringify({});

                        createVirtualDocument(virtualPath, initialContent, "Typing Practice");
                        setActiveGroupId(group.id);
                        openTab(virtualPath);
                    }}
                />
            </div>
        );
    };

    const activeGroupFiles = useMemo(() =>
        groups.find(g => g.id === activeGroupId)?.tabs || [],
        [groups, activeGroupId]);

    return (
        <div ref={appContainerRef} className="h-screen w-screen bg-white flex overflow-hidden text-slate-900">
            <PanelGroup ref={panelGroupRef} direction="horizontal" autoSaveId="main-layout">
                {/* Sidebar Panel */}
                {sidebarOpen && (
                    <>
                        <Panel defaultSize={20} minSize={15} maxSize={40} id="sidebar">
                            <Sidebar
                                isOpen={sidebarOpen}
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
                                workspaces={workspaces}
                                onSwitchWorkspace={loadWorkspace}
                                onRemoveWorkspace={removeWorkspace}
                                onTogglePinWorkspace={togglePinWorkspace}
                                onToggleActiveWorkspace={toggleActiveWorkspace}
                                onCreateFile={createFile}
                                onCreateFolder={createFolder}
                                onDeleteItem={deleteItem}
                                activeGroupFiles={activeGroupFiles}
                                onOpenCalendar={() => {
                                    // Open default calendar
                                    const calendarPath = "untitled:Schedule.cal";
                                    // Check if already open in active group or anywhere?
                                    // Simple logic: If not exists, create with empty default. Then open.
                                    if (!documents[calendarPath]) {
                                        const initialContent = JSON.stringify({
                                            initialView: 'dayGridMonth',
                                            events: []
                                        }, null, 2);
                                        createVirtualDocument(calendarPath, initialContent, "Schedule");
                                    }
                                    openTab(calendarPath, activeGroupId || groups[0]?.id);
                                }}
                                onQuickTyping={(dictId, chapter, config, forceNew = false) => {
                                    const group = groups.find(g => g.id === activeGroupId);

                                    // If not forcing new, check if we can update current
                                    if (!forceNew && group?.activePath?.includes('typing-practice')) {
                                        const newContent = JSON.stringify({
                                            dictId,
                                            chapter,
                                            config
                                        }, null, 2);
                                        updateDoc(group.activePath, { content: newContent });
                                        return;
                                    }

                                    // Create new (default behavior)
                                    const timestamp = new Date().getTime();
                                    const virtualPath = `untitled:typing-practice-${timestamp}`;
                                    const initialContent = JSON.stringify({
                                        dictId,
                                        chapter,
                                        config
                                    }, null, 2);
                                    createVirtualDocument(virtualPath, initialContent, "Typing Practice");

                                    // Ensure we open in the active group
                                    if (group) {
                                        // If we are updating logic but forced new, openTab will switch to it
                                        openTab(virtualPath);
                                    }
                                }}
                                onQuickDraw={(config) => {
                                    console.log("App: onQuickDraw called with config", config);

                                    // Check if we are updating existing active drawing
                                    // We need to type cast config to access 'forceNew' until we update types formally
                                    const forceNew = (config as any).forceNew;

                                    // Find active group and path
                                    let targetGroup = activeGroupId ? groups.find(g => g.id === activeGroupId) : groups[0];
                                    if (!targetGroup && groups.length > 0) targetGroup = groups[0];

                                    const activePath = targetGroup?.activePath;

                                    // If we are active (viewing a drawing) and NOT forcing new, let's update settings
                                    if (!forceNew && activePath && activePath.endsWith('.excalidraw')) {
                                        console.log("App: Updating existing drawing settings...", activePath);
                                        const doc = documents[activePath];
                                        if (doc) {
                                            try {
                                                const currentJson = JSON.parse(doc.content);
                                                // Update only appState settings
                                                const newAppState = {
                                                    ...currentJson.appState,
                                                    viewBackgroundColor: config?.background || "#ffffff",
                                                    gridSize: config?.grid ? 20 : null,
                                                    gridModeEnabled: !!config?.grid,
                                                    theme: config?.theme || "light"
                                                };

                                                const newContent = JSON.stringify({
                                                    ...currentJson,
                                                    appState: newAppState
                                                }, null, 2);

                                                updateDoc(activePath, { content: newContent, isDirty: true });
                                                return; // Done updating
                                            } catch (e) {
                                                console.error("App: Failed to parse/update existing drawing", e);
                                            }
                                        }
                                    }

                                    const timestamp = new Date().getTime();
                                    const virtualPath = `untitled:drawing-${timestamp}.excalidraw`;

                                    const initialContent = JSON.stringify({
                                        type: "excalidraw",
                                        version: 2,
                                        source: "typoly",
                                        elements: [],
                                        appState: {
                                            viewBackgroundColor: config?.background || "#ffffff",
                                            gridSize: config?.grid ? 20 : null,
                                            gridModeEnabled: !!config?.grid,
                                            theme: config?.theme || "light"
                                        },
                                        files: {}
                                    }, null, 2);

                                    createVirtualDocument(virtualPath, initialContent, "Untitled Drawing");

                                    // Robust group ID finding
                                    if (targetGroup) {
                                        console.log("App: Opening tab in group", targetGroup.id);
                                        // Slight delay to ensure virtual doc state might ideally settle (though not strictly required for tab creation)
                                        setTimeout(() => {
                                            openTab(virtualPath, targetGroup!.id);
                                        }, 0);
                                    } else {
                                        console.error("App: No active group found to open drawing");
                                    }
                                }}
                            />
                        </Panel>
                        <GhostResizeHandle
                            containerRef={appContainerRef}
                            orientation="horizontal"
                            minPercent={15}
                            maxPercent={40}
                            onResizeEnd={(val) => {
                                if (panelGroupRef.current) {
                                    panelGroupRef.current.setLayout([val, 100 - val]);
                                }
                            }}
                        />
                    </>
                )}

                {/* Content Area Panel */}
                <Panel defaultSize={80} minSize={40} id="content">
                    <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
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
                                    <button onClick={handleCloseApp} className="p-2 hover:bg-red-500 hover:text-white rounded cursor-pointer"><X size={14} /></button>
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
                </Panel>
            </PanelGroup>
        </div>
    );
}

export default App;
