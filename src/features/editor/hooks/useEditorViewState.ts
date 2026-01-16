import { useCallback, useState } from 'react';

// View state for each EditorGroup, keyed by groupId
export interface EditorViewState {
    isSourceMode: boolean;
    showSplitPreview: boolean;
    isVimMode: boolean;
    useMonospace: boolean;
    showLineNumbers: boolean;
    showMinimap: boolean;
    minimapWidth: number;
    showCodeSnap: boolean;
    // Panel sizes (percentages)
    editorSize: number;
    previewSize: number;
    codeSnapSize: number;
    // Sync Scroll
    isSyncScrollEnabled: boolean;
}

const defaultViewState: EditorViewState = {
    isSourceMode: true,
    showSplitPreview: false,
    isVimMode: false,
    useMonospace: false,
    showLineNumbers: true,
    showMinimap: false,
    minimapWidth: 100,
    showCodeSnap: false,
    // Default panel sizes
    editorSize: 50,
    previewSize: 25,
    codeSnapSize: 25,
    isSyncScrollEnabled: true, // Enabled by default
};

type ViewStateMap = Record<string, EditorViewState>;

export function useEditorViewState() {
    const [viewStates, setViewStates] = useState<ViewStateMap>({});

    // Get view state for a specific group, with defaults
    const getViewState = useCallback((groupId: string): EditorViewState => {
        return viewStates[groupId] || defaultViewState;
    }, [viewStates]);

    // Update view state for a specific group
    const setViewState = useCallback((groupId: string, updates: Partial<EditorViewState>) => {
        setViewStates(prev => ({
            ...prev,
            [groupId]: {
                ...(prev[groupId] || defaultViewState),
                ...updates,
            },
        }));
    }, []);

    // Copy state from one group to another (for split operations)
    const copyViewState = useCallback((sourceGroupId: string, targetGroupId: string) => {
        setViewStates(prev => {
            const sourceState = prev[sourceGroupId] || defaultViewState;
            return {
                ...prev,
                [targetGroupId]: {
                    ...sourceState,
                    // Reset panels to closed for new group
                    showSplitPreview: false,
                    showCodeSnap: false,
                    showMinimap: false,
                },
            };
        });
    }, []);

    // Clear state for a closed group
    const clearViewState = useCallback((groupId: string) => {
        setViewStates(prev => {
            const { [groupId]: _, ...rest } = prev;
            return rest;
        });
    }, []);

    return {
        getViewState,
        setViewState,
        copyViewState,
        clearViewState,
    };
}

export type EditorViewStateManager = ReturnType<typeof useEditorViewState>;
