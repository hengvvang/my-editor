import React from 'react';
import { FileText, X, Columns, SplitSquareHorizontal, SplitSquareVertical, Lock, Camera, Save, PenTool, Keyboard } from "lucide-react";
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
    onQuickDraw?: () => void;
    onQuickTyping?: () => void;
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
    onCloseGroup,
    onQuickDraw,
    onQuickTyping
}) => {
    return (
        <div className="flex bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 overflow-x-auto overflow-y-hidden no-scrollbar shrink-0 relative h-[40px] items-end px-1 gap-1">
            {tabs.map(tab => (
                <div
                    key={tab.path}
                    onClick={() => onSwitchTab(tab.path)}
                    className={`group relative flex items-center gap-2 px-3 h-[32px] min-w-[120px] max-w-[200px] text-xs select-none cursor-pointer transition-all duration-200 ${tab.path === activePath ? 'bg-white text-blue-600 font-semibold shadow-sm rounded-t-lg ring-1 ring-slate-200 z-10' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 rounded-t-lg mb-0.5'}`}
                >
                    <FileText size={14} className={`transition-colors duration-200 ${tab.path === activePath ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
                    <span className="truncate flex-1">{tab.name}</span>
                    {tab.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 group-hover:hidden" />}
                    <button
                        onClick={(e) => onCloseTab(e, tab.path)}
                        className={`p-0.5 rounded-md hover:bg-slate-200 hover:text-red-600 transition-all ${tab.isDirty ? 'hidden group-hover:block' : (tab.path === activePath ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}`}
                    >
                        <X size={13} strokeWidth={2.5} />
                    </button>

                    {/* Active Tab Bottom Hider (Optional: Makes it look seamlessly connected to content) */}
                    {tab.path === activePath && (
                        <div className="absolute -bottom-[1px] left-0 right-0 h-[1px] bg-white z-20" />
                    )}
                </div>
            ))}

            {/* Toolbar */}
            <div className={`ml-auto flex items-center pr-2 pl-2 gap-1 h-[32px] mb-1 sticky right-0 z-40 bg-transparent ${scheme.toolbar}`}>
                {/* View Panels Group */}
                <div className="flex items-center gap-1 px-1 bg-slate-200/50 rounded-lg p-0.5 border border-slate-200/50">
                    <button
                        onClick={onTogglePreview}
                        className={`p-1.5 rounded-md transition-all active:scale-95 ${showSplitPreview ? 'bg-white shadow-sm text-indigo-600' : 'hover:bg-white/50 hover:text-slate-600 text-slate-400'}`}
                        title="Toggle Preview (Ctrl+\)"
                    >
                        <Columns size={14} />
                    </button>
                    <button
                        onClick={onToggleCodeSnap}
                        className={`p-1.5 rounded-md transition-all active:scale-95 ${showCodeSnap ? 'bg-white shadow-sm text-violet-600' : 'hover:bg-white/50 hover:text-slate-600 text-slate-400'}`}
                        title="Code Snap (Ctrl+Shift+C)"
                    >
                        <Camera size={14} />
                    </button>
                    {onQuickDraw && (
                        <button
                            onClick={onQuickDraw}
                            className={`p-1.5 rounded-md transition-all active:scale-95 hover:bg-white/50 hover:text-purple-600 text-slate-400`}
                            title="Quick Draw (New Whiteboard)"
                        >
                            <PenTool size={14} />
                        </button>
                    )}
                    {onQuickTyping && (
                        <button
                            onClick={onQuickTyping}
                            className={`p-1.5 rounded-md transition-all active:scale-95 hover:bg-white/50 hover:text-green-600 text-slate-400`}
                            title="Typing Practice"
                        >
                            <Keyboard size={14} />
                        </button>
                    )}
                </div>

                <div className="w-[1px] h-4 bg-slate-300/50 mx-0.5" />

                {/* Split Group */}
                <div className="flex items-center gap-0.5 px-1">
                    <button
                        onClick={() => onSplit('horizontal')}
                        className="p-1.5 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all"
                        title="Split Editor Right"
                    >
                        <SplitSquareHorizontal size={14} />
                    </button>
                    <button
                        onClick={() => onSplit('vertical')}
                        className="p-1.5 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all"
                        title="Split Editor Down"
                    >
                        <SplitSquareVertical size={14} />
                    </button>
                </div>

                <div className="w-[1px] h-4 bg-slate-300/50 mx-0.5" />

                {/* Actions Group */}
                <div className="flex items-center gap-0.5 px-1">
                    <button
                        onClick={onToggleLock}
                        className={`p-1.5 rounded-md transition-all ${isReadOnly ? 'bg-amber-100 text-amber-600' : 'hover:bg-white/50 hover:text-slate-600'}`}
                        title={isReadOnly ? "Unlock Editor" : "Lock Editor (Read-Only)"}
                    >
                        <Lock size={14} />
                    </button>
                    <button
                        onClick={onSave}
                        className="p-1.5 hover:bg-white/50 hover:text-slate-600 rounded-md transition-all"
                        title="Save (Ctrl+S)"
                    >
                        <Save size={14} />
                    </button>
                </div>

                {onCloseGroup && (
                    <>
                        <div className="w-[1px] h-4 bg-slate-300/50 mx-0.5" />
                        <button
                            onClick={onCloseGroup}
                            className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md transition-all"
                            title="Close Editor Group"
                        >
                            <X size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
