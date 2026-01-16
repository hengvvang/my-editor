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
