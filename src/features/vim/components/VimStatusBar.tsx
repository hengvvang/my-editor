import React from 'react';
import { useVimContext } from '../context/VimContext';

export const VimStatusBar: React.FC = () => {
    const { mode, inputBuffer, hints } = useVimContext();

    const getModeStyle = () => {
        switch (mode) {
            case 'NORMAL': return 'bg-white/90 backdrop-blur-sm text-slate-900 border-slate-200 shadow-xl';
            case 'INSERT': return 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20';
            case 'HINT': return 'bg-slate-900/95 backdrop-blur-sm text-white border-white/20 shadow-xl';
            default: return 'bg-gray-500 text-white';
        }
    };

    const showEnterHint = mode === 'HINT' && inputBuffer && hints.some(h => h.id === inputBuffer) && hints.some(h => h.id !== inputBuffer && h.id.startsWith(inputBuffer));

    return (
        <div className={`fixed bottom-4 right-4 z-[10001] flex flex-col items-end gap-2 pointer-events-none`}>
            {showEnterHint && (
                <div className="px-3 py-1.5 rounded-md bg-slate-900/90 text-white text-xs font-medium shadow-xl backdrop-blur-sm border border-white/10 animate-in slide-in-from-right-2 fade-in duration-200">
                    Press <kbd className="font-sans px-1.5 py-0.5 bg-white/20 rounded text-[10px] mx-1">Enter</kbd> to select match
                </div>
            )}
            <div className={`px-3 py-1 rounded shadow-lg font-mono text-xs font-bold border ${getModeStyle()} transition-all duration-300 flex items-center gap-2`}>
                <span>{mode}</span>
                {mode === 'HINT' && inputBuffer && (
                    <span className="bg-white/20 px-1 rounded text-white/90">{inputBuffer}</span>
                )}
            </div>
        </div>
    );
};
