import React from "react";

interface StatusBarProps {
    language: string;
    groupId: string;
    groupIndex: number; // Added index for predictable color cycling
    isActive: boolean;
    cursorPosition?: { line: number; col: number }; // Optional for now
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

export const StatusBar: React.FC<StatusBarProps> = ({ language, groupId, groupIndex, isActive, cursorPosition }) => {
    const scheme = colorSchemes[groupIndex % colorSchemes.length];
    const colorClass = isActive ? scheme.active : scheme.inactive;

    return (
        <div className={`h-[22px] flex items-center px-3 text-[10px] gap-4 select-none shrink-0 transition-all duration-200 ${colorClass}`}>
            <span className="font-medium">Group {groupId === '1' ? '1' : groupId.slice(-4)}</span>
            {isActive && <span className="font-bold tracking-wide uppercase text-[9px] bg-white/20 px-1 rounded">Active</span>}
            <div className="flex-1" />

            {cursorPosition && (
                <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
            )}

            <span>UTF-8</span>
            <span className="uppercase">{language}</span>
        </div>
    );
};
