import { useCallback, useState } from 'react';
import { GroupState, LayoutNode, SplitState } from '../types';

// Helper to find all groups in the tree
function getAllGroups(node: LayoutNode): GroupState[] {
    if (node.type === 'group') {
        return [node];
    } else {
        return node.children.flatMap(getAllGroups);
    }
}

// Helper to update a specific group in the tree
function updateGroupInTree(node: LayoutNode, groupId: string, updater: (g: GroupState) => GroupState): LayoutNode {
    if (node.type === 'group') {
        if (node.id === groupId) {
            return updater(node);
        }
        return node;
    } else {
        return {
            ...node,
            children: node.children.map(c => updateGroupInTree(c, groupId, updater))
        };
    }
}

// Helper to find a group to split and replace it with a SplitNode
function splitGroupInTree(node: LayoutNode, sourceGroupId: string, newGroupId: string, direction: 'horizontal' | 'vertical'): LayoutNode | null {
    if (node.type === 'group') {
        if (node.id === sourceGroupId) {
            // Found the group. Replace with a split.
            const newGroup: GroupState = {
                id: newGroupId,
                type: 'group',
                tabs: [...node.tabs],
                activePath: node.activePath,
                isReadOnly: node.isReadOnly,
            };
            const split: SplitState = {
                id: `split-${Date.now()}`,
                type: 'split',
                direction,
                children: [node, newGroup],
                sizes: [0.5, 0.5] // Default 50/50
            };
            return split;
        }
        return node;
    } else {
        // If we are already in a split node, and one of our children is the target group, AND the direction matches...
        if (node.direction === direction) {
            // Check if any child is the target
            const index = node.children.findIndex(c => c.type === 'group' && c.id === sourceGroupId);
            if (index !== -1) {
                // Add sibling
                const sourceGroup = node.children[index] as GroupState;
                const newGroup: GroupState = {
                    id: newGroupId,
                    type: 'group',
                    tabs: [...sourceGroup.tabs],
                    activePath: sourceGroup.activePath,
                    isReadOnly: sourceGroup.isReadOnly,
                };

                const newChildren = [...node.children];
                newChildren.splice(index + 1, 0, newGroup);

                // Recalculate sizes
                const oldSize = node.sizes[index];
                const newSize = oldSize / 2;
                const newSizes = [...node.sizes];
                newSizes[index] = newSize;
                newSizes.splice(index + 1, 0, newSize);

                return { ...node, children: newChildren, sizes: newSizes };
            }
        }

        // If direction doesn't match or not found directly, recurse
        const newChildren = node.children.map(c => splitGroupInTree(c, sourceGroupId, newGroupId, direction));

        // If any child changed (reference differs), return new node
        let changed = false;
        for (let i = 0; i < newChildren.length; i++) {
            if (newChildren[i] !== node.children[i]) {
                changed = true;
                break;
            }
        }

        if (changed) {
            return { ...node, children: newChildren as LayoutNode[] };
        }

        return node;
    }
}

// Helper to remove a group
// Returns null if the node itself should be removed (empty) or collapsed
function closeGroupInTree(node: LayoutNode, groupIdToRemove: string): LayoutNode | null {
    if (node.type === 'group') {
        if (node.id === groupIdToRemove) return null;
        return node;
    } else {
        const newChildren: LayoutNode[] = [];
        const newSizes: number[] = [];
        let deletedSize = 0;

        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            const res = closeGroupInTree(child, groupIdToRemove);
            if (res !== null) {
                newChildren.push(res);
                newSizes.push(node.sizes[i]);
            } else {
                deletedSize += node.sizes[i];
            }
        }

        if (newChildren.length === 0) return null;
        if (newChildren.length === 1) return newChildren[0]; // Collapse split

        // Redistribute deleted size
        if (deletedSize > 0) {
            // Simple logic: give to the last child
            newSizes[newSizes.length - 1] += deletedSize;
        }

        return { ...node, children: newChildren, sizes: newSizes };
    }
}

export function useEditorGroups() {
     // Initial State: Single Group
    const [layout, setLayout] = useState<LayoutNode>({ id: '1', type: 'group', tabs: [], activePath: null, isReadOnly: false });
    const [activeGroupId, setActiveGroupId] = useState('1');

    // Flattened groups for consumers who expect a list (like useDocuments, useOutline, etc)
    const groups = getAllGroups(layout);

    // Legacy shim
    const setGroups = () => { console.warn("setGroups direct usage deprecated in tree mode"); };
    // Legacy shim
    const [resizingGroupIndex, setResizingGroupIndex] = useState<number | null>(null);

    const openTab = useCallback((path: string) => {
        setLayout(prev => updateGroupInTree(prev, activeGroupId, g => {
            const tabs = g.tabs.includes(path) ? g.tabs : [...g.tabs, path];
            return { ...g, tabs, activePath: path };
        }));
    }, [activeGroupId]);

    const closeTab = useCallback((path: string, groupId: string) => {
        setLayout(prev => updateGroupInTree(prev, groupId, g => {
            const newTabs = g.tabs.filter(t => t !== path);
            let newActive = g.activePath;
            if (g.activePath === path) {
                newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
            }
            return { ...g, tabs: newTabs, activePath: newActive };
        }));
    }, []);

    const splitGroup = useCallback((sourceGroupId: string, direction: 'horizontal' | 'vertical' = 'horizontal') => {
        const newId = Date.now().toString();
        setLayout(prev => {
            const res = splitGroupInTree(prev, sourceGroupId, newId, direction);
            return res || prev;
        });
        setActiveGroupId(newId);
    }, []);

    const closeGroup = useCallback((groupId: string) => {
        setLayout(prev => {
            if (prev.type === 'group' && prev.id === groupId) return prev; // Cannot close if only one group left (and it's root)
            const res = closeGroupInTree(prev, groupId);

            // If active group closed, we should update activeGroupId.
            // Simplified: we rely on user clicking another group, or we pick the first one from new layout.
            if (res && activeGroupId === groupId) {
               const all = getAllGroups(res);
               if (all.length > 0) setActiveGroupId(all[0].id);
            }

            return res || prev;
        });
    }, [activeGroupId]);

    const switchTab = useCallback((groupId: string, path: string) => {
        setLayout(prev => updateGroupInTree(prev, groupId, g => ({ ...g, activePath: path })));
        setActiveGroupId(groupId);
    }, []);

    const toggleLock = useCallback((groupId: string) => {
        setLayout(prev => updateGroupInTree(prev, groupId, g => ({ ...g, isReadOnly: !g.isReadOnly })));
    }, []);

    // Handler for updating split sizes
    const resizeSplit = useCallback((splitId: string, sizes: number[]) => {
        setLayout(prev => {
            const update = (node: LayoutNode): LayoutNode => {
                if (node.type === 'group') return node;
                if (node.id === splitId) {
                    return { ...node, sizes };
                }
                return { ...node, children: node.children.map(update) };
            };
            return update(prev);
        });
    }, []);

    // Handler for resizing splits
    const updateLayout = useCallback((newLayout: LayoutNode) => {
        setLayout(newLayout);
    }, []);

    return {
        layout,
        groups, // Flat list
        setGroups, // Deprecated
        activeGroupId,
        setActiveGroupId,
        resizingGroupIndex, // Deprecated
        setResizingGroupIndex, // Deprecated
        openTab,
        closeTab,
        switchTab,
        splitGroup,
        resizeSplit,
        closeGroup,
        toggleLock,
        updateLayout
    };
}
