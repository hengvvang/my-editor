import React, { createContext, useContext, ReactNode } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useEditorContext } from '../../editor/context/EditorContext';
import { useDocumentContext } from '../../documents/context/DocumentContext';
import { FileEntry } from '../../../shared/types';
import { Workspace } from '../../sidebar/types';

interface WorkspaceContextType {
    rootDir: string | null;
    setRootDir: (path: string | null) => void;
    rootFiles: FileEntry[];
    workspaces: Workspace[];
    loadWorkspace: (path: string) => Promise<boolean>;
    removeWorkspace: (id: string) => void;
    togglePinWorkspace: (id: string) => void;
    toggleActiveWorkspace: (id: string) => void;
    createFile: (parentPath: string | null, name: string) => Promise<boolean>;
    createFolder: (parentPath: string | null, name: string) => Promise<boolean>;
    deleteItem: (path: string) => Promise<boolean>;
    openFolder: () => Promise<boolean>;
    shouldShowSidebar: boolean;
    setShouldShowSidebar: (show: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { layout, activeGroupId, updateLayout, setActiveGroupId, openTab } = useEditorContext();
    const { ensureDocumentLoaded } = useDocumentContext();

    const loadFile = async (path: string, addToGroup: boolean) => {
        const loaded = await ensureDocumentLoaded(path);
        if (loaded && addToGroup) {
            openTab(path);
        }
        return loaded;
    };

    const workspaceState = useWorkspace(
        layout,
        activeGroupId,
        updateLayout,
        setActiveGroupId,
        loadFile
    );

    return (
        <WorkspaceContext.Provider value={workspaceState}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspaceContext = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
    }
    return context;
};
