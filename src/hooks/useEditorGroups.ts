import { useCallback, useState } from 'react';
import { GroupState } from '../types';

export function useEditorGroups() {
    const [groups, setGroups] = useState<GroupState[]>([{ id: '1', tabs: [], activePath: null, isReadOnly: false, flex: 1 }]);
    const [activeGroupId, setActiveGroupId] = useState('1');
    const [resizingGroupIndex, setResizingGroupIndex] = useState<number | null>(null);

    const openTab = useCallback((path: string) => {
        setGroups(prev => prev.map(g => {
            if (g.id === activeGroupId) {
                const tabs = g.tabs.includes(path) ? g.tabs : [...g.tabs, path];
                return { ...g, tabs, activePath: path };
            }
            return g;
        }));
    }, [activeGroupId]);

    const closeTab = useCallback((path: string, groupId: string) => {
        setGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                const newTabs = g.tabs.filter(t => t !== path);
                let newActive = g.activePath;
                if (g.activePath === path) {
                    newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
                }
                return { ...g, tabs: newTabs, activePath: newActive };
            }
            return g;
        }));
    }, []);

    const splitGroup = useCallback((sourceGroupId: string) => {
        const newId = Date.now().toString();

        setGroups(prev => {
            const sourceGroupIndex = prev.findIndex(g => g.id === sourceGroupId);
            if (sourceGroupIndex === -1) return prev;

            const sourceGroup = prev[sourceGroupIndex];
            const newFlex = sourceGroup.flex * 0.5;

            // Create new group
            const newGroup: GroupState = {
                id: newId,
                tabs: [...sourceGroup.tabs],
                activePath: sourceGroup.activePath,
                isReadOnly: sourceGroup.isReadOnly,
                flex: newFlex
            };

            const newGroups = [...prev];
            // Shrink the source group
            newGroups[sourceGroupIndex] = { ...sourceGroup, flex: newFlex };
            // Insert new group after source
            newGroups.splice(sourceGroupIndex + 1, 0, newGroup);
            return newGroups;
        });

        setActiveGroupId(newId);
    }, []);

    const closeGroup = useCallback((groupId: string) => {
        setGroups(prev => {
             if (prev.length <= 1) return prev;
            const index = prev.findIndex(g => g.id === groupId);
            if (index === -1) return prev;

            const groupToRemove = prev[index];
            const newGroups = prev.filter(g => g.id !== groupId);

            if (index > 0) {
                newGroups[index - 1] = { ...newGroups[index - 1], flex: newGroups[index - 1].flex + groupToRemove.flex };
                if (activeGroupId === groupId) setActiveGroupId(newGroups[index - 1].id);
            } else if (newGroups.length > 0) {
                newGroups[0] = { ...newGroups[0], flex: newGroups[0].flex + groupToRemove.flex };
                if (activeGroupId === groupId) setActiveGroupId(newGroups[0].id);
            }
            return newGroups;
        });
    }, [activeGroupId]);

    const toggleLock = useCallback((groupId: string) => {
        setGroups(prev => prev.map(g => {
            if (g.id === groupId) return { ...g, isReadOnly: !g.isReadOnly };
            return g;
        }));
    }, []);

    // Switch active tab in a group
    const switchTab = useCallback((groupId: string, path: string) => {
         setGroups(prev => prev.map(g => g.id === groupId ? { ...g, activePath: path } : g));
         setActiveGroupId(groupId);
    }, []);

    return {
        groups,
        setGroups,
        activeGroupId,
        setActiveGroupId,
        resizingGroupIndex,
        setResizingGroupIndex,
        openTab,
        closeTab,
        switchTab,
        splitGroup,
        closeGroup,
        toggleLock
    };
}
