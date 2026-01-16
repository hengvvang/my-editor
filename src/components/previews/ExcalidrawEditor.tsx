import React, { useState, useEffect, useRef } from "react";
// @ts-ignore
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
// @ts-ignore
import { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";
import "@excalidraw/excalidraw/index.css"; // --- CRITICAL: Import Excalidraw CSS ---

// --- GLOBAL FIX FOR ASSET LOADING ---
// Ensure Excalidraw finds its assets in the public folder even in offline/Tauri environment
if (typeof window !== 'undefined') {
    (window as any).EXCALIDRAW_ASSET_PATH = "/excalidraw-assets/";
}

interface ExcalidrawEditorProps {
    content: string; // JSON string
    onChange: (newContent: string) => void;
    theme?: "light" | "dark";
}

export const ExcalidrawEditor: React.FC<ExcalidrawEditorProps> = ({ content, onChange, theme = "light" }) => {
    // Dynamically load the component to avoid SSR/bundling issues with global objects if any
    const [ExcalidrawModule, setExcalidrawModule] = useState<any>(null);
    const lastSavedData = useRef<string>(content);

    useEffect(() => {
        import("@excalidraw/excalidraw").then((mod) => {
            setExcalidrawModule(mod);
        });
    }, []);

    // Parse initial data safely
    const initialData = React.useMemo(() => {
        try {
            return content && content.trim() ? JSON.parse(content) : null;
        } catch (e) {
            console.error("Failed to parse Excalidraw JSON", e);
            return null;
        }
    }, []); // Only on mount

    // Debounced Save
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleChange = (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(() => {
            // Serialize
            // minimal data to save
            const data = {
                type: "excalidraw",
                version: 2,
                source: "typoly",
                elements,
                appState: {
                    viewBackgroundColor: appState.viewBackgroundColor,
                    gridSize: appState.gridSize,
                    theme: appState.theme,
                },
                files,
            };

            const jsonString = JSON.stringify(data, null, 2);

            if (jsonString !== lastSavedData.current) {
                lastSavedData.current = jsonString;
                onChange(jsonString);
            }
        }, 1000); // 1s debounce to reduce writes
    };

    if (!ExcalidrawModule) return <div className="flex items-center justify-center h-full text-slate-400 bg-white dark:bg-slate-900">Loading Excalidraw...</div>;

    const { Excalidraw, MainMenu } = ExcalidrawModule;

    return (
        <div className="h-full w-full excalidraw-wrapper relative" style={{ isolation: "isolate" }}>
            {/* Force light/dark mode styles wrapper if needed, though Excalidraw handles its own theme */}
            <Excalidraw
                theme={theme}
                initialData={initialData}
                onChange={handleChange}
                // Ensure offline functionality by pointing to public assets
                // Use /excalidraw-assets/ which maps to public/excalidraw-assets/
                validateEmbeddable={true}
            >
                <MainMenu>
                    <MainMenu.DefaultItems.SaveAsImage />
                    <MainMenu.DefaultItems.Export />
                    <MainMenu.DefaultItems.ClearCanvas />
                    <MainMenu.Separator />
                    <MainMenu.DefaultItems.ToggleTheme />
                    <MainMenu.DefaultItems.ChangeCanvasBackground />
                </MainMenu>
            </Excalidraw>
        </div>
    );
};
