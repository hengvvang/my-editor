import { invoke } from "@tauri-apps/api/core";
import { useCallback, useMemo, useState } from 'react';
import { SearchResult, SearchScope } from '../types';

export interface SearchOptions {
    caseSensitive: boolean;
    wholeWord: boolean;
    isRegex: boolean;
    scope: SearchScope;
    includePattern?: string;
    excludePattern?: string;
}

export function useSearch() {
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState<SearchOptions>({
        caseSensitive: false,
        wholeWord: false,
        isRegex: false,
        scope: SearchScope.CurrentWorkspace,
    });
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const search = useCallback(async (
        rootDir: string | null,
        currentFilePath: string | null,
        activeGroupFiles: string[] = [],
        allOpenFiles: string[] = [],
        allWorkspaces: string[] = []
    ) => {
        if (!query.trim()) return;

        setIsSearching(true);
        setResults([]); // Clear previous

        try {
            let searchPaths: string[] = [];

            if (options.scope === SearchScope.CurrentFile) {
                if (currentFilePath) searchPaths = [currentFilePath];
            } else if (options.scope === SearchScope.CurrentGroup) {
                searchPaths = activeGroupFiles;
            } else if (options.scope === SearchScope.AllGroups) {
                 // De-duplicate open files
                 searchPaths = Array.from(new Set(allOpenFiles));
            } else if (options.scope === SearchScope.AllWorkspaces) {
                 // Current root + history workspaces
                 // Assuming allWorkspaces contains paths.
                 // We should be careful to avoid duplicates if rootDir is in allWorkspaces
                 const combined = rootDir ? [rootDir, ...allWorkspaces] : allWorkspaces;
                 searchPaths = Array.from(new Set(combined));
            } else {
                // Current Workspace (Default)
                if (rootDir) searchPaths = [rootDir];
            }

            if (searchPaths.length === 0) {
                setIsSearching(false);
                return;
            }

            const promises = searchPaths.map(path =>
                invoke<SearchResult[]>("search_in_files", {
                    path: path,
                    query: query,
                    caseSensitive: options.caseSensitive,
                    wholeWord: options.wholeWord,
                    isRegex: options.isRegex,
                })
            );

            const resultsArr = await Promise.all(promises);
            const flatResults = resultsArr.flat();

            // Deduplicate results based on file path (in case of overlapping workspaces or groups)
            const uniqueResultsMap = new Map<string, SearchResult>();
            flatResults.forEach(r => uniqueResultsMap.set(r.path, r));

            setResults(Array.from(uniqueResultsMap.values()));

        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    }, [query, options]);

    const setOption = useCallback((key: keyof SearchOptions, value: any) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    }, []);

    return useMemo(() => ({
        query,
        setQuery,
        options,
        setOption,
        results,
        isSearching,
        search
    }), [query, options, results, isSearching, search]);
}
