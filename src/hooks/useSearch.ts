import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from 'react';
import { SearchResult } from '../types';

export interface SearchOptions {
    caseSensitive: boolean;
    wholeWord: boolean;
    isRegex: boolean;
}

export function useSearch() {
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState<SearchOptions>({
        caseSensitive: false,
        wholeWord: false,
        isRegex: false,
    });
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const search = useCallback(async (rootDir: string | null) => {
        if (!rootDir || !query.trim()) return;

        setIsSearching(true);
        setResults([]); // Clear previous

        try {
            const res = await invoke<SearchResult[]>("search_in_files", {
                path: rootDir,
                query: query,
                caseSensitive: options.caseSensitive,
                wholeWord: options.wholeWord,
                isRegex: options.isRegex,
            });
            setResults(res);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    }, [query, options]);

    const setOption = useCallback((key: keyof SearchOptions, value: boolean) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    }, []);

    return {
        query,
        setQuery,
        options,
        setOption,
        results,
        isSearching,
        search
    };
}
