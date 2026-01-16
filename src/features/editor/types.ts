export interface Tab {
    path: string;
    name: string;
    content: string;
    originalContent: string;
    isDirty: boolean;
    scrollPos?: number;
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
