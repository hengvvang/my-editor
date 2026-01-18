import React from 'react';
import { Menu, X, Minus, Square } from 'lucide-react';
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { GroupState } from '../features/editor/types';
import { Workspace } from '../features/sidebar/types';

const appWindow = getCurrentWebviewWindow();

interface TitleBarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeGroupId: string;
    groups: GroupState[];
    workspaces: Workspace[];
    rootDir: string | null;
    loadWorkspace: (path: string) => void;
    toggleActiveWorkspace?: (path: string, e: React.MouseEvent) => void;
    isMaximized: boolean;
    onCloseApp: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
    sidebarOpen,
    setSidebarOpen,
    activeGroupId,
    groups,
    workspaces,
    rootDir,
    loadWorkspace,
    toggleActiveWorkspace,
    isMaximized,
    onCloseApp
}) => {
    const activeGroup = groups.find(g => g.id === activeGroupId);
    const activePath = activeGroup?.activePath;
    const fileName = activePath?.split(/[\\/]/).pop() || "Typoly";
    const fullTitle = activePath || "Typoly";

    const handleMinimize = () => appWindow.minimize();
    const handleMaximizeToggle = async () => {
        if (isMaximized) {
            await appWindow.unmaximize();
        } else {
            await appWindow.maximize();
        }
    };

    return (
        <div className="h-[35px] border-b border-slate-200 flex items-center justify-between px-2 shrink-0 bg-white z-10 select-none">
            {/* Left: Menu & Filename */}
            <div className="flex items-center gap-2 z-20 min-w-0 shrink-0">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                >
                    <Menu size={16} />
                </button>
                <div
                    className="text-xs font-medium text-slate-600 select-none ml-1 truncate max-w-[300px]"
                    title={fullTitle}
                >
                    {fileName}
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
                    <button onClick={handleMinimize} className="p-2 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                        <Minus size={14} />
                    </button>
                    <button
                        onClick={handleMaximizeToggle}
                        className="p-2 hover:bg-slate-100 rounded cursor-pointer transition-colors"
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
                    <button onClick={onCloseApp} className="p-2 hover:bg-red-500 hover:text-white rounded cursor-pointer transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
