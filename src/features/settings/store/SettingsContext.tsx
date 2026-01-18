import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types';

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (section: keyof AppSettings, updates: Partial<AppSettings[keyof AppSettings]>) => void;
    resetSettings: () => void;
    isSettingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'typoly-app-settings-v1';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                // Deep merge with defaults to ensure new fields are present
                const p = JSON.parse(stored);
                return {
                    general: { ...DEFAULT_SETTINGS.general, ...p.general },
                    editor: { ...DEFAULT_SETTINGS.editor, ...p.editor },
                    appearance: { ...DEFAULT_SETTINGS.appearance, ...p.appearance },
                    typing: { ...DEFAULT_SETTINGS.typing, ...p.typing },
                };
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
        return DEFAULT_SETTINGS;
    });

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    }, [settings]);

    const updateSettings = useCallback((section: keyof AppSettings, updates: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                ...updates
            }
        }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    // Apply global side effects (theme, font size body var)
    useEffect(() => {
        // Theme
        // Note: Tailwind dark mode strategy is likely 'class' or 'media'.
        // Assuming 'class' strategy for manual toggle.
        const root = window.document.documentElement;
        if (settings.appearance.theme === 'dark') {
            root.classList.add('dark');
        } else if (settings.appearance.theme === 'light') {
            root.classList.remove('dark');
        } else {
            // System
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [settings.appearance.theme]);

    return (
        <SettingsContext.Provider value={{
            settings,
            updateSettings,
            resetSettings,
            isSettingsOpen: isOpen,
            setSettingsOpen: setIsOpen
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
