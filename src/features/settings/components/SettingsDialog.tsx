import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Monitor, Type, Keyboard, Layout, RefreshCw } from 'lucide-react';
import { useSettings } from '../store/SettingsContext';

const Categories = [
    { id: 'general', label: 'General', icon: Monitor },
    { id: 'editor', label: 'Editor', icon: Type },
    { id: 'appearance', label: 'Appearance', icon: Layout },
    { id: 'typing', label: 'Typing', icon: Keyboard },
] as const;

type CategoryId = typeof Categories[number]['id'];

export const SettingsDialog: React.FC = () => {
    const { settings, updateSettings, isSettingsOpen, setSettingsOpen, resetSettings } = useSettings();
    const [activeCategory, setActiveCategory] = useState<CategoryId>('general');

    if (!isSettingsOpen) return null;

    const renderToggle = (
        label: string,
        description: string,
        checked: boolean,
        onChange: (val: boolean) => void
    ) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div>
                <div className="text-sm font-medium text-slate-700">{label}</div>
                <div className="text-xs text-slate-500">{description}</div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );

    const renderInput = (
        label: string,
        description: string,
        value: string | number,
        onChange: (val: any) => void,
        type: 'text' | 'number' = 'text'
    ) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div>
                <div className="text-sm font-medium text-slate-700">{label}</div>
                <div className="text-xs text-slate-500">{description}</div>
            </div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                className="ml-4 rounded-md border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-2 py-1 border outline-none w-32 text-right"
            />
        </div>
    );

    const renderSelect = (
        label: string,
        description: string,
        value: string,
        options: { label: string; value: string }[],
        onChange: (val: string) => void
    ) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div>
                <div className="text-sm font-medium text-slate-700">{label}</div>
                <div className="text-xs text-slate-500">{description}</div>
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="ml-4 rounded-md border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-2 py-1 border outline-none min-w-[120px]"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );

    const renderContent = () => {
        switch (activeCategory) {
            case 'general':
                return (
                    <>
                        {renderSelect(
                            'Language',
                            'Application language',
                            settings.general.language,
                            [
                                { label: 'English', value: 'en' },
                                { label: '简体中文', value: 'zh-cn' },
                            ],
                            (v) => updateSettings('general', { language: v as any })
                        )}
                        {renderToggle(
                            'Auto Save',
                            'Automatically save changes editor loses focus',
                            settings.general.autoSave,
                            (v) => updateSettings('general', { autoSave: v })
                        )}
                        {settings.general.autoSave && renderInput(
                            'Auto Save Delay',
                            'Delay in milliseconds before saving',
                            settings.general.autoSaveDelay,
                            (v) => updateSettings('general', { autoSaveDelay: v }),
                            'number'
                        )}
                    </>
                );
            case 'editor':
                return (
                    <>
                        {renderInput('Font Size', 'Editor font size in pixels', settings.editor.fontSize, (v) => updateSettings('editor', { fontSize: v }), 'number')}
                        {renderInput('Tab Size', 'Number of spaces per tab', settings.editor.tabSize, (v) => updateSettings('editor', { tabSize: v }), 'number')}
                        {renderToggle('Line Numbers', 'Show line numbers in the gutter', settings.editor.lineNumbers, (v) => updateSettings('editor', { lineNumbers: v }))}
                        {renderToggle('Relative Line Numbers', 'Show relative line numbers', settings.editor.relativeLineNumbers, (v) => updateSettings('editor', { relativeLineNumbers: v }))}
                        {renderToggle('Minimap', 'Show code minimap on the right', settings.editor.showMinimap, (v) => updateSettings('editor', { showMinimap: v }))}
                        {renderToggle('Word Wrap', 'Wrap long lines', settings.editor.wordWrap, (v) => updateSettings('editor', { wordWrap: v }))}
                        {renderInput('Font Family', 'Custom font family', settings.editor.fontFamily, (v) => updateSettings('editor', { fontFamily: v }), 'text')}
                    </>
                );
            case 'appearance':
                return (
                    <>
                        {renderSelect(
                            'Theme Mode',
                            'Color theme preference',
                            settings.appearance.theme,
                            [
                                { label: 'Light', value: 'light' },
                                { label: 'Dark', value: 'dark' },
                                { label: 'System', value: 'system' },
                            ],
                            (v) => updateSettings('appearance', { theme: v as any })
                        )}
                        {renderToggle('Compact Sidebar', 'Reduce sidebar width and hide labels', settings.appearance.sidebarCompactMode, (v) => updateSettings('appearance', { sidebarCompactMode: v }))}
                    </>
                );
            case 'typing':
                return (
                    <>
                        {renderInput('Target WPM', 'Target Words Per Minute goal', settings.typing.targetWpm, (v) => updateSettings('typing', { targetWpm: v }), 'number')}
                        {renderToggle('Sound Effects', 'Enable typing sounds', settings.typing.soundEnabled, (v) => updateSettings('typing', { soundEnabled: v }))}
                        {settings.typing.soundEnabled && renderInput('Volume', 'Sound volume (0.0 - 1.0)', settings.typing.soundVolume, (v) => updateSettings('typing', { soundVolume: Math.min(1, Math.max(0, parseFloat(v))) }), 'number')}
                    </>
                );
            default:
                return null;
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSettingsOpen(false)}>
            <div
                className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[800px] h-[600px] flex overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-48 bg-slate-50 border-r border-slate-200 p-4 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 px-2">Settings</h2>
                    <nav className="flex-1 space-y-1">
                        {Categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-slate-600 hover:bg-slate-200/50'
                                    }`}
                            >
                                <cat.icon size={18} />
                                {cat.label}
                            </button>
                        ))}
                    </nav>
                    <div className="pt-4 border-t border-slate-200">
                        <button
                            onClick={resetSettings}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <RefreshCw size={16} />
                            Reset Defaults
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
                        <h3 className="text-lg font-medium text-slate-800">
                            {Categories.find(c => c.id === activeCategory)?.label}
                        </h3>
                        <button
                            onClick={() => setSettingsOpen(false)}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
