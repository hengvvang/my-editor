import React from 'react';
import { FileText, X, Columns, SplitSquareHorizontal, SplitSquareVertical, Lock, Camera, Save } from "lucide-react";
import { Tab } from "../../types";

interface EditorTabsProps {
    tabs: Tab[];
    activePath: string | null;
    onSwitchTab: (path: string) => void;
    onCloseTab: (e: React.MouseEvent, path: string) => void;
    scheme: { color: string; active: string; inactive: string; toolbar: string };
    showSplitPreview: boolean;
    onTogglePreview: () => void;
    onSplit: (direction: 'horizontal' | 'vertical') => void;
    isReadOnly: boolean;
    onToggleLock: () => void;
    showCodeSnap: boolean;
    onToggleCodeSnap: () => void;
    onSave: () => void;
    onCloseGroup?: () => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
    tabs,
    activePath,
    onSwitchTab,
    onCloseTab,
    scheme,
    showSplitPreview,
    onTogglePreview,
    onSplit,
    isReadOnly,
    onToggleLock,
    showCodeSnap,
    onToggleCodeSnap,
    onSave,
    onCloseGroup
}) => {
    return (
        <div className="flex bg-slate-50 border-b border-slate-200 overflow-x-auto overflow-y-hidden no-scrollbar shrink-0 relative h-[35px]">
            {tabs.map(tab => (
                <div
                    key={tab.path}
                    onClick={() => onSwitchTab(tab.path)}
                    className={`group relative flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] border-r border-slate-200 text-xs select-none cursor-pointer ${tab.path === activePath ? 'bg-white text-slate-800 border-t-2 border-t-blue-500' : 'bg-slate-100/50 text-slate-500 hover:bg-slate-200/50 border-t-2 border-t-transparent'}`}
                    style={{ height: '100%' }}
                >
                    <FileText size={14} className={tab.path === activePath ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="truncate flex-1 font-medium">{tab.name}</span>
                    {tab.isDirty && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 group-hover:hidden" />}
                    <button
                        onClick={(e) => onCloseTab(e, tab.path)}
                        className={`p-1 hover:bg-slate-300 hover:text-red-600 transition-colors ${tab.isDirty ? 'hidden group-hover:block' : (tab.path === activePath ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}`}
                    >
                        <X size={14} strokeWidth={2} />
                    </button>
                </div>
            ))}

            {/* Toolbar */}
            <div className={`ml-auto flex items-center pr-2 pl-1 gap-1 border-l border-slate-200 bg-slate-50 h-full sticky right-0 z-40 ${scheme.toolbar}`}>
                <button
                    onClick={onTogglePreview}
                    className={`p-1 rounded-md transition-all ${showSplitPreview ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-white/50 hover:text-slate-600'}`}
                    title="Toggle Split View"
                >
                    <Columns size={14} />
                </button>
                <button
                    onClick={() => onSplit('horizontal')}
                    className="p-1 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all"
                    title="Split Editor Right"
                >
                    <SplitSquareHorizontal size={14} />
                </button>
                <button
                    onClick={() => onSplit('vertical')}
                    className="p-1 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all"
                    title="Split Editor Down"
                >
                    <SplitSquareVertical size={14} />
                </button>
                <button
                    onClick={onToggleLock}
                    className={`p-1 rounded-md transition-all ${isReadOnly ? 'bg-amber-50 text-amber-600' : 'hover:bg-white/50 hover:text-slate-600'}`}
                    title={isReadOnly ? "Unlock Group" : "Lock Group (Read-Only)"}
                >
                    <Lock size={14} />
                </button>

                <button
                    onClick={onToggleCodeSnap}
                    className={`p-1 rounded-md transition-all ${showCodeSnap ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-white/50 hover:text-slate-600'}`}
                    title="Code Snap"
                >
                    <Camera size={14} />
                </button>

                <button onClick={onSave} className="p-1 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all" title="Save File (Ctrl+S)">
                    <Save size={14} />
                </button>
                {onCloseGroup && (
                    <button
                        onClick={onCloseGroup}
                        className="p-1 hover:bg-red-500 hover:text-white rounded-md transition-all ml-1"
                        title="Close Group"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};
