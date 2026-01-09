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
    id: string; // ID of the group
    type: 'group';
    tabs: string[]; // Paths
    activePath: string | null;
    isReadOnly: boolean;
}

export interface SplitState {
    id: string; // ID of the split container
    type: 'split';
    direction: 'horizontal' | 'vertical';
    children: LayoutNode[]; // Can be GroupState or SplitState
    sizes: number[]; // Flex values or percentages. Let's use flex ratios (e.g. [1, 1]).
}

export type LayoutNode = GroupState | SplitState;

export interface Workspace {
    path: string;
    name: string;
    lastOpened: number;
    pinned?: boolean;
    active?: boolean;
}

export interface SearchMatch {
    line_number: number;
    line_text: string;
}

export interface SearchResult {
    path: string;
    matches: SearchMatch[];
}

export enum SearchScope {
    CurrentFile = 'current_file',
    CurrentGroup = 'current_group',
    AllGroups = 'all_groups',
    CurrentWorkspace = 'current_workspace',
    AllWorkspaces = 'all_workspaces',
}
