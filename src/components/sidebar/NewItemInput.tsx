import React, { useState, useEffect, useRef } from "react";
import { FileText, Folder } from "lucide-react";

interface NewItemInputProps {
    type: 'file' | 'folder';
    level: number;
    onConfirm: (name: string) => void;
    onCancel: () => void;
}

export const NewItemInput: React.FC<NewItemInputProps> = ({ type, level, onConfirm, onCancel }) => {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            if (value.trim()) {
                onConfirm(value.trim());
            } else {
                onCancel();
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleBlur = () => {
        // VS Code behavior: submit on blur if not empty, otherwise cancel
        // But for safety, let's submit. If user clicks away, they usually mean "done".
        if (value.trim()) {
            onConfirm(value.trim());
        } else {
            onCancel();
        }
    };

    return (
        <div
            className="flex items-center gap-1.5 py-1 pr-2 bg-slate-100 border-l-2 border-transparent"
            style={{ paddingLeft: `${level * 10 + 22}px` }} // +22 to align with file icon position (chevron 4 + gap 1.5 + icon 14 etc) -> needs tuning
        >
            {type === 'folder' ? (
                <Folder size={14} className="shrink-0 text-blue-500" />
            ) : (
                <FileText size={14} className="shrink-0 text-slate-500" />
            )}
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="flex-1 min-w-0 h-5 text-sm bg-white border border-blue-400 outline-none px-1 rounded-sm text-slate-700"
                onClick={(e) => e.stopPropagation()}
                placeholder={type === 'folder' ? 'Folder Name' : 'File Name'}
            />
        </div>
    );
};
