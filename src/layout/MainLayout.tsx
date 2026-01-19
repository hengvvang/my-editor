import React, { useRef, useState, useEffect, useCallback } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { save, confirm } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

import { TitleBar } from "./TitleBar";
import { LayoutRenderer } from "../features/editor/components/LayoutRenderer";
import { EditorGroup } from "../features/editor/components/EditorGroup";
import { Sidebar } from "../features/sidebar/components/Sidebar";
import { SettingsDialog } from "../features/settings/components/SettingsDialog";
import { Tab, GroupState } from "../features/editor/types";

// Contexts
import { useSidebarContext } from '../features/sidebar/context/SidebarContext';
import { useEditorContext } from '../features/editor/context/EditorContext';
import { useWorkspaceContext } from '../features/workspace/context/WorkspaceContext';
import { useDocumentContext } from '../features/documents/context/DocumentContext';

const appWindow = getCurrentWebviewWindow();

export const MainLayout: React.FC = () => {
    // Contexts
    const {
        isOpen: sidebarOpen, setIsOpen: setSidebarOpen,
        width: sidebarWidth, setWidth: setSidebarWidth
    } = useSidebarContext();

    const {
        layout, activeGroupId, groups, resizeSplit,
        setActiveGroupId, openTab, closeTab, switchTab, splitGroup, closeGroup, toggleLock,
        getViewState, setViewState, copyViewState, clearViewState,
        registerGetSelection
    } = useEditorContext();

    const {
        documents, updateDoc, saveDocument, createVirtualDocument, removeDocument,
        ensureDocumentLoaded
    } = useDocumentContext();

    const {
        rootDir, workspaces, loadWorkspace, toggleActiveWorkspace,
        shouldShowSidebar, setShouldShowSidebar
    } = useWorkspaceContext();

    // Local State
    const [isMaximized, setIsMaximized] = useState(false);
    const groupsContainerRef = useRef<HTMLDivElement>(null);

    // Sidebar Resize State
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
    const [ghostX, setGhostX] = useState(sidebarWidth);

    // Sidebar Visibility Effect
    useEffect(() => {
        if (shouldShowSidebar && !sidebarOpen) {
            setSidebarOpen(true);
            setShouldShowSidebar(false); // consume
        }
    }, [shouldShowSidebar, sidebarOpen, setSidebarOpen, setShouldShowSidebar]);

    // Maximize Window Listener
    useEffect(() => {
        const updateMaximizedState = async () => {
            setIsMaximized(await appWindow.isMaximized());
        };
        updateMaximizedState();
        const unlistenPromise = appWindow.onResized(updateMaximizedState);
        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, []);

    // Sidebar Resize Handlers
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
    }, [isDraggingSidebar, setSidebarWidth]);

    // Save Handling
    const handleSave = async (path: string, groupId: string) => {
        if (path.startsWith("untitled:")) {
            if (path.includes('typing-practice')) return;

            try {
                let defaultPath = 'drawing.excalidraw';
                if (rootDir) {
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
                        try {
                            await invoke("fs_write_file", { path: selectedPath, content: doc.content });
                            await ensureDocumentLoaded(selectedPath);
                            setActiveGroupId(groupId);
                            openTab(selectedPath, groupId);
                            closeTab(path, groupId);
                            removeDocument(path);
                        } catch (e) { console.error("Save failed", e); }
                    }
                }
            } catch (err) {
                console.error("Failed to save untitled file", err);
            }
        } else {
            saveDocument(path);
        }
    };

    // ViewState Manager Object for EditorGroup
    const viewStateManager = React.useMemo(() => ({
        getViewState,
        setViewState,
        copyViewState,
        clearViewState
    }), [getViewState, setViewState, copyViewState, clearViewState]);

    // Render Group Function
    const renderNodeGroup = useCallback((group: GroupState, index: number) => {
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
                    groupIndex={index}
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
                        if (path.startsWith("untitled:")) removeDocument(path);
                    }}
                    onContentChange={(val) => {
                        if (group.activePath) updateDoc(group.activePath, { content: val, isDirty: true });
                    }}
                    onSave={() => group.activePath && handleSave(group.activePath, group.id)}
                    onSplit={(dir) => {
                        const newGroupId = Date.now().toString();
                        copyViewState(group.id, newGroupId);
                        splitGroup(group.id, dir, newGroupId);
                    }}
                    onToggleLock={() => toggleLock(group.id)}
                    onCloseGroup={groups.length > 1 ? () => {
                        closeGroup(group.id);
                        clearViewState(group.id);
                    } : undefined}
                    rootDir={rootDir}
                    onOpenFile={(path) => {
                        ensureDocumentLoaded(path).then(l => l && openTab(path));
                    }}
                    viewStateManager={viewStateManager}
                    onRegisterGetSelection={registerGetSelection}
                    onQuickDraw={() => {
                        const timestamp = new Date().getTime();
                        const virtualPath = `untitled:drawing-${timestamp}.excalidraw`;
                        const initialContent = JSON.stringify({
                            type: "excalidraw", version: 2, source: "typoly", elements: [],
                            appState: { viewBackgroundColor: "#ffffff", gridSize: null }, files: {}
                        }, null, 2);
                        createVirtualDocument(virtualPath, initialContent, "Untitled Drawing");
                        setActiveGroupId(group.id);
                        openTab(virtualPath, group.id);
                    }}
                    onQuickTyping={() => {
                        const timestamp = new Date().getTime();
                        const virtualPath = `untitled:typing-practice-${timestamp}`;
                        createVirtualDocument(virtualPath, JSON.stringify({}), "Typing Practice");
                        setActiveGroupId(group.id);
                        openTab(virtualPath, group.id);
                    }}
                />
            </div>
        );
    }, [activeGroupId, documents, groups.length, setActiveGroupId, switchTab, closeTab, removeDocument, updateDoc, handleSave, copyViewState, splitGroup, toggleLock, closeGroup, clearViewState, rootDir, ensureDocumentLoaded, openTab, viewStateManager, registerGetSelection, createVirtualDocument]);

    // Close App Handler
    const handleCloseApp = useCallback(async () => {
        try {
            const unsaved = Object.values(documents).filter(d => d.isDirty);
            if (unsaved.length > 0) {
                const confirmed = await confirm(
                    `You have ${unsaved.length} unsaved documents.\nAre you sure you want to exit and discard changes?`,
                    { title: 'Unsaved Changes', kind: 'warning', okLabel: 'Exit', cancelLabel: 'Cancel' }
                );
                if (confirmed) await appWindow.destroy();
            } else {
                await appWindow.destroy();
            }
        } catch (e) {
            console.error("Failed to close/destroy window:", e);
            await appWindow.close();
        }
    }, [documents]);

    return (
        <div className="h-screen w-screen bg-white flex overflow-hidden text-slate-900">
            {/* Sidebar */}
            {sidebarOpen && (
                <div
                    className="relative flex-shrink-0 h-full border-r border-slate-200"
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <div className="h-full w-full overflow-hidden">
                        <Sidebar />
                    </div>

                    {/* Drag Handle */}
                    <div
                        className="absolute top-0 right-0 bottom-0 w-[12px] cursor-col-resize z-50 flex justify-center items-center group transition-colors outline-none"
                        style={{ right: '-6px' }}
                        onMouseDown={handleSidebarResizeStart}
                    >
                        <div className={`w-[1px] h-full transition-colors pointer-events-none ${isDraggingSidebar ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-blue-400'}`} />
                    </div>

                    {/* Ghost Divider */}
                    {isDraggingSidebar && (
                        <div
                            className="fixed top-0 bottom-0 w-[1px] border-l-2 border-blue-500 border-dashed z-[9999] pointer-events-none"
                            style={{ left: ghostX }}
                        />
                    )}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full bg-white relative overflow-hidden">
                <SettingsDialog />
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
};
