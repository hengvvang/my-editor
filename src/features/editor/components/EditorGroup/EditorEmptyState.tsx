import React from 'react';
import { X } from "lucide-react";
import { GlobalFontStyles } from "./GlobalFontStyles";

interface EditorEmptyStateProps {
    onCloseGroup?: () => void;
    useMonospace: boolean;
}

export const EditorEmptyState: React.FC<EditorEmptyStateProps> = ({ onCloseGroup, useMonospace }) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/30 items-center justify-center relative select-none overflow-hidden">
            <GlobalFontStyles useMonospace={useMonospace} />
            {onCloseGroup && (
                <button
                    onClick={onCloseGroup}
                    className="absolute top-2 right-2 p-2 hover:bg-slate-200 text-slate-400 hover:text-red-500 rounded-md transition-all z-10"
                    title="Close Group"
                >
                    <X size={16} />
                </button>
            )}

            <div className="flex flex-col items-center animate-in fade-in duration-700 slide-in-from-bottom-4">
                {/* Background removed for performance */}
            </div>
        </div>
    );
};
