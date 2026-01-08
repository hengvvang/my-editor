import React, { useEffect, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Menu, Minus, Square, X } from "lucide-react";

import { EditorGroup } from "./components/EditorGroup";
import { Sidebar } from "./components/Sidebar";
import { Tab } from "./types";
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
        groups,
        setGroups,
        activeGroupId,
        setActiveGroupId,
        resizingGroupIndex,
        setResizingGroupIndex,
        openTab,
        closeTab,
        switchTab,
        splitGroup,
        closeGroup,
        toggleLock
    } = useEditorGroups();

    // Wrapper for loading a file that also adds it to the active group
    const loadFile = async (path: string, addToGroup = true) => {
        const loaded = await ensureDocumentLoaded(path);
        if (loaded && addToGroup) {
            openTab(path);
        }
        return loaded;
    };

    const openFileAtLine = async (path: string, line: number) => {
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
    } = useWorkspace(groups, activeGroupId, setGroups, setActiveGroupId, loadFile);

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

    // Handle Split Resizing
    useEffect(() => {
        if (resizingGroupIndex === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!groupsContainerRef.current) return;

            // We are resizing the split between group[index] and group[index+1]
            // We filter out the splitter divs to get just the group containers
            const children = Array.from(groupsContainerRef.current.children).filter(c => !c.classList.contains("group/resizer")) as HTMLElement[];

            const leftEl = children[resizingGroupIndex];
            const rightEl = children[resizingGroupIndex + 1];

            if (!leftEl || !rightEl) return;

            const leftRect = leftEl.getBoundingClientRect();
            // const rightRect = rightEl.getBoundingClientRect();

            // Calculate new flex ratio
            // We assume the total flex of these two groups is conserved
            const groupLeft = groups[resizingGroupIndex];
            const groupRight = groups[resizingGroupIndex + 1];
            const totalFlex = groupLeft.flex + groupRight.flex;

            // New width for left element
            // e.clientX is current mouse X
            // leftRect.left is the left edge of the left element
            // Width = mouseX - leftEdge
            let newLeftWidth = e.clientX - leftRect.left;

            // Total width of both elements
            const totalWidth = leftEl.offsetWidth + rightEl.offsetWidth;

            // Constrain
            if (newLeftWidth < 50) newLeftWidth = 50;
            if (newLeftWidth > totalWidth - 50) newLeftWidth = totalWidth - 50;

            const newLeftFlex = (newLeftWidth / totalWidth) * totalFlex;
            const newRightFlex = totalFlex - newLeftFlex;

            const newGroups = [...groups];
            newGroups[resizingGroupIndex] = { ...groupLeft, flex: newLeftFlex };
            newGroups[resizingGroupIndex + 1] = { ...groupRight, flex: newRightFlex };

            setGroups(newGroups);
        };

        const handleMouseUp = () => {
            setResizingGroupIndex(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizingGroupIndex, groups, setGroups, setResizingGroupIndex]);

    // --- Helper ---
    function getOpenFilePath() {
        const group = groups.find(g => g.id === activeGroupId);
        return group?.activePath || null;
    }

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
                            {groups.find(g => g.id === activeGroupId)?.activePath?.split(/[\\/]/).pop() || "MarkEditor"}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 z-50">
                        <button onClick={() => appWindow.minimize()} className="p-2 hover:bg-slate-100 rounded cursor-pointer"><Minus size={14} /></button>
                        <button onClick={() => appWindow.toggleMaximize()} className="p-2 hover:bg-slate-100 rounded cursor-pointer"><Square size={12} /></button>
                        <button onClick={() => appWindow.close()} className="p-2 hover:bg-red-500 hover:text-white rounded cursor-pointer"><X size={14} /></button>
                    </div>
                </div>

                {/* Editors Container */}
                <div className="flex-1 flex overflow-hidden" ref={groupsContainerRef}>
                    {groups.map((group, index) => {
                        const doc = group.activePath && documents[group.activePath];
                        // Construct Tab objects for the group
                        const groupTabs: Tab[] = group.tabs.map(p => {
                            const d = documents[p];
                            if (d) return { path: d.path, name: d.name, content: d.content, originalContent: d.originalContent, isDirty: d.isDirty };
                            return { path: p, name: p.split(/[\\/]/).pop() || "Loading", content: "", originalContent: "", isDirty: false };
                        });

                        return (
                            <React.Fragment key={group.id}>
                                {index > 0 && (
                                    <div
                                        className="w-1 cursor-col-resize z-50 h-full shrink-0 -ml-[0.5px] -mr-[0.5px] flex justify-center group/resizer"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setResizingGroupIndex(index - 1);
                                        }}
                                    >
                                        <div className={`w-[1px] h-full transition-colors ${resizingGroupIndex === index - 1 ? 'bg-blue-600' : 'bg-slate-200 group-hover/resizer:bg-blue-400'}`} />
                                    </div>
                                )}
                                <div
                                    className="flex flex-col min-w-[50px] h-full"
                                    style={{ flex: `${group.flex} 1 0%` }}
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
                                        onCloseTab={(e, path) => {
                                            e.stopPropagation();
                                            closeTab(path, group.id);
                                        }}
                                        onContentChange={(val) => {
                                            if (group.activePath) updateDoc(group.activePath, { content: val, isDirty: true });
                                        }}
                                        onSave={() => group.activePath && saveDocument(group.activePath)}
                                        onSplit={() => splitGroup(group.id)}
                                        onToggleLock={() => toggleLock(group.id)}
                                        onCloseGroup={groups.length > 1 ? () => closeGroup(group.id) : undefined}
                                        rootDir={rootDir}
                                    />
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default App;
