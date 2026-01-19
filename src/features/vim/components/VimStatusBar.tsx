import React from 'react';
import { useVimContext } from '../context/VimContext';

export const VimStatusBar: React.FC = () => {
    const { mode, inputBuffer } = useVimContext();

    const getModeStyle = () => {
        switch (mode) {
            case 'NORMAL': return 'bg-slate-800 text-white border-slate-700';
            case 'INSERT': return 'bg-blue-600 text-white border-blue-500';
            case 'HINT': return 'bg-yellow-500 text-black border-yellow-600';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 z-[10001] px-3 py-1 rounded shadow-lg font-mono text-xs font-bold border ${getModeStyle()} transition-colors duration-200 flex items-center gap-2 pointer-events-none`}>
            <span>{mode}</span>
            {mode === 'HINT' && inputBuffer && (
                <span className="bg-white/30 px-1 rounded">{inputBuffer}</span>
            )}
        </div>
    );
};
