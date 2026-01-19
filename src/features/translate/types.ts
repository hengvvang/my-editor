// Translation Module Types

export type TranslationProvider = 'google' | 'bing' | 'deepl' | 'openai' | 'custom';

export type TranslationMode = 'selection' | 'document' | 'bilingual';

export interface TranslationResult {
    success: boolean;
    originalText: string;
    translatedText: string;
    sourceLanguage?: string;
    targetLanguage: string;
    provider: TranslationProvider;
    timestamp: number;
    error?: string;
}

export interface LanguageOption {
    code: string;
    name: string;
    nativeName: string;
}

export interface TranslationSettings {
    defaultProvider: TranslationProvider;
    sourceLanguage: string; // 'auto' for auto-detect
    targetLanguage: string;
    showBilingual: boolean;
    autoTranslateSelection: boolean;
    apiKeys: {
        openai?: string;
        deepl?: string;
        custom?: string;
    };
    customApiUrl?: string;
}

export const DEFAULT_TRANSLATION_SETTINGS: TranslationSettings = {
    defaultProvider: 'google',
    sourceLanguage: 'auto',
    targetLanguage: 'zh-CN',
    showBilingual: true,
    autoTranslateSelection: false,
    apiKeys: {},
};

// Common languages supported by most translation services
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: 'auto', name: 'Auto Detect', nativeName: '自动检测' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
];
