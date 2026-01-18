import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Menu, ChevronsLeft, FilePlus, FolderPlus, Settings, LogOut,
    Command, Copy, Scissors, Clipboard, Undo, Redo, Check,
    Info, RefreshCw, Power, Keyboard, Monitor, Github
} from 'lucide-react';
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Window } from '@tauri-apps/api/window';
import { getName, getVersion, getTauriVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-shell';
import { useSettings } from '../../settings/store/SettingsContext';

const appWindow = getCurrentWebviewWindow();

// Menu Item Types
type MenuItemType =
    | { type: 'item', label: string, icon?: any, shortcut?: string, action?: () => void, checked?: boolean }
    | { type: 'separator' }
    | { type: 'submenu', label: string, icon?: any, items: MenuItemType[] };

const AboutPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [info, setInfo] = useState({ name: 'Typoly', version: 'Fetching...', tauri: '', arc: '' });

    useEffect(() => {
        const init = async () => {
            try {
                const name = await getName();
                const version = await getVersion();
                const tauri = await getTauriVersion();
                setInfo({ name, version, tauri, arc: 'x86_64' });
            } catch (e) { console.error(e); }
        };
        init();
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="group relative w-[360px] h-[500px] rounded-[24px] p-1 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-300"
                onClick={e => e.stopPropagation()}
                style={{ perspective: '1000px' }}
            >
                {/* Rainbow/Holographic Border Gradient */}
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#ff0000] via-[#00ff00] to-[#0000ff] opacity-50 blur-xl group-hover:opacity-75 transition-opacity duration-500 animate-[spin_4s_linear_infinite]" />

                {/* 2nd Layer Border */}
                <div className="absolute inset-[2px] rounded-[22px] bg-slate-900 z-0" />

                {/* Card Content Container */}
                <div className="relative h-full w-full bg-slate-900/40 backdrop-blur-xl rounded-[22px] border border-white/10 overflow-hidden flex flex-col items-center justify-between py-10 z-10 text-white">

                    {/* Grid Pattern Background */}
                    <div className="absolute inset-0 z-0 opacity-[0.08] pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                            backgroundSize: '24px 24px'
                        }}
                    />

                    {/* Diagonal Glare Sweep Animation - Modified for "Slow In, Fast Out" */}
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[22px]">
                        <div className="absolute -top-[50%] -left-[50%] w-[35%] h-[200%] bg-gradient-to-r from-transparent via-white/50 to-transparent transform-gpu rotate-45 animate-[shimmer_3s_infinite]" style={{ animationTimingFunction: 'cubic-bezier(0.7, 0, 1, 1)' }} />
                    </div>

                    {/* Content Top */}
                    <div className="flex flex-col items-center w-full z-30">
                        {/* Logo Box with Foil Effect */}
                        <div className="relative w-24 h-24 mb-6 group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-60 animate-pulse" />
                            <div className="relative w-full h-full bg-slate-900 rounded-2xl border border-white/10 flex items-center justify-center shadow-inner overflow-hidden">
                                <img src="/logo.png" alt="Typoly Logo" className="w-16 h-16 object-contain relative z-10 drop-shadow-lg" />
                                {/* Subtle internal glow for the image */}
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 mix-blend-overlay" />
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-extrabold tracking-tight mb-4 flex items-center gap-2 text-white drop-shadow-md">
                            {info.name}
                        </h2>
                    </div>

                    {/* Stats / Info Grid */}
                    <div className="w-full px-6 z-30 space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5 group-hover:border-white/20 transition-colors">
                            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Version</span>
                            <span className="font-mono text-cyan-300 text-sm drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]">{info.version}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5 group-hover:border-white/20 transition-colors">
                            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tauri Core</span>
                            <span className="font-mono text-purple-300 text-sm">{info.tauri}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5 group-hover:border-white/20 transition-colors">
                            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Dev</span>
                            <span className="font-mono text-pink-300 text-sm">HengVvang</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5 group-hover:border-white/20 transition-colors cursor-pointer hover:bg-white/5 px-1 rounded -mx-1" onClick={() => open('https://github.com/HengVvang/typoly')}>
                            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <Github size={12} />
                                Repository
                            </span>
                            <span className="font-mono text-blue-300 text-xs underline decoration-blue-300/30 hover:decoration-blue-300">github.com</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={onClose}
                        className="mt-4 px-8 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all z-30"
                    >
                        Close
                    </button>

                    {/* Decorative Holographic Overlay */}
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-transparent via-white to-transparent pointer-events-none mix-blend-overlay" />
                </div>
            </div>
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-200%) translateY(-50%) rotate(45deg); }
                    100% { transform: translateX(800%) translateY(50%) rotate(45deg); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export const SidebarMenu: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { setSettingsOpen } = useSettings();
    // Top-level state: Is the Menu Bar visible?
    const [isMenuBarOpen, setIsMenuBarOpen] = useState(false);
    // Active Category (File, Edit, etc) - if not null, that dropdown is open
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showAbout, setShowAbout] = useState(false);

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
        Typoly: [
            { type: 'item', label: 'About Typoly', icon: Info, action: () => setShowAbout(true) },
            { type: 'separator' },
            { type: 'item', label: 'Preferences...', icon: Settings, shortcut: 'Ctrl+,', action: () => setSettingsOpen(true) },
            { type: 'item', label: 'Check for Updates...', icon: RefreshCw },
            { type: 'separator' },
            { type: 'item', label: 'Quit Typoly', icon: Power, shortcut: 'Ctrl+Q', action: () => appWindow.close() }
        ],
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
            { type: 'item', label: 'Editor Layout', icon: Monitor },
            { type: 'item', label: 'Appearance', icon: Settings, action: () => setSettingsOpen(true) },
            { type: 'separator' },
            { type: 'item', label: 'Zoom In', shortcut: 'Ctrl+=' },
            { type: 'item', label: 'Zoom Out', shortcut: 'Ctrl+-' },
            { type: 'item', label: 'Reset Zoom', shortcut: 'Ctrl+0' },
        ],
        Help: [
            { type: 'item', label: 'Documentation', icon: FilePlus },
            { type: 'item', label: 'Keyboard Shortcuts', icon: Keyboard },
            { type: 'separator' },
            { type: 'item', label: 'About Typoly', icon: Info, action: () => setShowAbout(true) },
        ]
    };

    // --- Render Components ---

    return (
        <div className={`relative flex items-center h-full ${compact ? 'px-1' : 'w-[40px] justify-center'}`} ref={containerRef}>
            {/* About Panel Modal */}
            {showAbout && <AboutPanel onClose={() => setShowAbout(false)} />}

            {/* Hamburger Button */}
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`p-1.5 rounded transition-colors ${isMenuBarOpen ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100 text-slate-500'}`}
                title={isMenuBarOpen ? "Close Menu" : "Application Menu"}
            >
                {isMenuBarOpen ? <ChevronsLeft size={16} /> : <Menu size={16} />}
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
                    {['Typoly', 'File', 'Edit', 'View', 'Help'].map((category, index) => (
                        <React.Fragment key={category}>
                            {index > 0 && <div className="w-[1px] h-3 bg-slate-200 mx-0.5" />}
                            <div className="relative h-full flex items-center">
                                <button
                                    onMouseEnter={() => setActiveCategory(category)}
                                    // onClick now also just toggles the category active state or does nothing if hover handles it
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
                                    <MenuDropdown
                                        items={MENU_STRUCTURE[category]}
                                        onClose={closeAll}
                                    />
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

// --- Extracted MenuDropdown to prevent re-creation lag ---
const MenuDropdown = ({ items, onClose }: { items: MenuItemType[], onClose: () => void }) => (
    <div className="absolute top-full left-0 min-w-[240px] bg-white/95 backdrop-blur-xl border border-white/40 rounded-xl shadow-2xl shadow-slate-900/10 py-1 z-50 flex flex-col mt-1 animate-in fade-in zoom-in-95 slide-in-from-top-0.5 duration-150 ease-out ring-1 ring-slate-900/5 select-none origin-top-left">
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
                            // Optional: slight delay or just execute
                            if (item.action) {
                                item.action();
                                onClose();
                            }
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-500/20 flex items-center gap-2 group relative text-[12px] font-medium text-slate-700 mx-1 rounded-lg transition-all duration-75"
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
