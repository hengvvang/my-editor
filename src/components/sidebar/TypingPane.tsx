import React, { useState } from 'react';
import { Play, Settings, BookOpen, Volume2, VolumeX } from 'lucide-react';

interface TypingPaneProps {
    onStartPractice?: () => void;
}

export const TypingPane: React.FC<TypingPaneProps> = ({ onStartPractice }) => {
    const [selectedDict, setSelectedDict] = useState('programmer');
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [showTranslation, setShowTranslation] = useState(true);

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            {/* Quick Start Section */}
            <div className="p-4 border-b border-slate-200">
                <button
                    onClick={onStartPractice}
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
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="dict"
                            value="programmer"
                            checked={selectedDict === 'programmer'}
                            onChange={(e) => setSelectedDict(e.target.value)}
                            className="w-4 h-4 text-blue-500"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">Programmer (50 words)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="dict"
                            value="basic"
                            checked={selectedDict === 'basic'}
                            onChange={(e) => setSelectedDict(e.target.value)}
                            className="w-4 h-4 text-blue-500"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">Basic (30 words)</span>
                    </label>
                </div>
            </div>

            {/* Settings Section */}
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <Settings size={16} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Settings</h3>
                </div>
                <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-slate-600 group-hover:text-slate-900">Show Translation</span>
                        <input
                            type="checkbox"
                            checked={showTranslation}
                            onChange={(e) => setShowTranslation(e.target.checked)}
                            className="w-4 h-4 text-blue-500 rounded"
                        />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2">
                            {soundEnabled ? <Volume2 size={14} className="text-slate-400" /> : <VolumeX size={14} className="text-slate-400" />}
                            <span className="text-sm text-slate-600 group-hover:text-slate-900">Sound Effects</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={soundEnabled}
                            onChange={(e) => setSoundEnabled(e.target.checked)}
                            className="w-4 h-4 text-blue-500 rounded"
                        />
                    </label>
                </div>
            </div>

            {/* Stats / Info Section */}
            <div className="p-4">
                <div className="text-xs text-slate-500 space-y-1">
                    <p>💡 <strong>Tip:</strong> Press Space or type exactly to move to next word</p>
                    <p>⌨️ Practice regularly to improve your typing speed</p>
                </div>
            </div>
        </div>
    );
};
