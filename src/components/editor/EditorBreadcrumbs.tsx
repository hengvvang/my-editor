import React, { useMemo, useState, useEffect } from "react";
import { ChevronRight, Folder, FileText } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { FileEntry } from "../../types";

interface EditorBreadcrumbsProps {
    activePath: string | null;
    rootDir: string | null;
    onSwitchTab: (path: string) => void;
}

export const EditorBreadcrumbs: React.FC<EditorBreadcrumbsProps> = ({
    activePath,
    rootDir,
    onSwitchTab
}) => {
    const [breadcrumbDropdown, setBreadcrumbDropdown] = useState<{ path: string; type: 'file' | 'folder'; items: FileEntry[] } | null>(null);

    useEffect(() => {
        const h = () => setBreadcrumbDropdown(null);
        window.addEventListener('click', h);
        return () => window.removeEventListener('click', h);
    }, []);

    // --- Breadcrumb Logic ---
    const breadcrumbs = useMemo(() => {
        if (!activePath) return [];
        const parts: { name: string; path: string; isDir: boolean }[] = [];
        let displayPath = activePath.replace(/\\/g, '/');
        const rootRaw = rootDir ? rootDir.replace(/\\/g, '/') : null;
        if (rootRaw) {
            const rootName = rootRaw.split('/').pop() || rootRaw;
            parts.push({ name: rootName, path: rootRaw, isDir: true });
            if (displayPath.startsWith(rootRaw)) {
                displayPath = displayPath.substring(rootRaw.length);
            }
        }
        if (displayPath.startsWith('/')) displayPath = displayPath.substring(1);
        const segments = displayPath.split('/');
        let currentAccumulated = rootRaw || "";
        segments.forEach((seg, index) => {
            if (!seg) return;
            if (currentAccumulated === "") currentAccumulated = seg;
            else if (currentAccumulated.endsWith('/')) currentAccumulated += seg;
            else currentAccumulated += '/' + seg;
            const isLast = index === segments.length - 1;
            parts.push({ name: seg, path: currentAccumulated, isDir: !isLast });
        });
        return parts;
    }, [activePath, rootDir]);

    const handleBreadcrumbClick = async (e: React.MouseEvent, item: { path: string; isDir: boolean }) => {
        e.stopPropagation();
        if (breadcrumbDropdown?.path === item.path) {
            setBreadcrumbDropdown(null);
            return;
        }
        let targetPath = item.path;
        if (!item.isDir) {
            const s = item.path.replace(/\\/g, '/').split('/');
            s.pop();
            targetPath = s.join('/');
        }
        try {
            const files = await invoke<FileEntry[]>("read_dir", { path: targetPath });
            files.sort((a, b) => {
                if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
                return a.is_dir ? -1 : 1;
            });
            setBreadcrumbDropdown({ path: item.path, type: 'file', items: files });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex items-center gap-1 px-4 py-0.5 text-[11px] text-slate-500 bg-white border-b border-slate-100 shrink-0 select-none relative z-30 h-[22px]">
            {breadcrumbs.map((part, index) => (
                <React.Fragment key={part.path}>
                    {index > 0 && <ChevronRight size={10} className="opacity-40 shrink-0" />}
                    <div className="relative flex items-center">
                        <span
                            className={`hover:bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 ${index === breadcrumbs.length - 1 ? 'font-medium text-slate-800' : 'text-slate-500'
                                } ${breadcrumbDropdown?.path === part.path ? 'bg-slate-100 text-slate-800' : ''}`}
                            onClick={(e) => handleBreadcrumbClick(e, part)}
                        >
                            {part.isDir ? <Folder size={12} className={index === breadcrumbs.length - 1 ? "text-slate-400" : "opacity-70"} /> : <FileText size={12} className="text-blue-500" />}
                            <span className="whitespace-nowrap">{part.name}</span>
                        </span>
                        {/* Dropdown */}
                        {breadcrumbDropdown?.path === part.path && (
                            <div className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-slate-200 rounded-lg py-1 min-w-[200px] w-max max-w-[400px] max-h-[300px] overflow-y-auto z-[100] flex flex-col items-stretch animate-in fade-in zoom-in-95 duration-100">
                                {breadcrumbDropdown.items.length === 0 && (
                                    <div className="px-4 py-2 text-slate-400 italic text-xs">Empty</div>
                                )}
                                {breadcrumbDropdown.type === 'file' && (
                                    (breadcrumbDropdown.items as FileEntry[]).map(file => (
                                        <div
                                            key={file.path}
                                            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${file.path === activePath ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!file.is_dir) {
                                                    onSwitchTab(file.path);
                                                    setBreadcrumbDropdown(null);
                                                }
                                            }}
                                        >
                                            {file.is_dir ? <Folder size={14} className="text-blue-400" /> : <FileText size={14} className={file.path === activePath ? "text-blue-500" : "text-slate-400"} />}
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};
