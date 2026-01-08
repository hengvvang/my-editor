export interface Tab {
    path: string;
    name: string;
    content: string;
    originalContent: string;
    isDirty: boolean;
    scrollPos?: number;
}

export interface FileEntry {
    path: string;
    name: string;
    is_dir: boolean;
    children?: FileEntry[];
}

export interface DocState {
    path: string;
    name: string;
    content: string;
    originalContent: string;
    isDirty: boolean;
}

export interface GroupState {
    id: string;
    tabs: string[]; // Paths
    activePath: string | null;
    isReadOnly: boolean;
    flex: number;
}

export interface Workspace {
    path: string;
    name: string;
    lastOpened: number;
}

export interface SearchMatch {
    line_number: number;
    line_text: string;
}

export interface SearchResult {
    path: string;
    matches: SearchMatch[];
}
