import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TranslationSettings, TranslationResult, DEFAULT_TRANSLATION_SETTINGS } from '../types';
import { translate, translateDocument, detectLanguage } from '../services/translateService';

interface TranslateContextType {
    // Settings
    settings: TranslationSettings;
    updateSettings: (updates: Partial<TranslationSettings>) => void;

    // Translation state
    isTranslating: boolean;
    lastResult: TranslationResult | null;
    history: TranslationResult[];

    // Actions
    translateText: (text: string) => Promise<TranslationResult>;
    translateSelection: (text: string) => Promise<TranslationResult>;
    translateFullDocument: (text: string, bilingual?: boolean) => Promise<TranslationResult>;
    detectTextLanguage: (text: string) => Promise<string>;
    clearHistory: () => void;

    // Panel state
    isPanelOpen: boolean;
    setPanelOpen: (open: boolean) => void;
    selectedText: string;
    setSelectedText: (text: string) => void;
}

const TranslateContext = createContext<TranslateContextType | undefined>(undefined);

const STORAGE_KEY = 'typoly-translate-settings-v1';
const HISTORY_KEY = 'typoly-translate-history-v1';
const MAX_HISTORY = 50;

export const TranslateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load settings from localStorage
    const [settings, setSettings] = useState<TranslationSettings>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_TRANSLATION_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load translation settings', e);
        }
        return DEFAULT_TRANSLATION_SETTINGS;
    });

    // Load history from localStorage
    const [history, setHistory] = useState<TranslationResult[]>(() => {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load translation history', e);
        }
        return [];
    });

    const [isTranslating, setIsTranslating] = useState(false);
    const [lastResult, setLastResult] = useState<TranslationResult | null>(null);
    const [isPanelOpen, setPanelOpen] = useState(false);
    const [selectedText, setSelectedText] = useState('');

    // Listen for translate:selection events from editor
    useEffect(() => {
        const handleTranslateSelection = (event: Event) => {
            const customEvent = event as CustomEvent<{ text: string }>;
            const text = customEvent.detail?.text;
            if (text?.trim()) {
                setSelectedText(text);
                setPanelOpen(true);
                // Dispatch event to switch sidebar tab to translate
                window.dispatchEvent(new CustomEvent('sidebar:switch-tab', {
                    detail: { tab: 'translate' }
                }));
            }
        };

        window.addEventListener('translate:selection', handleTranslateSelection);
        return () => window.removeEventListener('translate:selection', handleTranslateSelection);
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save translation settings', e);
        }
    }, [settings]);

    // Save history to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
        } catch (e) {
            console.error('Failed to save translation history', e);
        }
    }, [history]);

    const updateSettings = useCallback((updates: Partial<TranslationSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);

    const addToHistory = useCallback((result: TranslationResult) => {
        if (result.success) {
            setHistory(prev => [result, ...prev.slice(0, MAX_HISTORY - 1)]);
        }
    }, []);

    const translateText = useCallback(async (text: string): Promise<TranslationResult> => {
        setIsTranslating(true);
        try {
            const result = await translate(
                text,
                settings.targetLanguage,
                settings.sourceLanguage,
                settings.defaultProvider
            );
            setLastResult(result);
            addToHistory(result);
            return result;
        } finally {
            setIsTranslating(false);
        }
    }, [settings, addToHistory]);

    const translateSelection = useCallback(async (text: string): Promise<TranslationResult> => {
        setSelectedText(text);
        setPanelOpen(true);
        return translateText(text);
    }, [translateText]);

    const translateFullDocument = useCallback(async (
        text: string,
        bilingual: boolean = settings.showBilingual
    ): Promise<TranslationResult> => {
        setIsTranslating(true);
        try {
            const result = await translateDocument(
                text,
                settings.targetLanguage,
                settings.sourceLanguage,
                settings.defaultProvider,
                bilingual
            );
            setLastResult(result);
            addToHistory(result);
            return result;
        } finally {
            setIsTranslating(false);
        }
    }, [settings, addToHistory]);

    const detectTextLanguage = useCallback(async (text: string): Promise<string> => {
        return detectLanguage(text);
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    return (
        <TranslateContext.Provider
            value={{
                settings,
                updateSettings,
                isTranslating,
                lastResult,
                history,
                translateText,
                translateSelection,
                translateFullDocument,
                detectTextLanguage,
                clearHistory,
                isPanelOpen,
                setPanelOpen,
                selectedText,
                setSelectedText,
            }}
        >
            {children}
        </TranslateContext.Provider>
    );
};

export function useTranslate() {
    const context = useContext(TranslateContext);
    if (!context) {
        throw new Error('useTranslate must be used within a TranslateProvider');
    }
    return context;
}
