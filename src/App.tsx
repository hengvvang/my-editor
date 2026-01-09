import React, { useEffect, useRef, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Menu, Minus, Square, X, Copy } from "lucide-react";

import { EditorGroup } from "./components/EditorGroup";
import { Sidebar } from "./components/Sidebar";
import { Tab, LayoutNode, GroupState } from "./types";
import "./styles.css";

import { useDocuments } from "./hooks/useDocuments";
import { useEditorGroups } from "./hooks/useEditorGroups";
import { useWorkspace } from "./hooks/useWorkspace";
import { useSidebar } from "./hooks/useSidebar";
import { useOutline } from "./hooks/useOutline";
import { useSearch } from "./hooks/useSearch";
// import { useLayoutResizing } from "./hooks/useLayoutResizing"; // Deprecated

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
    const loadFile = async (path: string, addToGroup = true) => {
        const loaded = await ensureDocumentLoaded(path);
        if (loaded && addToGroup) {
            openTab(path);
        }
        return loaded;
    };

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

    // --- Recursive Layout Renderer ---
    const renderLayout = (node: LayoutNode, index: number, path: number[] = []) => {
        if (node.type === 'group') {
            const group = node;
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
        } else {
            // Split Container
            return (
                <div
                    key={node.id}
                    className={`flex flex-1 min-w-0 min-h-0 h-full w-full ${node.direction === 'horizontal' ? 'flex-row' : 'flex-col'}`}
                >
                    {node.children.map((child, i) => {
                        const size = node.sizes[i]; // Flex grow value
                        return (
                            <React.Fragment key={child.type === 'group' ? child.id : child.id}>
                                {i > 0 && (
                                    <div
                                        className={`${node.direction === 'horizontal' ? 'w-1 cursor-col-resize h-full -ml-[0.5px] -mr-[0.5px]' : 'h-1 cursor-row-resize w-full -mt-[0.5px] -mb-[0.5px]'} z-50 shrink-0 flex justify-center items-center group/resizer bg-transparent hover:bg-blue-400 transition-colors`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();

                                            // Split Resizing Logic
                                            const startX = e.clientX;
                                            const startY = e.clientY;
                                            const startSizes = [...node.sizes];
                                            const parentEl = (e.currentTarget as HTMLElement).parentElement;
                                            if (!parentEl) return;

                                            // The parent flex container size
                                            const rect = parentEl.getBoundingClientRect();
                                            const totalSizePx = node.direction === 'horizontal' ? rect.width : rect.height;
                                            const totalFlex = startSizes.reduce((a, b) => a + b, 0);

                                            const handleMove = (ev: MouseEvent) => {
                                                const currentX = ev.clientX;
                                                const currentY = ev.clientY;
                                                const deltaPx = node.direction === 'horizontal' ? currentX - startX : currentY - startY;

                                                // Convert pixel delta to flex delta
                                                if (totalSizePx === 0) return;
                                                const deltaFlex = deltaPx * (totalFlex / totalSizePx);

                                                const newSizes = [...startSizes];

                                                // We are resizing the specific gap between children[i-1] and children[i]
                                                const prevIndex = i - 1;
                                                const nextIndex = i;

                                                // Check constraints (e.g., minimum size)
                                                const minSizePx = 50;
                                                const minFlex = minSizePx * (totalFlex / totalSizePx);

                                                let verifiedDelta = deltaFlex;

                                                // Limit shrinking of left/top item
                                                if (newSizes[prevIndex] + verifiedDelta < minFlex) {
                                                    verifiedDelta = minFlex - newSizes[prevIndex];
                                                }
                                                // Limit shrinking of right/bottom item
                                                if (newSizes[nextIndex] - verifiedDelta < minFlex) {
                                                    verifiedDelta = newSizes[nextIndex] - minFlex;
                                                }

                                                newSizes[prevIndex] += verifiedDelta;
                                                newSizes[nextIndex] -= verifiedDelta;

                                                resizeSplit(node.id, newSizes);
                                            };

                                            const handleUp = () => {
                                                window.removeEventListener('mousemove', handleMove);
                                                window.removeEventListener('mouseup', handleUp);
                                                document.body.style.cursor = '';
                                                document.body.style.userSelect = '';
                                            };

                                            window.addEventListener('mousemove', handleMove);
                                            window.addEventListener('mouseup', handleUp);
                                            document.body.style.cursor = node.direction === 'horizontal' ? 'col-resize' : 'row-resize';
                                            document.body.style.userSelect = 'none';
                                        }}
                                    >
                                        <div className={`${node.direction === 'horizontal' ? 'w-[1px] h-full' : 'h-[1px] w-full'} bg-slate-200 group-hover/resizer:bg-blue-600`} />
                                    </div>
                                )}
                                <div style={{ flex: `${size} 1 0px`, overflow: 'hidden' }}>
                                    {renderLayout(child, index + i, [...path, i])}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            );
        }
    };

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
                onOpenFile={(path) => loadFile(path)}
                onOpenFileAtLine={openFileAtLine}
                onOpenFolder={openFolder}
                outline={outline}
                search={search}
                onResizeStart={startSidebarResizing}
                workspaces={workspaces}
                onSwitchWorkspace={loadWorkspace}
                onRemoveWorkspace={removeWorkspace}
                onCreateFile={createFile}
                onCreateFolder={createFolder}
                onDeleteItem={deleteItem}
                activeGroupFiles={groups.find(g => g.id === activeGroupId)?.tabs || []}
            />

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Top Title Bar / Controls */}
                <div className="h-[35px] border-b border-slate-200 flex items-center px-2 shrink-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Menu size={16} /></button>
                    </div>
                    {/* Drag Region */}
                    <div className="flex-1 flex items-center justify-center h-full select-none" data-tauri-drag-region>
                        <div className="text-xs font-medium text-slate-500 pointer-events-none">
                            {groups.find(g => g.id === activeGroupId)?.activePath?.split(/[\\/]/).pop() || "Typoly"}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 z-50">
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
                                <div className="relative w-[12px] h-[12px]">
                                    <Square size={9} className="absolute top-0 right-0 fill-none" />
                                    <Square size={9} className="absolute bottom-0 left-0 fill-white bg-slate-900/0" style={{ fill: 'none' }} />
                                    {/* Lucide Square doesn't fill by default. Simulating restore icon with two squares */}
                                    {/* Let's try a better approach: SVG inline for 'restore' which mimics Windows native restore */}
                                    <svg viewBox="0 0 10 10" width="12" height="12" style={{ position: 'absolute', top: 0, left: 0 }}>
                                        <path d="M2.5,2.5 L2.5,9.5 L9.5,9.5 L9.5,2.5 L2.5,2.5 Z M3.5,3.5 L8.5,3.5 L8.5,8.5 L3.5,8.5 L3.5,3.5 Z" fill="currentColor" fillRule="evenodd" />
                                        <path d="M0.5,7.5 L0.5,0.5 L7.5,0.5 L7.5,1.5 L1.5,1.5 L1.5,7.5 L0.5,7.5 Z" fill="currentColor" fillRule="evenodd" />
                                    </svg>
                                </div>
                            ) : (
                                <Square size={12} />
                            )}
                        </button>
                        <button onClick={() => appWindow.close()} className="p-2 hover:bg-red-500 hover:text-white rounded cursor-pointer"><X size={14} /></button>
                    </div>
                </div>

                {/* Editors Container */}
                <div className="flex-1 flex overflow-hidden" ref={groupsContainerRef}>
                    {renderLayout(layout, 0)}
                </div>
            </div>
        </div>
    );
}

export default App;
