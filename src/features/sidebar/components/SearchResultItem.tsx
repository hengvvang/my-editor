import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { SearchResult } from "../types";

export interface SearchResultItemProps {
    result: SearchResult;
    rootDir: string | null;
    onOpenFileAtLine?: (path: string, line: number) => void;
    query: string;
    options?: { caseSensitive: boolean; wholeWord: boolean; isRegex: boolean };
}

export const SearchResultItem = ({
    result,
    rootDir,
    onOpenFileAtLine,
    query,
    options
}: SearchResultItemProps) => {
    const [expanded, setExpanded] = useState(true);
    const relPath = rootDir && result.path.startsWith(rootDir)
        ? result.path.slice(rootDir.length + (rootDir.endsWith('\\') || rootDir.endsWith('/') ? 0 : 1))
        : result.path;
    const fileName = relPath.split(/[\\/]/).pop() || relPath;
    const dirPath = relPath.slice(0, -fileName.length);

    // Highlight helper
    const highlightMatch = (text: string) => {
        if (!query) return text;

        try {
            let regex: RegExp;
            if (options?.isRegex) {
                // Determine flags
                const flags = options.caseSensitive ? 'g' : 'gi';
                regex = new RegExp(query, flags);
            } else {
                // Escape regex characters for literal search
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = options?.wholeWord ? `\\b${escaped}\\b` : escaped;
                const flags = options?.caseSensitive ? 'g' : 'gi';
                regex = new RegExp(pattern, flags);
            }

            const parts = text.split(regex);
            const matches = text.match(regex);

            if (!matches) return text;

            return parts.reduce((acc, part, i) => {
                if (i === 0) return [part];
                return [...acc, <span key={i} className="bg-yellow-200 text-slate-800 rounded-[1px] px-[1px]">{matches[i - 1]}</span>, part];
            }, [] as any[]);

        } catch (e) {
            // Fallback if regex fails (e.g. invalid user regex)
            return text;
        }
    };

    return (
        <div className="flex flex-col">
            <div
                className="flex items-center gap-0.5 h-[22px] px-0 hover:bg-slate-100 cursor-pointer text-xs select-none group"
                onClick={() => setExpanded(!expanded)}
            >
                <span className={`shrink-0 transition-transform duration-200 flex items-center justify-center w-5 ${expanded ? 'rotate-90' : ''}`}>
                    <ChevronRight size={14} className="text-slate-400" />
                </span>
                <span className="font-medium text-[#424242] truncate" title={result.path}>{fileName}</span>
                <span className="text-slate-400 truncate text-[10px] ml-1 opacity-70">{dirPath}</span>
                <div className="ml-auto bg-slate-200/80 text-slate-600 rounded-full px-1.5 text-[10px] min-w-[16px] text-center mr-2">
                    {result.matches.length}
                </div>
            </div>
            {expanded && (
                <div className="flex flex-col">
                    {result.matches.map((m, i) => (
                        <div
                            key={i}
                            className="pl-6 pr-2 h-[22px] hover:bg-[#0090f1] hover:text-white cursor-pointer group/line flex items-center gap-2 text-xs font-mono"
                            onClick={() => onOpenFileAtLine?.(result.path, m.line_number)}
                        >
                            <span className="text-slate-400 group-hover/line:text-blue-100 text-[10px] w-6 shrink-0 text-right select-none">{m.line_number}</span>
                            <span className="text-slate-600 group-hover/line:text-white truncate flex-1" title={m.line_text.trim()}>
                                {highlightMatch(m.line_text.trim())}
                            </span>
                        </div>
                    ))}
                </div>

            )}
        </div>
    );
};
