import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { scanClickableElements, Hint } from '../utils/hintGenerator';

export type VimMode = 'INSERT' | 'NORMAL' | 'HINT';

interface VimContextType {
    mode: VimMode;
    setMode: (mode: VimMode) => void;
    hints: Hint[];
    inputBuffer: string;
    enterHintMode: () => void;
    exitHintMode: () => void;
    handleKeyInput: (key: string) => void;
}

const VimContext = createContext<VimContextType | null>(null);

export const VimProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<VimMode>('INSERT');
    const [hints, setHints] = useState<Hint[]>([]);
    const [inputBuffer, setInputBuffer] = useState("");
    const [commandBuffer, setCommandBuffer] = useState("");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const enterHintMode = useCallback(() => {
        requestAnimationFrame(() => {
            const newHints = scanClickableElements();
            if (newHints.length === 0) {
                return;
            }
            setHints(newHints);
            setMode('HINT');
            setInputBuffer("");
        });
    }, []);

    const exitHintMode = useCallback(() => {
        setMode('NORMAL');
        setHints([]);
        setInputBuffer("");
    }, []);

    const executeHint = useCallback((hint: Hint) => {
        const element = hint.element;
        // Click first
        element.click();

        // If it's an input, focus it and switch to INSERT
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable) {
            element.focus();
            setMode('INSERT');
        } else {
            // Otherwise return to NORMAL
            setMode('NORMAL');
        }
        setHints([]);
        setInputBuffer("");
    }, []);

    const performScroll = (dx: number, dy: number, behavior: ScrollBehavior = 'auto') => {
        // Heuristic: scroll active element if possible, else window
        const active = document.activeElement;
        if (active && active instanceof HTMLElement && (active.scrollHeight > active.clientHeight) && active !== document.body) {
            active.scrollBy({ left: dx, top: dy, behavior });
        } else {
            window.scrollBy({ left: dx, top: dy, behavior });
        }
    };

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    const handleKeyInput = useCallback((key: string) => {
        if (key === 'Escape') {
            if (mode === 'HINT') {
                exitHintMode();
            } else if (mode === 'INSERT') {
                setMode('NORMAL');
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            } else if (mode === 'NORMAL') {
                setCommandBuffer("");
                setInputBuffer("");
            }
            return;
        }

        if (mode === 'HINT') {
            const char = key.toLowerCase();
            const nextBuffer = inputBuffer + char;
            const exactMatch = hints.find(h => h.id === nextBuffer);
            const partialMatches = hints.filter(h => h.id.startsWith(nextBuffer));

            if (exactMatch) {
                const potentialLongerMatches = partialMatches.filter(h => h.id !== nextBuffer);
                if (potentialLongerMatches.length === 0) {
                    executeHint(exactMatch);
                } else {
                    setInputBuffer(nextBuffer);
                }
            } else if (partialMatches.length > 0) {
                setInputBuffer(nextBuffer);
            } else {
                setInputBuffer(""); // Reset on error
            }

        } else if (mode === 'NORMAL') {
            if (commandBuffer === "") {
                switch (key) {
                    case 'i': setMode('INSERT'); break;
                    case 'f': enterHintMode(); break;
                    case 'j': performScroll(0, 60); break;
                    case 'k': performScroll(0, -60); break;
                    case 'h': performScroll(-60, 0); break;
                    case 'l': performScroll(60, 0); break;
                    case 'd': performScroll(0, window.innerHeight / 2, 'smooth'); break;
                    case 'u': performScroll(0, -window.innerHeight / 2, 'smooth'); break;
                    case 'G': scrollToBottom(); break;
                    case 'g':
                        setCommandBuffer("g");
                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                        timeoutRef.current = setTimeout(() => setCommandBuffer(""), 1000);
                        break;
                }
            } else {
                if ((commandBuffer + key) === 'gg') {
                    scrollToTop();
                }
                setCommandBuffer("");
            }
        }
    }, [mode, hints, inputBuffer, commandBuffer, enterHintMode, exitHintMode, executeHint]);

    const value: VimContextType = {
        mode,
        setMode,
        hints,
        inputBuffer,
        enterHintMode,
        exitHintMode,
        handleKeyInput
    };

    return (
        <VimContext.Provider value={value}>
            {children}
        </VimContext.Provider>
    );
};

export const useVimContext = () => {
    const context = useContext(VimContext);
    if (!context) {
        throw new Error('useVimContext must be used within a VimProvider');
    }
    return context;
};
