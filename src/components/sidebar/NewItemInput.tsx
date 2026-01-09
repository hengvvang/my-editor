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
            className="flex items-center gap-1.5 h-[22px] bg-[#0090f1]/10 border border-[#0090f1] pr-1"
            style={{ marginLeft: `${level * 10 + 16}px` }}
        >
            <span className="shrink-0 text-[#424242] ml-1">
                {type === 'folder' ? <Folder size={16} className="text-[#dcb67a]" fill="currentColor" /> : <FileText size={15} className="text-[#757575]" />}
            </span>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="flex-1 bg-transparent border-none outline-none text-[13px] min-w-0"
                placeholder={type === 'folder' ? "Folder Name" : "File Name"}
            />
        </div>
    );
};
