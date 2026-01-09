import React from "react";

interface OutlinePaneProps {
    outline: { level: number; text: string; line: number }[];
    onItemClick?: (line: number) => void;
}

export const OutlinePane: React.FC<OutlinePaneProps> = ({ outline, onItemClick }) => {
    return (
        <div className="flex-1 overflow-auto p-2 bg-slate-50/30">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 pt-2">Outline</div>
            {outline.length === 0 ? (
                <div className="p-2 text-xs text-slate-400 italic">No symbols found</div>
            ) : (
                outline.map((item, i) => (
                    <div
                        key={i}
                        className="px-2 py-1 hover:bg-slate-100 cursor-pointer truncate text-xs flex items-center gap-1.5 text-slate-600"
                        style={{ paddingLeft: (item.level - 1) * 12 + 8 }}
                        onClick={() => onItemClick && onItemClick(item.line)}
                    >
                        <span className="opacity-50 text-[10px]">#</span> {item.text}
                    </div>
                ))
            )}
        </div>
    );
};
