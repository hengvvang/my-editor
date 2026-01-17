import React, { useState } from 'react';
import { PenTool, Grid, Moon, Palette, Plus, RefreshCw } from 'lucide-react';

interface CanvasPaneProps {
    onStartDrawing?: (config: CanvasConfig) => void;
    isCanvasActive?: boolean;
}

export interface CanvasConfig {
    theme: 'light' | 'dark';
    grid: boolean;
    background: string;
}

const ToggleSwitch = ({ checked, onChange, label, icon: Icon }: { checked: boolean; onChange: (checked: boolean) => void; label: string; icon?: React.ElementType }) => (
    <div
        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100/50 cursor-pointer transition-colors group"
        onClick={() => onChange(!checked)}
    >
        <div className="flex items-center gap-2.5">
            {Icon && <Icon size={16} className={`text-slate-400 group-hover:text-slate-600 transition-colors ${checked ? 'text-blue-500' : ''}`} />}
            <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 select-none">{label}</span>
        </div>
        <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-blue-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-100 rounded-full h-4 w-4 shadow-sm transition-transform duration-200 ease-in-out transform ${checked ? 'translate-x-[16px]' : 'translate-x-0'}`} />
        </div>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{children}</h3>
);

export const CanvasPane: React.FC<CanvasPaneProps> = ({ onStartDrawing, isCanvasActive }) => {
    const [config, setConfig] = useState<CanvasConfig>({
        theme: 'light',
        grid: false,
        background: '#ffffff'
    });

    const handleStart = (forceNew: boolean = false) => {
        console.log("CanvasPane: Start Drawing Clicked", config, "forceNew:", forceNew);
        if (onStartDrawing) {
            // We pass an extra "forceNew" flag in the config object implicitly or handle signature change?
            // SidebarProps defines: onQuickDraw?: (config: CanvasConfig) => void;
            // Let's overload or extend config temporarily
            onStartDrawing({ ...config, forceNew } as any);
        } else {
            console.error("CanvasPane: onStartDrawing prop is missing");
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-auto bg-slate-50">
            {/* Quick Start Hero */}
            <div className="p-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex flex-col gap-3">
                {isCanvasActive ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStart(false)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                        >
                            <RefreshCw size={18} />
                            Update Settings
                        </button>
                        <button
                            onClick={() => handleStart(true)}
                            title="New Canvas"
                            className="flex items-center justify-center w-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all active:scale-95 border border-slate-200"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleStart(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] bg-orange-500 hover:bg-orange-600 active:bg-orange-700"
                    >
                        <PenTool size={18} fill="currentColor" />
                        Start Drawing
                    </button>
                )}
            </div>

            <div className="p-4 space-y-6">
                {/* Settings Grid */}
                <div className="space-y-1">
                    <SectionTitle>Initial Settings</SectionTitle>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 divide-y divide-slate-100">
                        <ToggleSwitch
                            label="Dark Theme"
                            icon={Moon}
                            checked={config.theme === 'dark'}
                            onChange={(checked) => setConfig({ ...config, theme: checked ? 'dark' : 'light' })}
                        />
                        <ToggleSwitch
                            label="Show Grid"
                            icon={Grid}
                            checked={config.grid}
                            onChange={(checked) => setConfig({ ...config, grid: checked })}
                        />

                        {/* Background Color Picker (Simple) */}
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100/50 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-2.5">
                                <Palette size={16} className="text-slate-400 group-hover:text-slate-600" />
                                <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 select-none">Background</span>
                            </div>
                            <div className="flex gap-1">
                                {['#ffffff', '#f0f0f0', '#fff9db', '#e6fcf5'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setConfig({ ...config, background: color })}
                                        className={`w-4 h-4 rounded-full border border-slate-300 ring-2 ring-offset-1 ${config.background === color ? 'ring-blue-500' : 'ring-transparent'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
                    <p className="font-bold mb-1">Canvas Tips:</p>
                    <ul className="list-disc list-inside space-y-0.5 opacity-80">
                        <li>Double-click to add text</li>
                        <li>Right-click to move canvas</li>
                        <li>Scroll to zoom in/out</li>
                        <li>Numbers 1-9 to select tools</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
