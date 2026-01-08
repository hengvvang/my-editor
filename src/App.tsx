import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Menu, Minus, Square, X } from "lucide-react";

import { EditorGroup } from "./components/EditorGroup";
import { Sidebar } from "./components/Sidebar";
import { Tab, FileEntry } from "./types";
import "./styles.css";

const appWindow = getCurrentWebviewWindow()

// --- Data Models ---
interface DocState {
    path: string;
    name: string;
    content: string;
    originalContent: string;
    isDirty: boolean;
}

interface GroupState {
    id: string;
    tabs: string[]; // Paths
    activePath: string | null;
    isReadOnly: boolean;
    flex: number;
}

function App() {
    // --- Global Data State ---
    const [documents, setDocuments] = useState<Record<string, DocState>>({});

    // --- Layout State ---
    const [groups, setGroups] = useState<GroupState[]>([{ id: '1', tabs: [], activePath: null, isReadOnly: false, flex: 1 }]);
    const [activeGroupId, setActiveGroupId] = useState('1');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeSideTab, setActiveSideTab] = useState<'explorer' | 'search' | 'outline'>('explorer');
    const [sidebarPanelWidth, setSidebarPanelWidth] = useState(240);
    const [rootDir, setRootDir] = useState<string | null>(null);
    const [rootFiles, setRootFiles] = useState<FileEntry[]>([]);

    const groupsContainerRef = React.useRef<HTMLDivElement>(null);
    const [resizingGroupIndex, setResizingGroupIndex] = useState<number | null>(null);

    // --- Outline ---
    const [outline, setOutline] = useState<{ level: number; text: string; line: number }[]>([]);

    // --- Resizing ---
    const [resizingTarget, setResizingTarget] = useState<'sidebar' | null>(null);

    // --- Helpers ---
    const getActiveDoc = () => {
        const group = groups.find(g => g.id === activeGroupId);
        if (group && group.activePath && documents[group.activePath]) {
            return documents[group.activePath];
        }
        return null;
    };

    const updateDoc = (path: string, updates: Partial<DocState>) => {
        setDocuments(prev => ({
            ...prev,
            [path]: { ...prev[path], ...updates }
        }));
    };

    // --- Outline Effect (based on ACTIVE group's file) ---
    useEffect(() => {
        const doc = getActiveDoc();
        if (!doc) {
            setOutline([]);
            return;
        }
        const lines = doc.content.split('\n');
        const newOutline = [];
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                newOutline.push({
                    level: match[1].length,
                    text: match[2],
                    line: i
                });
            }
        }
        setOutline(newOutline);
    }, [documents, activeGroupId, groups]);


    // --- File Operations ---
    const loadFile = async (path: string) => {
        // 1. Check if doc exists, if not load it
        if (!documents[path]) {
            try {
                const content = await invoke<string>("read_content", { path });
                const name = path.split(/[\\/]/).pop() || "Untitled";
                setDocuments(prev => ({
                    ...prev,
                    [path]: { path, name, content, originalContent: content, isDirty: false }
                }));
            } catch (err) {
                console.error("Failed to load file", err);
                return;
            }
        }

        // 2. Add to active group if not present
        setGroups(prev => prev.map(g => {
            if (g.id === activeGroupId) {
                const tabs = g.tabs.includes(path) ? g.tabs : [...g.tabs, path];
                return { ...g, tabs, activePath: path };
            }
            return g;
        }));
    };

    const handleCloseTab = (e: React.MouseEvent, path: string, groupId: string) => {
        e.stopPropagation();
        setGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                const newTabs = g.tabs.filter(t => t !== path);
                let newActive = g.activePath;
                if (g.activePath === path) {
                    newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
                }
                return { ...g, tabs: newTabs, activePath: newActive };
            }
            return g;
        }));
    };

    const handleSave = async (groupId: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group || !group.activePath) return;
        const doc = documents[group.activePath];
        if (!doc) return;

        try {
            await invoke("save_content", { path: doc.path, content: doc.content });
            updateDoc(doc.path, { originalContent: doc.content, isDirty: false });
            console.log("Saved", doc.path);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSplit = (sourceGroupId: string) => {
        const newId = Date.now().toString();

        let newFlex = 1;

        setGroups(prev => {
            const sourceGroupIndex = prev.findIndex(g => g.id === sourceGroupId);
            if (sourceGroupIndex === -1) return prev;

            const sourceGroup = prev[sourceGroupIndex];
            newFlex = sourceGroup.flex * 0.5;

            // Create new group
            const newGroup: GroupState = {
                id: newId,
                tabs: [...sourceGroup.tabs],
                activePath: sourceGroup.activePath,
                isReadOnly: sourceGroup.isReadOnly,
                flex: newFlex
            };

            const newGroups = [...prev];
            // Shrink the source group
            newGroups[sourceGroupIndex] = { ...sourceGroup, flex: newFlex };
            // Insert new group after source
            newGroups.splice(sourceGroupIndex + 1, 0, newGroup);
            return newGroups;
        });

        setActiveGroupId(newId);
    };

    const handleToggleLock = (groupId: string) => {
        setGroups(prev => prev.map(g => {
            if (g.id === groupId) return { ...g, isReadOnly: !g.isReadOnly };
            return g;
        }));
    };

    const handleCloseGroup = (groupId: string) => {
        if (groups.length <= 1) return;
        const index = groups.findIndex(g => g.id === groupId);
        if (index === -1) return;

        const groupToRemove = groups[index];
        const newGroups = groups.filter(g => g.id !== groupId);

        if (index > 0) {
            newGroups[index - 1] = { ...newGroups[index - 1], flex: newGroups[index - 1].flex + groupToRemove.flex };
            if (activeGroupId === groupId) setActiveGroupId(newGroups[index - 1].id);
        } else if (newGroups.length > 0) {
            newGroups[0] = { ...newGroups[0], flex: newGroups[0].flex + groupToRemove.flex };
            if (activeGroupId === groupId) setActiveGroupId(newGroups[0].id);
        }
        setGroups(newGroups);
    };

    const handleOpenFolder = async () => {
        try {
            const selected = await open({ directory: true, multiple: false });
            if (typeof selected === 'string') {
                setRootDir(selected);
                const files = await invoke<FileEntry[]>("read_dir", { path: selected });
                setRootFiles(files);
                setSidebarOpen(true);
            }
        } catch (err) { console.error(err); }
    };

    // --- Global Resizing ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingTarget) return;
            if (resizingTarget === 'sidebar') {
                const newWidth = e.clientX - 48; // Activity bar width
                if (newWidth >= 0 && newWidth < 800) setSidebarPanelWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            setResizingTarget(null);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
        if (resizingTarget) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingTarget]);

    // --- Group Resizing Effect ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (resizingGroupIndex === null || !groupsContainerRef.current) return;

            // Current group is index, Next group is index + 1
            const containerWidth = groupsContainerRef.current.clientWidth;
            // Total flex units
            const totalFlex = groups.reduce((sum, g) => sum + g.flex, 0);
            const pixelsPerFlex = containerWidth / totalFlex;

            // Calculate movement in flex units
            const deltaPixels = e.movementX;
            if (deltaPixels === 0) return;

            const deltaFlex = deltaPixels / pixelsPerFlex;

            setGroups(prev => {
                const newGroups = [...prev];
                const leftGroup = newGroups[resizingGroupIndex];
                const rightGroup = newGroups[resizingGroupIndex + 1];

                if (!leftGroup || !rightGroup) return prev;

                // Apply constraints (min width)
                // Let's say min width is 50px?
                // min flex = 50 / pixelsPerFlex
                const minFlex = 100 / pixelsPerFlex;

                let newLeftFlex = leftGroup.flex + deltaFlex;
                let newRightFlex = rightGroup.flex - deltaFlex;

                if (newLeftFlex < minFlex) {
                    const diff = minFlex - newLeftFlex;
                    newLeftFlex = minFlex;
                    newRightFlex -= diff;
                } else if (newRightFlex < minFlex) {
                    const diff = minFlex - newRightFlex;
                    newRightFlex = minFlex;
                    newLeftFlex -= diff;
                }

                newGroups[resizingGroupIndex] = { ...leftGroup, flex: newLeftFlex };
                newGroups[resizingGroupIndex + 1] = { ...rightGroup, flex: newRightFlex };

                return newGroups;
            });
        };

        const handleMouseUp = () => {
            setResizingGroupIndex(null);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        if (resizingGroupIndex !== null) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [resizingGroupIndex, groups]);


    return (
        <div className="h-screen w-screen bg-white flex overflow-hidden text-slate-900">
            {/* Main Layout: Sidebar | Content */}

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
                onOpenFolder={handleOpenFolder}
                outline={outline}
                onResizeStart={() => setResizingTarget('sidebar')}
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
                                        onSwitchTab={(path) => {
                                            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, activePath: path } : g));
                                            setActiveGroupId(group.id);
                                        }}
                                        onCloseTab={(e, path) => handleCloseTab(e, path, group.id)}
                                        onContentChange={(val) => {
                                            if (group.activePath) updateDoc(group.activePath, { content: val, isDirty: true });
                                        }}
                                        onSave={() => handleSave(group.id)}
                                        onSplit={() => handleSplit(group.id)}
                                        onToggleLock={() => handleToggleLock(group.id)}
                                        onCloseGroup={groups.length > 1 ? () => handleCloseGroup(group.id) : undefined}
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

    function getOpenFilePath() {
        const group = groups.find(g => g.id === activeGroupId);
        return group?.activePath || null;
    }
}

export default App;
