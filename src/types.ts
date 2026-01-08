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
