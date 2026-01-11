import { FolderOpen, X, Zap, ZapOff, Star } from "lucide-react";

interface WorkspacesPaneProps {
    rootDir: string | null;
    workspaces: { path: string; name: string; pinned?: boolean; active?: boolean }[];
    onSwitchWorkspace?: (path: string) => void;
    onRemoveWorkspace?: (path: string, e: React.MouseEvent) => void;
    onTogglePinWorkspace?: (path: string, e: React.MouseEvent) => void;
    onToggleActiveWorkspace?: (path: string, e: React.MouseEvent) => void;
    onOpenFolder: () => void;
}

export const WorkspacesPane: React.FC<WorkspacesPaneProps> = ({
    rootDir,
    workspaces,
    onSwitchWorkspace,
    onRemoveWorkspace,
    onTogglePinWorkspace,
    onToggleActiveWorkspace,
    onOpenFolder
}) => {
    const renderWorkspaceItem = (ws: { path: string; name: string; pinned?: boolean; active?: boolean }) => {
        const isCurrent = ws.path === rootDir;
        const isPinned = ws.pinned && !ws.active;
        const isRecent = !ws.pinned && !ws.active;

        return (
            <div
                key={ws.path}
                onClick={() => !isCurrent && onSwitchWorkspace && onSwitchWorkspace(ws.path)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer group transition-all border
                    ${isCurrent && ws.active ? 'bg-emerald-100 border-emerald-200 text-emerald-900 shadow-sm' : ''}
                    ${isCurrent && !ws.active ? 'bg-white border-blue-200 text-blue-900 shadow-sm ring-1 ring-blue-50' : ''}
                    ${!isCurrent ? 'bg-white/50 hover:bg-white hover:shadow-sm border-transparent hover:border-slate-200 text-slate-700' : ''}
                `}
            >
                <FolderOpen size={16} className={`shrink-0 transition-colors
                    ${isCurrent && ws.active ? 'text-emerald-600 fill-emerald-200' : ''}
                    ${isCurrent && !ws.active ? 'text-blue-600 fill-blue-100' : ''}

                    ${!isCurrent && ws.active ? 'text-emerald-500' : ''}
                    ${!isCurrent && isPinned ? 'text-blue-400' : ''}
                    ${!isCurrent && isRecent ? 'text-amber-400 group-hover:text-amber-500' : ''}

                    ${!isCurrent && !ws.active && !isPinned && !isRecent ? 'text-slate-300 group-hover:text-slate-400' : ''}
                `} />

                <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate flex items-center gap-1
                        ${isCurrent && ws.active ? 'text-emerald-950' : ''}
                        ${isCurrent && !ws.active ? 'text-blue-900' : ''}
                        ${!isCurrent ? 'text-slate-700 group-hover:text-slate-900' : ''}
                    `}>
                        {ws.name}
                        {ws.active && <Zap size={10} className={`${isCurrent ? 'text-emerald-600 fill-emerald-600' : 'text-emerald-500/70 fill-emerald-500/30'}`} />}
                    </div>
                    <div className={`text-xs truncate ${isCurrent ? (ws.active ? 'text-emerald-700/70' : 'text-blue-600/70') : 'text-slate-400 group-hover:text-slate-500'}`}>{ws.path}</div>
                </div>

                <div className={`flex items-center gap-1 transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {onToggleActiveWorkspace && (
                        <button
                            onClick={(e) => onToggleActiveWorkspace(ws.path, e)}
                            className={`p-1.5 rounded hover:bg-white/80 ${ws.active ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}
                            title={ws.active ? "Deactivate Workspace" : "Activate Workspace"}
                        >
                            {ws.active ? <ZapOff size={14} /> : <Zap size={14} />}
                        </button>
                    )}
                    {onTogglePinWorkspace && (
                        <button
                            onClick={(e) => onTogglePinWorkspace(ws.path, e)}
                            className={`p-1.5 rounded hover:bg-white/80 ${ws.pinned ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                            title={ws.pinned ? "Remove from Archive" : "Add to Archive"}
                        >
                            <Star size={14} className={ws.pinned ? "fill-current" : ""} />
                        </button>
                    )}
                    {onRemoveWorkspace && !isCurrent && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveWorkspace(ws.path, e)
                            }}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
                            title="Remove from Recent"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // Using filtered lists for display - Distinct partitions
    // Active List includes Current Workspace if it is active (which it should be)
    // We sort active list to put Current on top if we want, or rely on existing sort
    const activeList = workspaces.filter(w => w.active);

    // Archive List: Show ALL pinned workspaces, regardless of active status
    const pinnedList = workspaces.filter(w => w.pinned);

    // Recent List: Workspaces that are NEITHER ACTIVE NOR PINNED
    const recentList = workspaces.filter(w => !w.active && !w.pinned);

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {/* Active Section */}
                {activeList.length > 0 && (
                    <div className="rounded-lg p-1 border border-emerald-200 bg-emerald-50/60 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.1)]">
                        <h3 className="px-2 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
                            <span>Active</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full">{activeList.length}</span>
                        </h3>
                        <div className="flex flex-col gap-1">
                            {activeList.map(renderWorkspaceItem)}
                        </div>
                    </div>
                )}

                {/* Archive Section - Always Visible */}
                <div className="rounded-lg p-1 border border-blue-200 bg-blue-50/60 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.1)]">
                    <h3 className="px-2 py-2 text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center justify-between">
                        <span>ARCHIVE</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded-full">{pinnedList.length}</span>
                    </h3>
                    <div className="flex flex-col gap-1 min-h-[10px]">
                        {pinnedList.length > 0 ? pinnedList.map(renderWorkspaceItem) : (
                            <div className="text-[10px] text-blue-400/70 italic text-center py-2">No archived workspaces</div>
                        )}
                    </div>
                </div>

                {/* Recent Section */}
                <div className="rounded-lg p-1 border border-amber-200 bg-amber-50/60 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.1)]">
                    <h3 className="px-2 py-2 text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Recent</span>
                        {recentList.length > 0 && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full">{recentList.length}</span>
                        )}
                    </h3>

                    <div className="flex flex-col gap-1">
                        {recentList.map(renderWorkspaceItem)}

                        {recentList.length === 0 && pinnedList.length === 0 && activeList.length === 0 && (
                            <div className="px-4 py-8 text-center text-xs text-slate-400 italic">
                                No recent workspaces
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-white">
                <button
                    onClick={onOpenFolder}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors text-sm font-medium active:transform active:scale-[0.98]"
                >
                    <FolderOpen size={16} />
                    <span>Open Workspace...</span>
                </button>
            </div>
        </div>
    );
};
