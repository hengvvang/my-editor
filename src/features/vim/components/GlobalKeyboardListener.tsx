import { useEffect } from 'react';
import { useVimContext } from '../context/VimContext';

export const GlobalKeyboardListener = () => {
    const { handleKeyInput, mode } = useVimContext();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Passthrough for Shortcuts modifiers
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            // In INSERT mode, we only care about Escape.
            // All other keys should flow to the application (text input).
            if (mode === 'INSERT') {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleKeyInput(e.key);
                }
                return;
            }

            // In NORMAL or HINT mode, we intercept everything relevant.
            // We ignore modifier-only key presses (like just pressing "Shift")
            if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

            e.preventDefault();
            e.stopPropagation();

            handleKeyInput(e.key);
        };

        // Capture phase is important to stop other listeners
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [handleKeyInput, mode]);

    return null;
};
