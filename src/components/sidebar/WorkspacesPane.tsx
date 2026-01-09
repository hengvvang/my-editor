import React from "react";
import { Database, Info, X } from "lucide-react";

interface WorkspacesPaneProps {
    rootDir: string | null;
    workspaces: { path: string; name: string }[];
    onSwitchWorkspace?: (path: string) => void;
    onRemoveWorkspace?: (path: string, e: React.MouseEvent) => void;
    onOpenFolder: () => void;
}

export const WorkspacesPane: React.FC<WorkspacesPaneProps> = ({
    rootDir,
    workspaces,
    onSwitchWorkspace,
    onRemoveWorkspace,
    onOpenFolder
}) => {
    return (
        <div className="flex flex-col shrink-0 border-t border-slate-200 bg-slate-50 min-h-[120px] max-h-[40%]">
            <div className="h-[30px] flex items-center px-4 font-bold text-slate-500 text-xs tracking-wider uppercase bg-slate-100 border-b border-slate-200 shrink-0 select-none">
                Workspaces
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 min-h-[100px]">
                {/* Active Workspace Card */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-md shadow-sm cursor-default relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                    <Database size={14} className="text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-slate-800 truncate">{rootDir ? rootDir.split(/[\\/]/).pop() : "No Workspace"}</div>
                        <div className="text-[10px] text-slate-400 truncate">{rootDir || "Open a folder to start"}</div>
                    </div>
                </div>

                {/* Recent Workspaces List */}
                {workspaces
                    .filter(w => w.path !== rootDir)
                    .map((ws) => (
                        <div
                            key={ws.path}
                            onClick={() => onSwitchWorkspace && onSwitchWorkspace(ws.path)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-transparent hover:border-slate-200 rounded-md shadow-sm cursor-pointer relative overflow-hidden group opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 group-hover:bg-slate-400" />
                            <Database size={14} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs text-slate-700 truncate">{ws.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{ws.path}</div>
                            </div>
                            {onRemoveWorkspace && (
                                <button
                                    onClick={(e) => onRemoveWorkspace(ws.path, e)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove from Recent"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}

                <button onClick={onOpenFolder} className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-200 mt-1">
                    <span className="font-bold">+</span>
                    <span>Open New Workspace...</span>
                </button>
            </div>

            {/* Footer Info (Merged) */}
            <div className="px-3 py-1.5 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between bg-zinc-50">
                <span className="truncate">Typoly Beta 0.1.0</span>
                <Info size={12} className="opacity-50 hover:opacity-100 cursor-pointer shrink-0" />
            </div>
        </div>
    );
};
