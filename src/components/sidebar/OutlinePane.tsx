import React, { useState, useMemo } from "react";
import { Search, Hash, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, AlignLeft } from "lucide-react";

interface OutlinePaneProps {
    outline: { level: number; text: string; line: number }[];
    onItemClick?: (line: number) => void;
}

export const OutlinePane: React.FC<OutlinePaneProps> = ({ outline, onItemClick }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredOutline = useMemo(() => {
        if (!searchQuery.trim()) return outline;
        return outline.filter(item =>
            item.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [outline, searchQuery]);

    const getIconForLevel = (level: number) => {
        const size = 14;
        const className = "opacity-70";
        switch (level) {
            case 1: return <Heading1 size={size} className={className} />;
            case 2: return <Heading2 size={size} className={className} />;
            case 3: return <Heading3 size={size} className={className} />;
            case 4: return <Heading4 size={size} className={className} />;
            case 5: return <Heading5 size={size} className={className} />;
            case 6: return <Heading6 size={size} className={className} />;
            default: return <Hash size={size} className={className} />;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            {/* Header & Search */}
            <div className="p-2 border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <AlignLeft size={12} />
                        Outline
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                        {filteredOutline.length}
                    </span>
                </div>
                <div className="relative group">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="Filter symbols..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-1 py-2 space-y-[1px]">
                {outline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2 opacity-60">
                        <AlignLeft size={24} strokeWidth={1} />
                        <span className="text-xs italic">No outline available</span>
                    </div>
                ) : filteredOutline.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                        No matches found
                    </div>
                ) : (
                    filteredOutline.map((item, i) => (
                        <div
                            key={`${i}-${item.line}`}
                            className={`
                                group flex items-center gap-1.5 py-0.5 pr-2 rounded cursor-pointer transition-all duration-200
                                hover:bg-white hover:shadow-sm hover:border-slate-200 border border-transparent
                                ${item.level === 1 ? 'mt-1 mb-0.5 border-b border-slate-100/50' : ''}
                            `}
                            style={{
                                paddingLeft: `${((item.level - 1) * 8) + 2}px`
                            }}
                            onClick={() => onItemClick && onItemClick(item.line)}
                        >
                            {/* Indent Guide Logic can be simulated if needed, but simple indentation is usually cleaner */}
                            <div className={`
                                shrink-0 flex items-center justify-center w-5 h-5 rounded
                                ${item.level === 1 ? 'bg-slate-100 text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}
                            `}>
                                {getIconForLevel(item.level)}
                            </div>

                            <span className={`
                                truncate text-xs select-none
                                ${item.level === 1 ? 'font-bold text-slate-800' : ''}
                                ${item.level === 2 ? 'font-semibold text-slate-700' : ''}
                                ${item.level > 2 ? 'text-slate-600' : ''}
                            `}>
                                {item.text}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
