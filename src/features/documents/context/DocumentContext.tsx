import React, { createContext, useContext, ReactNode } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { DocState } from '../types';

interface DocumentContextType {
    documents: Record<string, DocState>;
    ensureDocumentLoaded: (path: string) => Promise<boolean>;
    updateDoc: (path: string, updates: Partial<DocState>) => void;
    saveDocument: (path: string) => Promise<void>;
    createVirtualDocument: (path: string, content: string, name: string) => void;
    removeDocument: (path: string) => void;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const documentState = useDocuments();

    return (
        <DocumentContext.Provider value={documentState}>
            {children}
        </DocumentContext.Provider>
    );
};

export const useDocumentContext = () => {
    const context = useContext(DocumentContext);
    if (!context) {
        throw new Error('useDocumentContext must be used within a DocumentProvider');
    }
    return context;
};
