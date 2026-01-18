import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, ChevronsLeft, FilePlus, FolderPlus, Settings, LogOut, Command, Copy, Scissors, Clipboard, Undo, Redo, Check } from 'lucide-react';
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Window } from '@tauri-apps/api/window';

const appWindow = getCurrentWebviewWindow();

// Menu Item Types
type MenuItemType =
    | { type: 'item', label: string, icon?: any, shortcut?: string, action?: () => void, checked?: boolean }
    | { type: 'separator' }
    | { type: 'submenu', label: string, icon?: any, items: MenuItemType[] };

export const SidebarMenu: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
    // Top-level state: Is the Menu Bar visible?
    const [isMenuBarOpen, setIsMenuBarOpen] = useState(false);
    // Active Category (File, Edit, etc) - if not null, that dropdown is open
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number, height: number }>({ top: 0, left: 0, height: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    // Global click listener to close menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInsidePortal = portalRef.current && portalRef.current.contains(target);
            const isInsideContainer = containerRef.current && containerRef.current.contains(target);

            if (!isInsidePortal && !isInsideContainer) {
                setIsMenuBarOpen(false);
                setActiveCategory(null);
            }
        };

        if (isMenuBarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuBarOpen]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isMenuBarOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Align perfectly with the sidebar header container
            setMenuPosition({ top: rect.top, left: rect.right, height: rect.height });
        }
        setIsMenuBarOpen(!isMenuBarOpen);
        if (isMenuBarOpen) setActiveCategory(null);
    };

    const handleNewWindow = async () => {
        closeAll();
        try {
            const label = `win-${Date.now()}`;
            // @ts-ignore
            new Window(label, {
                url: 'index.html',
                title: 'Typoly',
                width: 1000,
                height: 800,
            });
        } catch (e) {
            console.error("Failed to open new window", e);
        }
    };

    const closeAll = () => {
        setIsMenuBarOpen(false);
        setActiveCategory(null);
    };

    // --- Menu Definitions ---

    const MENU_STRUCTURE: Record<string, MenuItemType[]> = {
        File: [
            { type: 'item', label: 'New Window', icon: FilePlus, shortcut: 'Ctrl+Shift+N', action: handleNewWindow },
            { type: 'item', label: 'Open Folder...', icon: FolderPlus, shortcut: 'Ctrl+O' },
            { type: 'separator' },
            { type: 'item', label: 'Save', shortcut: 'Ctrl+S' },
            { type: 'item', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
            { type: 'separator' },
            { type: 'item', label: 'Exit', icon: LogOut, action: () => appWindow.close() },
        ],
        Edit: [
            { type: 'item', label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z' },
            { type: 'item', label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y' },
            { type: 'separator' },
            { type: 'item', label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X' },
            { type: 'item', label: 'Copy', icon: Copy, shortcut: 'Ctrl+C' },
            { type: 'item', label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+V' },
        ],
        View: [
            { type: 'item', label: 'Command Palette...', icon: Command, shortcut: 'Ctrl+Shift+P' },
            { type: 'separator' },
            { type: 'item', label: 'Appearance', icon: Settings, action: () => { } }, // Example submenu placeholder
            { type: 'item', label: 'Zoom In', shortcut: 'Ctrl+=' },
            { type: 'item', label: 'Zoom Out', shortcut: 'Ctrl+-' },
            { type: 'item', label: 'Reset Zoom', shortcut: 'Ctrl+0' },
        ],
        Help: [
            { type: 'item', label: 'Documentation' },
            { type: 'item', label: 'Release Notes' },
            { type: 'separator' },
            { type: 'item', label: 'About Typoly' },
        ]
    };

    // --- Render Components ---

    const MenuDropdown = ({ items }: { items: MenuItemType[] }) => (
        <div className="absolute top-full left-0 min-w-[240px] bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl shadow-2xl shadow-slate-900/10 py-1 z-50 flex flex-col mt-1 animate-in fade-in zoom-in-95 slide-in-from-top-0.5 duration-200 ease-out ring-1 ring-slate-900/5 select-none">
            {items.map((item, idx) => {
                if (item.type === 'separator') {
                    return <div key={idx} className="my-1 border-t border-slate-200/60 mx-3" />;
                }
                if (item.type === 'item') {
                    return (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                item.action?.();
                                if (item.action) closeAll();
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-500/20 flex items-center gap-2 group relative text-[12px] font-medium text-slate-700 mx-1 rounded-lg transition-all duration-100"
                            style={{ width: 'calc(100% - 8px)' }}
                        >
                            <span className="w-4 flex items-center justify-center shrink-0">
                                {item.icon && <item.icon size={13} strokeWidth={2} className="text-slate-400 group-hover:text-blue-50 transition-colors" />}
                                {item.checked && !item.icon && <Check size={13} className="text-blue-600 group-hover:text-white" />}
                            </span>
                            <span className="flex-1 truncate leading-none pt-0.5 tracking-tight">{item.label}</span>
                            {item.shortcut && (
                                <span className="ml-auto pl-3 text-[10px] text-slate-400 group-hover:text-blue-100 font-sans font-medium tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
                                    {item.shortcut}
                                </span>
                            )}
                        </button>
                    );
                }
                return null;
            })}
        </div>
    );

    return (
        <div className={`relative flex items-center h-full ${compact ? 'px-1' : 'w-[40px] justify-center'}`} ref={containerRef}>
            {/* Hamburger Button */}
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`p-1.5 rounded-sm transition-colors ${isMenuBarOpen ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-200/50 text-slate-500'} ${compact ? '' : 'mx-1'}`}
                title={isMenuBarOpen ? "Close Menu" : "Application Menu"}
            >
                {isMenuBarOpen ? <ChevronsLeft size={compact ? 16 : 20} /> : <Menu size={compact ? 16 : 20} />}
            </button>

            {/* Menu Bar Overlay - PORTAL */}
            {isMenuBarOpen && createPortal(
                <div
                    ref={portalRef}
                    className="fixed flex items-center bg-slate-50 border-y border-r border-slate-200 z-[9999] px-1 animate-in fade-in slide-in-from-left-2 duration-100 rounded-r shadow-sm"
                    style={{
                        top: menuPosition.top,
                        left: menuPosition.left,
                        height: menuPosition.height || 35,
                        minWidth: '200px'
                    }}
                >
                    {['File', 'Edit', 'View', 'Help'].map((category, index) => (
                        <React.Fragment key={category}>
                            {index > 0 && <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />}
                            <div className="relative h-full flex items-center">
                                <button
                                    onMouseEnter={() => setActiveCategory(category)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCategory(activeCategory === category ? null : category);
                                    }}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-sm mx-0.5 transition-colors ${activeCategory === category
                                        ? 'bg-slate-200 text-slate-900'
                                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                                        }`}
                                >
                                    {category}
                                </button>
                                {/* Dropdown */}
                                {activeCategory === category && (
                                    <MenuDropdown items={MENU_STRUCTURE[category]} />
                                )}
                            </div>
                        </React.Fragment>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};
