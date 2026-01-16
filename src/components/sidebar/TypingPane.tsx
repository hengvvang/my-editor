import React, { useState } from 'react';
import { Play, BookOpen, Volume2, VolumeX, Type, Repeat, Shuffle, Eye, EyeOff, Languages } from 'lucide-react';
import { dictionaries } from '../tools/QwertyLearner/config/dictionary';

interface TypingPaneProps {
    onStartPractice?: (dictId: string, chapter: number, config: any) => void;
}

export const TypingPane: React.FC<TypingPaneProps> = ({ onStartPractice }) => {
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
    });

    const currentDict = dictionaries.find(d => d.id === selectedDict) || dictionaries[0];
    const chaptersCount = Math.ceil(currentDict.length / 20);

    const handleStart = () => {
        onStartPractice?.(selectedDict, selectedChapter, config);
    };

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            {/* Quick Start Section */}
            <div className="p-4 border-b border-slate-200">
                <button
                    onClick={handleStart}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                >
                    <Play size={18} />
                    Start Practice
                </button>
            </div>

            {/* Dictionary Selection */}
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={16} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Dictionary</h3>
                </div>
                <select
                    value={selectedDict}
                    onChange={(e) => { setSelectedDict(e.target.value); setSelectedChapter(0); }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {dictionaries.map(dict => (
                        <option key={dict.id} value={dict.id}>
                            {dict.name} ({dict.length} words)
                        </option>
                    ))}
                </select>
                <div className="mt-3">
                    <label className="text-xs text-slate-500 mb-1 block">Chapter: {selectedChapter + 1} / {chaptersCount}</label>
                    <input
                        type="range"
                        min="0"
                        max={chaptersCount - 1}
                        value={selectedChapter}
                        onChange={(e) => setSelectedChapter(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Display Settings */}
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <Eye size={16} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Display</h3>
                </div>
                <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">Show Translation</span>
                        <input
                            type="checkbox"
                            checked={config.showTranslation}
                            onChange={(e) => setConfig({ ...config, showTranslation: e.target.checked })}
                            className="w-4 h-4 text-blue-500 rounded"
                        />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">Show Phonetic</span>
                        <input
                            type="checkbox"
                            checked={config.showPhonetic}
                            onChange={(e) => setConfig({ ...config, showPhonetic: e.target.checked })}
                            className="w-4 h-4 text-blue-500 rounded"
                        />
                    </label>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Font Size</label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={config.fontSize}
                            onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Sound Settings */}
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    {config.hintSoundEnabled ? <Volume2 size={16} className="text-slate-500" /> : <VolumeX size={16} className="text-slate-500" />}
                    <h3 className="text-sm font-semibold text-slate-700">Sound</h3>
                </div>
                <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">Key Sound</span>
                        <input
                            type="checkbox"
                            checked={config.keySoundEnabled}
                            onChange={(e) => setConfig({ ...config, keySoundEnabled: e.target.checked })}
                            className="w-4 h-4 text-blue-500 rounded"
                        />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">Hint Sound</span>
                        <input
                            type="checkbox"
                            checked={config.hintSoundEnabled}
                            onChange={(e) => setConfig({ ...config, hintSoundEnabled: e.target.checked })}
                            className="w-4 h-4 text-blue-500 rounded"
                        />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">Pronunciation</span>
                        <input
                            type="checkbox"
                            checked={config.pronunciationEnabled}
                            onChange={(e) => setConfig({ ...config, pronunciationEnabled: e.target.checked })}
                            className="w-4 h-4 text-blue-500 rounded"
                        />
                    </label>
                </div>
            </div>

            {/* Practice Settings */}
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <Repeat size={16} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Practice</h3>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Loop Times</label>
                        <select
                            value={config.loopTimes}
                            onChange={(e) => setConfig({ ...config, loopTimes: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={1}>1x</option>
                            <option value={2}>2x</option>
                            <option value={3}>3x</option>
                            <option value={4}>4x</option>
                            <option value={5}>5x</option>
                        </select>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2">
                            <Shuffle size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600 group-hover:text-slate-900">Random Order</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.randomEnabled}
                            onChange={(e) => setConfig({ ...config, randomEnabled: e.target.checked })}
                            className="w-4 h-4 text-blue-500 rounded"
                        />
                    </label>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4">
                <div className="text-xs text-slate-500 space-y-1">
                    <p>💡 <strong>Tip:</strong> Press Space to move to next word</p>
                    <p>⌨️ Use Tab to skip difficult words</p>
                    <p>📊 Your progress is automatically saved</p>
                </div>
            </div>
        </div>
    );
};
