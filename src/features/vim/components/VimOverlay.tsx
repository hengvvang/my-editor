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
                        className="absolute bg-yellow-300 border border-yellow-600 text-black font-bold text-[10px] px-1 shadow-sm rounded-sm uppercase flex items-center justify-center pointer-events-auto transition-opacity"
                        style={{
                            top: hint.rect.top,
                            left: hint.rect.left,
                            // Adjust position to not cover the exact top-left corner content if possible,
                            // usually slightly offset out or just overlay.
                            // Sticking to overlay top-left for standard Vimium feel using translate.
                            transform: 'translate(0, 0)',
                            zIndex: 10001
                        }}
                    >
                        <span className="text-gray-400 font-mono">{inputBuffer}</span>
                        <span className="font-mono">{hint.id.slice(inputBuffer.length)}</span>
                    </div>
                );
            })}

            {/* Dim Backdrop (Optional) */}
            {/* <div className="absolute inset-0 bg-black/5 -z-10" /> */}
        </div>
    );
};
