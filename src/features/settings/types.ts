export interface AppSettings {
    general: {
        language: 'en' | 'zh-cn';
        autoSave: boolean;
        autoSaveDelay: number; // ms
    };
    editor: {
        fontSize: number;
        lineNumbers: boolean;
        showMinimap: boolean;
        wordWrap: boolean;
        fontFamily: string;
        tabSize: number;
        relativeLineNumbers: boolean;
    };
    appearance: {
        theme: 'light' | 'dark' | 'system';
        sidebarCompactMode: boolean;
    };
    typing: {
        targetWpm: number;
        soundEnabled: boolean;
        soundVolume: number;
    };
}

export const DEFAULT_SETTINGS: AppSettings = {
    general: {
        language: 'en',
        autoSave: true,
        autoSaveDelay: 1000,
    },
    editor: {
        fontSize: 14,
        lineNumbers: true,
        showMinimap: true,
        wordWrap: false,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        tabSize: 4,
        relativeLineNumbers: false
    },
    appearance: {
        theme: 'light',
        sidebarCompactMode: false
    },
    typing: {
        targetWpm: 60,
        soundEnabled: true,
        soundVolume: 0.5
    }
};
