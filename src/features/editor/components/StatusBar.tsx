import React from "react";
import { Code, Eye, Type, Keyboard, ListOrdered, Map as MapIcon } from "lucide-react";

interface StatusBarProps {
    language: string;
    groupId: string;
    groupIndex: number;
    isActive: boolean;
    cursorPosition?: { line: number; col: number };
    // Editor options
    isSourceMode?: boolean;
    onToggleSourceMode?: () => void;
    useMonospace?: boolean;
    onToggleMonospace?: () => void;
    isVimMode?: boolean;
    onToggleVimMode?: () => void;
    showLineNumbers?: boolean;
    onToggleLineNumbers?: () => void;
    showMinimap?: boolean;
    onToggleMinimap?: () => void;
}

export const colorSchemes = [
    // 1. Blue (Default)
    { color: 'blue', active: "bg-blue-600 text-white", inactive: "bg-blue-50 text-blue-600 border-t border-blue-100", toolbar: "bg-blue-50/80 text-blue-600" },
    // 2. Teal
    { color: 'teal', active: "bg-teal-600 text-white", inactive: "bg-teal-50 text-teal-600 border-t border-teal-100", toolbar: "bg-teal-50/80 text-teal-600" },
    // 3. Indigo
    { color: 'indigo', active: "bg-indigo-600 text-white", inactive: "bg-indigo-50 text-indigo-600 border-t border-indigo-100", toolbar: "bg-indigo-50/80 text-indigo-600" },
    // 4. Violet
    { color: 'violet', active: "bg-violet-600 text-white", inactive: "bg-violet-50 text-violet-600 border-t border-violet-100", toolbar: "bg-violet-50/80 text-violet-600" },
    // 5. Rose
    { color: 'rose', active: "bg-rose-600 text-white", inactive: "bg-rose-50 text-rose-600 border-t border-rose-100", toolbar: "bg-rose-50/80 text-rose-600" },
    // 6. Amber
    { color: 'amber', active: "bg-amber-500 text-white", inactive: "bg-amber-50 text-amber-600 border-t border-amber-100", toolbar: "bg-amber-50/80 text-amber-600" },
    // 7. Slate
    { color: 'slate', active: "bg-slate-600 text-white", inactive: "bg-slate-100 text-slate-600 border-t border-slate-200", toolbar: "bg-slate-100/80 text-slate-600" },
];

export const StatusBar: React.FC<StatusBarProps> = ({
    language,
    groupId,
    groupIndex,
    isActive,
    cursorPosition,
    isSourceMode,
    onToggleSourceMode,
    useMonospace,
    onToggleMonospace,
    isVimMode,
    onToggleVimMode,
    showLineNumbers,
    onToggleLineNumbers,
    showMinimap,
    onToggleMinimap
}) => {
    const scheme = colorSchemes[groupIndex % colorSchemes.length];
    const colorClass = isActive ? scheme.active : scheme.inactive;

    return (
        <div className={`h-[22px] flex items-center px-2 text-[10px] gap-2 select-none shrink-0 transition-all duration-200 ${colorClass}`}>
            {/* Left: Group info */}
            <span className="font-medium">Group {groupId === '1' ? '1' : groupId.slice(-4)}</span>
            {isActive && <span className="font-bold tracking-wide uppercase text-[9px] bg-white/20 px-1 rounded">Active</span>}

            {/* Center: Editor Mode Toggle */}
            {onToggleSourceMode && (
                <div className="flex items-center gap-0.5 ml-2 bg-black/10 rounded px-0.5 py-0.5">
                    <button
                        onClick={onToggleSourceMode}
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${isSourceMode ? 'bg-white/90 text-slate-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
                        title="Source Mode"
                    >
                        <Code size={10} />
                        <span className="hidden sm:inline">Src</span>
                    </button>
                    <button
                        onClick={onToggleSourceMode}
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${!isSourceMode ? 'bg-white/90 text-slate-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
                        title="Visual Mode"
                    >
                        <Eye size={10} />
                        <span className="hidden sm:inline">Vis</span>
                    </button>
                </div>
            )}

            <div className="flex-1" />

            {/* Right: Editor Options */}
            {onToggleMonospace && (
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onToggleMonospace}
                        className={`p-0.5 rounded transition-all ${useMonospace ? 'bg-white/20' : 'hover:bg-white/10'}`}
                        title={useMonospace ? 'Monospace' : 'Sans-serif'}
                    ><Type size={11} /></button>
                    <button
                        onClick={onToggleVimMode}
                        className={`p-0.5 rounded transition-all ${isVimMode ? 'bg-white/20' : 'hover:bg-white/10'}`}
                        title={isVimMode ? 'Vim ON' : 'Vim OFF'}
                    ><Keyboard size={11} /></button>
                    <button
                        onClick={onToggleLineNumbers}
                        className={`p-0.5 rounded transition-all ${showLineNumbers ? 'bg-white/20' : 'hover:bg-white/10'}`}
                        title={showLineNumbers ? 'Lines ON' : 'Lines OFF'}
                    ><ListOrdered size={11} /></button>
                    <button
                        onClick={onToggleMinimap}
                        className={`p-0.5 rounded transition-all ${showMinimap ? 'bg-white/20' : 'hover:bg-white/10'}`}
                        title={showMinimap ? 'Minimap ON' : 'Minimap OFF'}
                    ><MapIcon size={11} /></button>

                    <div className="w-px h-3 bg-white/20 mx-1" />
                </div>
            )}

            {cursorPosition && (
                <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
            )}

            <span>UTF-8</span>
            <span className="uppercase font-medium">{language}</span>
        </div>
    );
};
