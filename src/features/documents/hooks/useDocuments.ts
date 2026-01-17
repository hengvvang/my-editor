import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from 'react';
import { DocState } from '../types';

export function useDocuments() {
    const [documents, setDocuments] = useState<Record<string, DocState>>({});
    const documentsRef = useRef(documents);

    // Keep ref in sync
    useEffect(() => {
        documentsRef.current = documents;
    }, [documents]);

    const updateDoc = useCallback((path: string, updates: Partial<DocState>) => {
        setDocuments(prev => ({
            ...prev,
            [path]: { ...prev[path], ...updates }
        }));
    }, []);

    const ensureDocumentLoaded = useCallback(async (path: string): Promise<boolean> => {
        // Check ref directly
        if (documentsRef.current[path]) return true;

        try {
            const content = await invoke<string>("fs_read_file", { path });
            const name = path.split(/[\\/]/).pop() || "Untitled";

            setDocuments(prev => {
                if (prev[path]) return prev;
                return {
                    ...prev,
                    [path]: { path, name, content, originalContent: content, isDirty: false }
                };
            });
            return true;
        } catch (err) {
            console.error("Failed to load file", err);
            return false;
        }
    }, []);

    const saveDocument = useCallback(async (path: string) => {
        const doc = documentsRef.current[path];
        if (!doc) return;

        try {
            await invoke("fs_write_file", { path: doc.path, content: doc.content });
            updateDoc(doc.path, { originalContent: doc.content, isDirty: false });
            console.log("Saved", doc.path);
        } catch (err) {
            console.error(err);
        }
    }, [updateDoc]);

    const createVirtualDocument = useCallback((path: string, content: string, name: string) => {
        setDocuments(prev => ({
            ...prev,
            [path]: { path, name, content, originalContent: content, isDirty: true }
        }));
    }, []);

    const removeDocument = useCallback((path: string) => {
        setDocuments(prev => {
            const next = { ...prev };
            delete next[path];
            return next;
        });
    }, []);

    return {
        documents,
        ensureDocumentLoaded,
        updateDoc,
        saveDocument,
        createVirtualDocument,
        removeDocument
    };
}
