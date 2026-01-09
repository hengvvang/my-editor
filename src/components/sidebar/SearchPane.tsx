import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Loader2, ChevronRight, ChevronDown, ReplaceAll, RefreshCcw, Eraser, BookOpen, FileText, Database, Layers, Briefcase } from "lucide-react";
import { SearchResult, SearchScope } from "../../types";
import { SearchResultItem } from "./SearchResultItem";

export interface SearchPaneProps {
    search: {
        query: string;
        setQuery: (q: string) => void;
        options: { caseSensitive: boolean; wholeWord: boolean; isRegex: boolean; scope: SearchScope };
        setOption: (k: "caseSensitive" | "wholeWord" | "isRegex" | "scope", v: any) => void;
        results: SearchResult[];
        isSearching: boolean;
        search: (root: string | null, currentPath: string | null, activeGroupFiles: string[], allOpenFiles: string[], allWorkspaces: string[]) => void;
    };
    rootDir: string | null;
    currentPath: string | null;
    activeGroupFiles: string[];
    allOpenFiles?: string[];
    allWorkspaces?: string[];
    onOpenFileAtLine?: (path: string, line: number) => void;
}

export const SearchPane: React.FC<SearchPaneProps> = ({
    search,
    rootDir,
    currentPath,
    activeGroupFiles,
    allOpenFiles = [],
    allWorkspaces = [],
    onOpenFileAtLine
}) => {
    const [replaceMode, setReplaceMode] = useState(false);
    const [replaceText, setReplaceText] = useState("");
    const [isReplacing, setIsReplacing] = useState(false);

    // Identify categories for results to color-code the overview ruler
    const getResultCategory = (path: string) => {
        if (currentPath && path === currentPath) return 'current-file';
        if (activeGroupFiles.includes(path)) return 'current-group';
        if (allOpenFiles.includes(path)) return 'open-files';
        if (rootDir && path.startsWith(rootDir)) return 'current-workspace';
        return 'other'; // External or other workspaces
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'current-file': return 'bg-blue-500';     // High vis
            case 'current-group': return 'bg-cyan-400';    // Medium vis
            case 'open-files': return 'bg-emerald-400';    // Info vis
            case 'current-workspace': return 'bg-slate-300'; // Low vis
            case 'other': return 'bg-amber-400';           // Warning/External vis
            default: return 'bg-slate-200';
        }
    };

    const getCategoryTitle = (category: string) => {
        switch (category) {
            case 'current-file': return 'Current File';
            case 'current-group': return 'Current Editor Group';
            case 'open-files': return 'Open File';
            case 'current-workspace': return 'Current Workspace';
            case 'other': return 'External / History';
            default: return 'File';
        }
    }

    const displayedResults = search.results.slice(0, 500);

    const scrollToResult = (index: number) => {
        const element = document.getElementById(`search-result-item-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleSearch = () => {
        search.search(rootDir, currentPath, activeGroupFiles, allOpenFiles, allWorkspaces);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Helper to construct regex from options
    const getSearchRegex = () => {
        const { query, options } = search;
        if (!query) return null;

        try {
            const flags = options.caseSensitive ? 'g' : 'gi';
            if (options.isRegex) {
                return new RegExp(query, flags);
            } else {
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = options.wholeWord ? `\\b${escaped}\\b` : escaped;
                return new RegExp(pattern, flags);
            }
        } catch (e) {
            console.error("Invalid regex", e);
            return null;
        }
    };

    const performReplace = async (replaceAll: boolean) => {
        if (!search.results.length || !search.query) return;
        const regex = getSearchRegex();
        if (!regex) return;

        if (!confirm(`Are you sure you want to replace ${replaceAll ? 'all occurrences' : 'matches'} with "${replaceText}"? This will modify files on disk.`)) {
            return;
        }

        setIsReplacing(true);
        try {
            // Group matches by file
            // search.results is already file-based: { path, matches[] }

            let filesToProcess = search.results;

            // If not replacing all, we might need a selection mechanism.
            // For now, "Replace All" replaces everything in the search results.
            // VS Code "Replace" button next to input replaces ALL in current result set.
            // The individual replace buttons are per item.

            // We implement "Replace All Occurrences in Result Set"

            let replacedCount = 0;

            for (const fileResult of filesToProcess) {
                try {
                    // Read file content
                    const content = await invoke<string>("read_content", { path: fileResult.path });

                    // Perform replacement
                    // We can't just use match indices because we might have modified the file if we do sequential?
                    // Actually, String.replace(regex, replaceText) does it all at once correctly.

                    const newContent = content.replace(regex, replaceText);

                    if (newContent !== content) {
                        // Save file
                        await invoke("save_content", { path: fileResult.path, content: newContent });
                        replacedCount++;
                    }
                } catch (err) {
                    console.error(`Failed to replace in ${fileResult.path}`, err);
                }
            }

            alert(`Replaced ${replacedCount} files.`);
            handleSearch(); // Refresh results

        } catch (e) {
            console.error("Replace failed", e);
            alert("Replace process encountered errors.");
        } finally {
            setIsReplacing(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden h-full">
            {/* Search Toolbar (Matches Explorer Style) */}
            <div className="flex items-center justify-end px-2 pt-2 pb-1 bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleSearch}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                        title="Refresh Search"
                    >
                        <RefreshCcw size={14} />
                    </button>
                    <button
                        onClick={() => {
                            search.setQuery("");
                            setReplaceText("");
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                        title="Clear Inputs"
                    >
                        <Eraser size={14} />
                    </button>
                </div>
            </div>

            {/* Search Box Container */}
            <div className="p-3 border-b border-slate-200 bg-white shadow-sm z-10">
                <div className="flex flex-col gap-2 relative pl-4">
                    {/* Toggle Replace Mode Arrow */}
                    <button
                        onClick={() => setReplaceMode(!replaceMode)}
                        className="absolute left-0 top-1.5 text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                        title="Toggle Replace"
                    >
                        {replaceMode ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    <div className="flex items-center gap-1">
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                className="w-full text-xs pl-2 pr-16 py-1.5 bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm text-slate-700 placeholder:text-slate-400"
                                placeholder="Search"
                                value={search.query}
                                onChange={(e) => search.setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            {/* Search Options inside input */}
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                                <button
                                    onClick={() => search.setOption("caseSensitive", !search.options.caseSensitive)}
                                    className={`w-5 h-5 flex items-center justify-center text-[10px] rounded hover:bg-slate-200 transition-colors ${search.options.caseSensitive ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400'}`}
                                    title="Match Case (Alt+C)"
                                >Aa</button>
                                <button
                                    onClick={() => search.setOption("wholeWord", !search.options.wholeWord)}
                                    className={`w-5 h-5 flex items-center justify-center text-[10px] rounded hover:bg-slate-200 transition-colors ${search.options.wholeWord ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400'}`}
                                    title="Match Whole Word (Alt+W)"
                                >ab</button>
                                <button
                                    onClick={() => search.setOption("isRegex", !search.options.isRegex)}
                                    className={`w-4 h-5 flex items-center justify-center text-[10px] rounded hover:bg-slate-200 transition-colors ${search.options.isRegex ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400'}`}
                                    title="Use Regular Expression (Alt+R)"
                                >.*</button>
                            </div>
                        </div>
                    </div>

                    {/* Replace Input */}
                    <div className={`grid transition-all duration-200 ease-in-out ${replaceMode ? 'grid-rows-[1fr] opacity-100 mb-2' : 'grid-rows-[0fr] opacity-0 invisible mb-0'}`}>
                        <div className="overflow-hidden min-h-0">
                            <div className="relative flex-1 flex items-center gap-1">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        className="w-full text-xs pl-2 pr-8 py-1.5 bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-blue-500 hover:border-slate-400 transition-colors shadow-sm text-slate-700 placeholder:text-slate-400"
                                        placeholder="Replace"
                                        value={replaceText}
                                        onChange={(e) => setReplaceText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') performReplace(true);
                                        }}
                                    />
                                    <button
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                        onClick={() => performReplace(true)}
                                        title="Replace All (Ctrl+Alt+Enter)"
                                    >
                                        <ReplaceAll size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scope Selection (VS Code Style "files to include") */}
                <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">files to include</span>
                    </div>
                    {/* Scope Icons Bar */}
                    <div className="flex gap-0.5 pt-1">
                        {/* Current File */}
                        <button
                            onClick={() => search.setOption("scope", SearchScope.CurrentFile)}
                            className={`p-1.5 rounded transition-all flex items-center justify-center ${search.options.scope === SearchScope.CurrentFile ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            title="Current File (Only active file)"
                        >
                            <FileText size={14} />
                        </button>

                        {/* Current Group */}
                        <button
                            onClick={() => search.setOption("scope", SearchScope.CurrentGroup)}
                            className={`p-1.5 rounded transition-all flex items-center justify-center ${search.options.scope === SearchScope.CurrentGroup ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            title="Current Editor Group (Active split)"
                        >
                            <BookOpen size={14} />
                        </button>

                        {/* All Groups (All Open Files) */}
                        <button
                            onClick={() => search.setOption("scope", SearchScope.AllGroups)}
                            className={`p-1.5 rounded transition-all flex items-center justify-center ${search.options.scope === SearchScope.AllGroups ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            title="All Open Editors (All tabs)"
                        >
                            <Layers size={14} />
                        </button>

                        <div className="w-px h-4 bg-slate-200 mx-1 self-center" />

                        {/* Current Workspace */}
                        <button
                            onClick={() => search.setOption("scope", SearchScope.CurrentWorkspace)}
                            className={`p-1.5 rounded transition-all flex items-center justify-center ${search.options.scope === SearchScope.CurrentWorkspace ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            title="Current Workspace"
                        >
                            <Briefcase size={14} />
                        </button>

                        {/* All Workspaces */}
                        <button
                            onClick={() => search.setOption("scope", SearchScope.AllWorkspaces)}
                            className={`p-1.5 rounded transition-all flex items-center justify-center ${search.options.scope === SearchScope.AllWorkspaces ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            title="All Workspaces (History)"
                        >
                            <Database size={14} />
                        </button>

                    </div>
                </div>
            </div>

            {/* Results Header */}
            {search.results.length > 0 && (
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 flex justify-between items-center shrink-0">
                    <span>{search.results.reduce((acc, r) => acc + r.matches.length, 0)} results in {search.results.length} files</span>
                    {replaceMode && (
                        <button
                            onClick={() => performReplace(true)}
                            className="text-blue-600 hover:underline flex items-center gap-0.5 disable:opacity-50"
                            disabled={isReplacing}
                        >
                            <ReplaceAll size={12} /> Replace All
                        </button>
                    )}
                </div>
            )}

            {/* Results List Container with Overview Ruler */}
            <div className="flex-1 flex min-h-0 relative">
                {/* Overview Ruler (Left Strip) */}
                {displayedResults && displayedResults.length > 0 && !search.isSearching && (
                    <div className="w-2 h-full flex flex-col shrink-0 bg-slate-50/50 border-r border-slate-200" title="Result Overview (Click to jump)">
                        {displayedResults.map((result, i) => {
                            const category = getResultCategory(result.path);
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 w-full ${getCategoryColor(category)} hover:brightness-90 transition-all cursor-pointer`}
                                    title={`${getCategoryTitle(category)}: ${result.path.split(/[\\/]/).pop()}`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        scrollToResult(i);
                                    }}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Results List */}
                <div className="flex-1 overflow-auto">
                    {search.isSearching || isReplacing ? (
                        <div className="p-4 text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> {isReplacing ? 'Replacing...' : 'Searching...'}
                        </div>
                    ) : (
                        <>
                            {search.results.length === 0 && search.query && (
                                <div className="p-4 text-xs text-slate-400 text-center">No results found</div>
                            )}

                            {search.results.length >= 2000 && (
                                <div className="px-4 py-2 text-xs text-amber-600 bg-amber-50 border-b border-amber-100 flex items-center justify-center">
                                    Results limited to first 2000 files
                                </div>
                            )}

                            {displayedResults && displayedResults.map((result, i) => {
                                const isCurrentFile = result.path === currentPath;

                                return (
                                    <div key={result.path} id={`search-result-item-${i}`} className="relative group/item scroll-mt-2">
                                        {isCurrentFile && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-400 z-10" title="Current File" />}
                                        <SearchResultItem
                                            result={result}
                                            rootDir={rootDir}
                                            onOpenFileAtLine={onOpenFileAtLine}
                                            query={search.query}
                                            options={search.options}
                                        />
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
