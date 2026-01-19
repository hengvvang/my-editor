import React from 'react';
import { useVimContext } from '../context/VimContext';

export const VimOverlay: React.FC = () => {
    const { mode, hints, inputBuffer } = useVimContext();

    if (mode !== 'HINT' || hints.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
            {hints.map(hint => {
                // Visibility filter based on input buffer
                if (inputBuffer && !hint.id.startsWith(inputBuffer)) {
                    return null;
                }

                return (
                    <div
                        key={hint.id}
                        className="absolute z-[10001] group flex items-center justify-center min-w-[22px] h-[22px] px-1.5
                        bg-slate-900/95 backdrop-blur-sm
                        border border-white/20 ring-1 ring-black/5
                        shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)]
                        rounded-md
                        cursor-pointer animate-in zoom-in-75 duration-150 ease-out"
                        style={{
                            top: hint.rect.top,
                            left: hint.rect.left,
                            transform: 'translate(-20%, -20%)', // Slightly center over target
                        }}
                    >
                        <div className="flex items-center justify-center font-mono text-[12px] leading-none select-none">
                            {/* Dimmed already typed chars */}
                            {inputBuffer && (
                                <span className="text-slate-500 font-medium mr-[1px]">{inputBuffer}</span>
                            )}
                            {/* Remaining chars */}
                            <span className="text-white font-bold bg-gradient-to-b from-white to-slate-200 bg-clip-text text-transparent filter drop-shadow-sm">
                                {hint.id.slice(inputBuffer.length)}
                            </span>
                        </div>

                        {/* Decorative glow effect */}
                        <div className="absolute inset-0 rounded-md ring-1 ring-white/10 group-hover:ring-white/30 transition-all" />
                    </div>
                );
            })}

            {/* Dim Backdrop (Optional) */}
            {/* <div className="absolute inset-0 bg-black/5 -z-10" /> */}
        </div>
    );
};
