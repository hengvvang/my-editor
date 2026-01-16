export interface FileEntry {
    path: string;
    name: string;
    is_dir: boolean;
    children?: FileEntry[];
}
