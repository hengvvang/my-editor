import React, { createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import { useEditorGroups } from '../hooks/useEditorGroups';
import { useEditorViewState, EditorViewState } from '../hooks/useEditorViewState';
import { LayoutNode, GroupState } from '../types';

interface EditorContextType {
    // Layout & Groups
    layout: LayoutNode;
    groups: GroupState[];
    activeGroupId: string;
    setActiveGroupId: (id: string) => void;
    openTab: (path: string, groupId?: string) => void;
    closeTab: (path: string, groupId: string) => void;
    switchTab: (groupId: string, path: string) => void;
    splitGroup: (sourceGroupId: string, direction?: 'horizontal' | 'vertical', newGroupId?: string) => void;
    resizeSplit: (splitId: string, sizes: number[]) => void;
    closeGroup: (groupId: string) => void;
    toggleLock: (groupId: string) => void;
    updateLayout: (newLayout: LayoutNode) => void;

    // View State
    getViewState: (groupId: string) => EditorViewState;
    setViewState: (groupId: string, updates: Partial<EditorViewState>) => void;
    copyViewState: (sourceGroupId: string, targetGroupId: string) => void;
    clearViewState: (groupId: string) => void;

    // Editor Interaction
    getSelection: () => string;
    registerGetSelection: (fn: () => string) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const groupState = useEditorGroups();
    const viewState = useEditorViewState();

    const getSelectionRef = useRef<(() => string) | null>(null);

    const registerGetSelection = useCallback((fn: () => string) => {
        getSelectionRef.current = fn;
    }, []);

    const getSelection = useCallback(() => {
        return getSelectionRef.current ? getSelectionRef.current() : '';
    }, []);

    const value: EditorContextType = {
        layout: groupState.layout,
        groups: groupState.groups,
        activeGroupId: groupState.activeGroupId,
        setActiveGroupId: groupState.setActiveGroupId,
        openTab: groupState.openTab,
        closeTab: groupState.closeTab,
        switchTab: groupState.switchTab,
        splitGroup: groupState.splitGroup,
        resizeSplit: groupState.resizeSplit,
        closeGroup: groupState.closeGroup,
        toggleLock: groupState.toggleLock,
        updateLayout: groupState.updateLayout,

        getViewState: viewState.getViewState,
        setViewState: viewState.setViewState,
        copyViewState: viewState.copyViewState,
        clearViewState: viewState.clearViewState,

        getSelection,
        registerGetSelection
    };

    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    );
};

export const useEditorContext = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditorContext must be used within a EditorProvider');
    }
    return context;
};
