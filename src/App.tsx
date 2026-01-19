import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { save, confirm } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

import { TitleBar } from "./layout/TitleBar";
import { LayoutRenderer } from "./features/editor/components/LayoutRenderer";
import { EditorGroup } from "./features/editor/components/EditorGroup";
import { Sidebar } from "./features/sidebar/components/Sidebar";
import { Tab, GroupState } from "./features/editor/types";
import "./styles/index.css";
import "./styles/print.css";

import { useDocuments } from "./features/documents/hooks/useDocuments";
import { useEditorGroups } from "./features/editor/hooks/useEditorGroups";
import { useWorkspace } from "./features/workspace/hooks/useWorkspace";
import { useSidebar } from "./features/sidebar/hooks/useSidebar";
import { useOutline } from "./features/sidebar/components/OutlinePane/useOutline";
import { useSearch } from "./features/sidebar/components/SearchPane/useSearch";
import { useEditorViewState } from "./features/editor/hooks/useEditorViewState";
import { SettingsDialog } from "./features/settings/components/SettingsDialog";


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

    // --- Global Command Listener (Workspace Level) ---
    useEffect(() => {
        const handleCommand = async (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail || !detail.action) return;

            switch (detail.action) {
                case 'open-folder':
                    await openFolder();
                    break;
                case 'save-as':
                    // Get currently active file path
                    const currentPath = getOpenFilePath();
                    if (currentPath) {
                        // Trigger save as logic
                        const doc = documents[currentPath];
                        if (doc) {
                            try {
                                const selected = await save({
                                    defaultPath: currentPath
                                });
                                if (selected) {
                                    // Save content to new path
                                    await invoke("save_content", { path: selected, content: doc.content });
                                    // Load new file and replace tab? Or just open new tab?
                                    // Visual Studio Code behavior: Replace current tab with new file.
                                    await loadFile(selected);
                                    // Close old tab if it was untitled? Or keep it?
                                    // Usually Save As replaces the editor context.
                                    // For simplicity, let's just open the new one.
                                    // Ideally we swap the tab.
                                }
                            } catch (e) {
                                console.error("Save As failed", e);
                            }
                        }
                    }
                    break;
            }
        };

        window.addEventListener('editor:action', handleCommand);
        return () => window.removeEventListener('editor:action', handleCommand);
    }, [openFolder, documents, groups, activeGroupId, loadFile]);

    // Sync sidebar open state when workspace loads
    useEffect(() => {
        if (shouldShowSidebar) {
            setSidebarOpen(true);
            setShouldShowSidebar(false);
        }
    }, [shouldShowSidebar, setSidebarOpen, setShouldShowSidebar]);

    const groupsContainerRef = useRef<HTMLDivElement>(null);
    const appContainerRef = useRef<HTMLDivElement>(null);

    // Sidebar Manual Resizing with Ghost Effect
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
    const [ghostX, setGhostX] = useState(260);

    const handleSidebarResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingSidebar(true);
        setGhostX(e.clientX);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        if (!isDraggingSidebar) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Constrain width between 200 and 600
            const newX = Math.max(200, Math.min(e.clientX, 600));
            setGhostX(newX);
        };

        const handleMouseUp = (e: MouseEvent) => {
            setIsDraggingSidebar(false);
            const finalX = Math.max(200, Math.min(e.clientX, 600));
            setSidebarWidth(finalX);

            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingSidebar]);

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
            {/* Manual Flex Layout */}
            {/* Sidebar Pane */}
            {sidebarOpen && (
                <div
                    className="relative flex-shrink-0 h-full border-r border-slate-200"
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <div className="h-full w-full overflow-hidden">
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
                    </div>

                    {/* Drag Handle Overlay - Matching GhostResizeHandle Style */}
                    <div
                        className="absolute top-0 right-0 bottom-0 w-[12px] cursor-col-resize z-50 flex justify-center items-center group transition-colors outline-none"
                        style={{ right: '-6px' }}
                        onMouseDown={handleSidebarResizeStart}
                    >
                        {/* Visual Line: 1px wide, slate-200 by default, changes on hover/active */}
                        <div className={`w-[1px] h-full transition-colors pointer-events-none ${isDraggingSidebar ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-blue-400'}`} />
                    </div>

                    {/* Ghost Divider Line */}
                    {isDraggingSidebar && (
                        <div
                            className="fixed top-0 bottom-0 w-[1px] border-l-2 border-blue-500 border-dashed z-[9999] pointer-events-none"
                            style={{ left: ghostX }}
                        />
                    )}
                </div>
            )}
            <div className="flex-1 flex flex-col min-w-0 h-full bg-white relative overflow-hidden">
                <SettingsDialog />
                {/* Top Title Bar / Controls */}
                <TitleBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeGroupId={activeGroupId}
                    groups={groups}
                    workspaces={workspaces}
                    rootDir={rootDir}
                    loadWorkspace={loadWorkspace}
                    toggleActiveWorkspace={toggleActiveWorkspace}
                    isMaximized={isMaximized}
                    onCloseApp={handleCloseApp}
                />

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
