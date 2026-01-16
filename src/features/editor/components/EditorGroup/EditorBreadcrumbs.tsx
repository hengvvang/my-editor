import React, { useMemo, useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, Folder, FileText, FileCode, FileJson, FileType, Check } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { FileEntry } from "../../../../shared/types";

interface EditorBreadcrumbsProps {
    activePath: string | null;
    rootDir: string | null;
    onSwitchTab: (path: string) => void;
    onOpenFile?: (path: string) => void;
}

// Helper to guess icon
const getFileIcon = (name: string, isDir: boolean, isOpen: boolean) => {
    if (isDir) return <Folder size={14} className={isOpen ? "text-blue-500 fill-blue-500/20" : "text-blue-400"} />;
    const lower = name.toLowerCase();
    if (lower.endsWith('.tsx') || lower.endsWith('.ts') || lower.endsWith('.js') || lower.endsWith('.jsx')) return <FileCode size={14} className="text-yellow-500" />;
    if (lower.endsWith('.css') || lower.endsWith('.scss')) return <FileType size={14} className="text-blue-400" />;
    if (lower.endsWith('.json')) return <FileJson size={14} className="text-green-500" />;
    if (lower.endsWith('.md')) return <FileText size={14} className="text-slate-500" />;
    return <FileText size={14} className="text-slate-400" />;
};

interface BreadcrumbNodeProps {
    file: FileEntry;
    activePath: string | null;
    depth: number;
    onSwitchTab: (path: string) => void;
    onOpenFile?: (path: string) => void;
    onCloseDropdown: () => void;
}

const BreadcrumbNode: React.FC<BreadcrumbNodeProps> = ({ file, activePath, depth, onSwitchTab, onOpenFile, onCloseDropdown }) => {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileEntry[] | null>(file.children || null);
    const [loading, setLoading] = useState(false);

    const handleExpand = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!file.is_dir) return;

        if (!expanded) {
            if (!children) {
                setLoading(true);
                try {
                    const res = await invoke<FileEntry[]>("read_dir", { path: file.path });
                    // Sort folders first
                    res.sort((a, b) => {
                        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
                        return a.is_dir ? -1 : 1;
                    });
                    setChildren(res);
                } catch (err) {
                    console.error("Failed to load children", err);
                } finally {
                    setLoading(false);
                }
            }
            setExpanded(true);
        } else {
            setExpanded(false);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (file.is_dir) {
            handleExpand(e);
        } else {
            if (onOpenFile) {
                onOpenFile(file.path);
            } else {
                onSwitchTab(file.path);
            }
            onCloseDropdown();
        }
    };

    const isActive = file.path === activePath;

    return (
        <div>
            <div
                className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-xs select-none transition-colors duration-100 ${isActive ? 'bg-blue-100/50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleClick}
            >
                <div className="shrink-0 flex items-center justify-center w-4 h-4 text-slate-400 hover:text-slate-600" onClick={file.is_dir ? handleExpand : undefined}>
                    {file.is_dir && (
                        loading ? (
                            <div className="w-2.5 h-2.5 rounded-full border border-blue-400 border-t-transparent animate-spin" />
                        ) : (
                            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                        )
                    )}
                </div>

                {getFileIcon(file.name, file.is_dir, expanded)}

                <span className={`truncate ${isActive ? 'font-medium' : ''}`}>
                    {file.name}
                </span>

                {isActive && <Check size={12} className="ml-auto text-blue-500" />}
            </div>

            {expanded && children && (
                <div className="border-l border-slate-100 ml-3">
                    {children.map(child => (
                        <BreadcrumbNode
                            key={child.path}
                            file={child}
                            activePath={activePath}
                            depth={depth + 1}
                            onSwitchTab={onSwitchTab}
                            onOpenFile={onOpenFile}
                            onCloseDropdown={onCloseDropdown}
                        />
                    ))}
                    {children.length === 0 && (
                        <div className="pl-8 py-1 text-[10px] text-slate-400 italic">Empty</div>
                    )}
                </div>
            )}
        </div>
    );
};

export const EditorBreadcrumbs: React.FC<EditorBreadcrumbsProps> = ({
    activePath,
    rootDir,
    onSwitchTab,
    onOpenFile
}) => {
    const [dropdown, setDropdown] = useState<{ path: string; items: FileEntry[] } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Generate segments
    const breadcrumbs = useMemo(() => {
        if (!activePath) return [];
        const parts: { name: string; path: string; isDir: boolean }[] = [];
        let displayPath = activePath.replace(/\\/g, '/');
        const rootRaw = rootDir ? rootDir.replace(/\\/g, '/') : null;

        let rootPrefix = "";

        if (rootRaw) {
            const rootName = rootRaw.split('/').pop() || rootRaw;
            parts.push({ name: rootName, path: rootRaw, isDir: true });
            if (displayPath.startsWith(rootRaw)) {
                displayPath = displayPath.substring(rootRaw.length);
                rootPrefix = rootRaw;
            }
        }

        if (displayPath.startsWith('/')) displayPath = displayPath.substring(1);

        const segments = displayPath.split('/');
        // Filter empty segments just in case
        const validSegments = segments.filter(s => s.length > 0);

        let currentPath = rootPrefix;
        validSegments.forEach((seg, index) => {
            if (currentPath.endsWith('/') || currentPath === "") currentPath += seg;
            else currentPath += '/' + seg;

            // Fix double slashes if rootRaw was empty or something
            if (currentPath.startsWith('//')) currentPath = currentPath.substring(1);

            const isLast = index === validSegments.length - 1;
            parts.push({ name: seg, path: currentPath, isDir: !isLast });
        });

        return parts;
    }, [activePath, rootDir]);

    const handleSegmentClick = async (item: { path: string; isDir: boolean }) => {
        if (dropdown?.path === item.path) {
            setDropdown(null);
            return;
        }

        // We want to list the CONTENTS of the clicked folder.
        // If it's a file (the last one), we usually list siblings?
        // VS Code behavior: Clicking the file name reveals siblings. Clicking a folder reveals contents.
        let targetPath = item.path;
        if (!item.isDir) {
            // It is a file, show parent dir contents
            const parent = item.path.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
            targetPath = parent;
        }

        try {
            const files = await invoke<FileEntry[]>("read_dir", { path: targetPath });
            // Sort
            files.sort((a, b) => {
                if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
                return a.is_dir ? -1 : 1;
            });
            setDropdown({ path: item.path, items: files });
        } catch (err) {
            console.error("Failed to fetch path", err);
        }
    };

    return (
        <div className="flex items-center gap-0.5 px-3 h-[30px] text-xs text-slate-500 bg-slate-50/50 border-b border-transparent shrink-0 select-none relative z-30" ref={dropdownRef}>
            {breadcrumbs.map((part, index) => {
                const isDropdownActive = dropdown?.path === part.path;
                return (
                    <React.Fragment key={part.path}>
                        {index > 0 && <ChevronRight size={12} className="text-slate-300 shrink-0 mx-0.5" />}
                        <div className="relative h-full flex items-center">
                            <div
                                className={`
                                    flex items-center gap-1.5 px-1.5 py-0.5 rounded-md cursor-pointer transition-all duration-200
                                    ${isDropdownActive ? 'bg-slate-200 text-slate-900 font-medium' : 'hover:bg-slate-200/50 hover:text-slate-800'}
                                    ${index === breadcrumbs.length - 1 && !isDropdownActive ? 'text-slate-700 font-medium' : ''}
                                `}
                                onClick={() => handleSegmentClick(part)}
                            >
                                {part.isDir ? <Folder size={12} className={isDropdownActive ? "text-blue-600" : "text-slate-400"} /> : <FileText size={12} className="text-blue-500 opacity-90" />}
                                <span className="whitespace-nowrap max-w-[150px] truncate">{part.name}</span>
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Floating Dropdown Tree */}
            {dropdown && (
                <div
                    className="absolute top-full left-0 mt-1 bg-white ring-1 ring-slate-900/5 shadow-xl rounded-lg py-2 min-w-[240px] max-w-[400px] max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100 z-50 flex flex-col"
                    // Align dropdown left with the breadcrumb bar origin, or we could try to align with the specific segment, but usually full-left is safer for overflow
                    style={{ left: '16px' }}
                >
                    <div className="px-3 pb-1 border-b border-slate-50 mb-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Contents
                    </div>
                    {dropdown.items.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-400 italic text-xs">Directory is empty</div>
                    ) : (
                        dropdown.items.map(file => (
                            <BreadcrumbNode
                                key={file.path}
                                file={file}
                                activePath={activePath}
                                depth={0}
                                onSwitchTab={onSwitchTab}
                                onOpenFile={onOpenFile}
                                onCloseDropdown={() => setDropdown(null)}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
