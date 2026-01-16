import React, { useState, useMemo } from 'react';
import { Play, BookOpen, Volume2, VolumeX, Repeat, Shuffle, Eye, Settings, Type, RefreshCw, Plus } from 'lucide-react';
import { dictionaries } from '../../../tools/QwertyLearner/config/dictionary';

interface TypingPaneProps {
    onStartPractice?: (dictId: string, chapter: number, config: any, forceNew?: boolean) => void;
    isTypingActive?: boolean;
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

export const TypingPane: React.FC<TypingPaneProps> = ({ onStartPractice, isTypingActive }) => {
    const [selectedDict, setSelectedDict] = useState('cet4');
    const [selectedChapter, setSelectedChapter] = useState(0);
    const [config, setConfig] = useState({
        showTranslation: true,
        showPhonetic: false,
        keySoundEnabled: false,
        hintSoundEnabled: true,
        correctSoundEnabled: true,
        wrongSoundEnabled: true,
        pronunciationEnabled: false,
        loopTimes: 1,
        randomEnabled: false,
        fontSize: 4,
        mode: 'practice', // 'practice' | 'memory'
    });

    const currentDict = dictionaries.find(d => d.id === selectedDict) || dictionaries[0];
    const chaptersCount = currentDict.chapterCount || Math.ceil(currentDict.length / 20);

    // Group dictionaries by category
    const groupedDicts = useMemo(() => {
        const groups: Record<string, typeof dictionaries> = {};
        dictionaries.forEach(dict => {
            const category = dict.category || 'Other';
            if (!groups[category]) groups[category] = [];
            groups[category].push(dict);
        });
        return groups;
    }, []);

    const handleStart = (forceNew: boolean = false) => {
        onStartPractice?.(selectedDict, selectedChapter, config, forceNew);
    };

    const getActionLabel = () => {
        switch (config.mode) {
            case 'memory': return 'Start Memory';
            case 'read': return 'Start Reading';
            default: return 'Start Practice';
        }
    };

    const getModeColor = () => {
        switch (config.mode) {
            case 'memory': return 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800';
            case 'read': return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800';
            default: return 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800';
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-auto bg-slate-50">
            {/* Quick Start Hero */}
            <div className="p-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex flex-col gap-3">
                {/* Mode Switcher */}
                <div className="flex p-1 bg-slate-100 rounded-lg gap-1 border border-slate-200">
                    <button
                        onClick={() => setConfig({ ...config, mode: 'practice' })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-md transition-all ${config.mode === 'practice'
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        <Type size={14} /> Practice
                    </button>
                    <button
                        onClick={() => setConfig({ ...config, mode: 'memory' })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-md transition-all ${config.mode === 'memory'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        <Eye size={14} /> Memory
                    </button>
                    <button
                        onClick={() => setConfig({ ...config, mode: 'read' })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-md transition-all ${config.mode === 'read'
                            ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        <Volume2 size={14} /> Read
                    </button>
                </div>

                {isTypingActive ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStart(false)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] ${getModeColor()}`}
                        >
                            <RefreshCw size={18} />
                            Update Settings
                        </button>
                        <button
                            onClick={() => handleStart(true)}
                            title="Start New Session"
                            className="flex items-center justify-center w-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all active:scale-95 border border-slate-200"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleStart(false)}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] ${getModeColor()}`}
                    >
                        <Play size={18} fill="currentColor" />
                        {getActionLabel()}
                    </button>
                )}
            </div>

            <div className="p-4 space-y-6">

                {/* Dictionary Config */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                        <BookOpen size={16} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dictionary</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <select
                            value={selectedDict}
                            onChange={(e) => { setSelectedDict(e.target.value); setSelectedChapter(0); }}
                            className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all hover:border-slate-300"
                        >
                            {Object.entries(groupedDicts).map(([category, dicts]) => (
                                <optgroup key={category} label={category}>
                                    {dicts.map(dict => (
                                        <option key={dict.id} value={dict.id}>
                                            {dict.name} ({dict.length})
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>

                        <div>
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chapter</span>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                    {selectedChapter + 1} <span className="text-slate-300">/</span> {chaptersCount}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max={Math.max(0, chaptersCount - 1)}
                                value={selectedChapter}
                                onChange={(e) => setSelectedChapter(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:bg-slate-200 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="space-y-1">
                    <SectionTitle>Appearance</SectionTitle>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 divide-y divide-slate-100">
                        <ToggleSwitch
                            label="Show Translation"
                            icon={Type}
                            checked={config.showTranslation}
                            onChange={(checked) => setConfig({ ...config, showTranslation: checked })}
                        />
                        <ToggleSwitch
                            label="Show Phonetic"
                            icon={Eye}
                            checked={config.showPhonetic}
                            onChange={(checked) => setConfig({ ...config, showPhonetic: checked })}
                        />
                        <div className="p-3">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                    <Settings size={16} className="text-slate-400" /> Font Size
                                </span>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{config.fontSize}x</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={config.fontSize}
                                onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })}
                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-500"
                            />
                        </div>
                    </div>
                </div>

                {config.mode !== 'read' ? (
                    <div className="space-y-1">
                        <SectionTitle>Experience</SectionTitle>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 divide-y divide-slate-100">
                            <ToggleSwitch
                                label="Mechanical Keys"
                                icon={config.keySoundEnabled ? Volume2 : VolumeX}
                                checked={config.keySoundEnabled}
                                onChange={(checked) => setConfig({ ...config, keySoundEnabled: checked })}
                            />
                            <ToggleSwitch
                                label="Pronunciation"
                                icon={Volume2}
                                checked={config.pronunciationEnabled}
                                onChange={(checked) => setConfig({ ...config, pronunciationEnabled: checked })}
                            />
                            <ToggleSwitch
                                label="Random Order"
                                icon={Shuffle}
                                checked={config.randomEnabled}
                                onChange={(checked) => setConfig({ ...config, randomEnabled: checked })}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <SectionTitle>Experience</SectionTitle>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                            <ToggleSwitch
                                label="Random Order"
                                icon={Shuffle}
                                checked={config.randomEnabled}
                                onChange={(checked) => setConfig({ ...config, randomEnabled: checked })}
                            />
                        </div>
                    </div>
                )}

                {config.mode !== 'read' && (
                    <div className="space-y-1">
                        <SectionTitle>Drill Mode</SectionTitle>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Repeat size={16} className="text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600">Loop Word</span>
                                </div>
                                <span className="text-xs font-bold text-slate-500">{config.loopTimes}x</span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 5, 10].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setConfig({ ...config, loopTimes: num })}
                                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${config.loopTimes === num
                                            ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-200'
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                            }`}
                                    >
                                        {num}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Info */}
            <div className="px-6 pb-6 text-center">
                <p className="text-xs text-slate-400">
                    Pro Tip: Use <span className="font-mono bg-slate-200 text-slate-600 px-1 rounded">Tab</span> to skip words
                </p>
            </div>
        </div>
    );
};
