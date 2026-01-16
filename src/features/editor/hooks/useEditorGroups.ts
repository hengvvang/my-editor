import { useCallback, useState } from 'react';
import { LayoutNode } from '../../../types';
import { closeGroupInTree, getAllGroups, splitGroupInTree, updateGroupInTree } from '../../../utils/layoutUtils';

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

    const openTab = useCallback((path: string, targetGroupId?: string) => {
        const idToUse = targetGroupId || activeGroupId;
        setLayout(prev => updateGroupInTree(prev, idToUse, g => {
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

    const splitGroup = useCallback((sourceGroupId: string, direction: 'horizontal' | 'vertical' = 'horizontal', newGroupId?: string) => {
        const newId = newGroupId || Date.now().toString();
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
