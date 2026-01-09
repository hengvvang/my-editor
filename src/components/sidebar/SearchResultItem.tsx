import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { SearchResult } from "../../types";

export interface SearchResultItemProps {
    result: SearchResult;
    rootDir: string | null;
    onOpenFileAtLine?: (path: string, line: number) => void;
}

export const SearchResultItem = ({
    result,
    rootDir,
    onOpenFileAtLine
}: SearchResultItemProps) => {
    const [expanded, setExpanded] = useState(true);
    const relPath = rootDir && result.path.startsWith(rootDir)
        ? result.path.slice(rootDir.length + (rootDir.endsWith('\\') || rootDir.endsWith('/') ? 0 : 1))
        : result.path;
    const fileName = relPath.split(/[\\/]/).pop() || relPath;
    const dirPath = relPath.slice(0, -fileName.length);

    return (
        <div className="flex flex-col">
            <div
                className="flex items-center gap-1 py-1 px-2 hover:bg-slate-100 cursor-pointer text-xs select-none group"
                onClick={() => setExpanded(!expanded)}
            >
                <span className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
                    <ChevronRight size={12} className="text-slate-400" />
                </span>
                <span className="font-medium text-slate-700 truncate" title={result.path}>{fileName}</span>
                <span className="text-slate-400 truncate text-[10px] ml-1">{dirPath}</span>
                <div className="ml-auto bg-slate-200 text-slate-600 rounded-full px-1.5 text-[10px] min-w-[16px] text-center">
                    {result.matches.length}
                </div>
            </div>
            {expanded && (
                <div className="flex flex-col">
                    {result.matches.map((m, i) => (
                        <div
                            key={i}
                            className="pl-6 pr-2 py-0.5 hover:bg-blue-50 cursor-pointer group/line flex items-start gap-2 text-xs font-mono"
                            onClick={() => onOpenFileAtLine?.(result.path, m.line_number)}
                        >
                            <span className="text-slate-400 text-[10px] w-6 shrink-0 text-right select-none mt-0.5">{m.line_number}</span>
                            <span className="text-slate-600 truncate flex-1">{m.line_text.trim()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
