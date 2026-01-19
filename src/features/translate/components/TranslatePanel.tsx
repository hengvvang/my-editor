import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Languages, ChevronDown, Copy, Check, FileText,
    Columns, ArrowRightLeft, Loader2, History, Trash2, X, Settings,
    MousePointer, Replace, ClipboardPaste, Sparkles
} from 'lucide-react';
import { useTranslate } from '../store/TranslateContext';
import { SUPPORTED_LANGUAGES, TranslationProvider } from '../types';

type TranslateMode = 'selection' | 'fullpage' | 'bilingual';

interface TranslatePanelProps {
    onTranslateDocument?: () => void;
    onTranslateBilingual?: () => void;
    onReplaceDocument?: (text: string) => void;
    onInsertAtCursor?: (text: string) => void;
    onGetSelection?: () => string;
    currentDocumentText?: string;
    compact?: boolean;
}

export const TranslatePanel: React.FC<TranslatePanelProps> = ({
    onTranslateDocument,
    onTranslateBilingual,
    onReplaceDocument,
    onInsertAtCursor,
    onGetSelection,
    currentDocumentText = '',
    compact = false
}) => {
    const {
        settings,
        updateSettings,
        isTranslating,
        lastResult,
        history,
        translateText,
        translateFullDocument,
        clearHistory,
        selectedText,
        setSelectedText
    } = useTranslate();

    const [mode, setMode] = useState<TranslateMode>('selection');
    const [inputText, setInputText] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sourceLangOpen, setSourceLangOpen] = useState(false);
    const [targetLangOpen, setTargetLangOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Sync with selectedText from context
    useEffect(() => {
        if (selectedText) {
            setInputText(selectedText);
            setMode('selection'); // Auto switch to selection mode
            handleTranslate(selectedText);
        }
    }, [selectedText]);

    const handleTranslate = async (text?: string) => {
        let textToTranslate = text;

        // Priority: 1. Passed text parameter, 2. Editor selection, 3. Input text
        if (!textToTranslate?.trim()) {
            // Check editor selection first (higher priority)
            if (onGetSelection) {
                const selection = onGetSelection();
                if (selection.trim()) {
                    textToTranslate = selection;
                    setInputText(selection); // Sync to input field
                }
            }
            // Fall back to input text if no editor selection
            if (!textToTranslate?.trim() && inputText.trim()) {
                textToTranslate = inputText;
            }
        }

        if (!textToTranslate?.trim()) return;
        await translateText(textToTranslate);
    };

    // Check if there's content to translate (editor selection has priority)
    const hasTranslatableContent = (): boolean => {
        if (onGetSelection) {
            const selection = onGetSelection();
            if (selection.trim()) return true;
        }
        if (inputText.trim()) return true;
        return false;
    };

    const handleTranslateFullPage = async () => {
        if (!currentDocumentText.trim()) return;
        await translateFullDocument(currentDocumentText, false);
        onTranslateDocument?.();
    };

    const handleTranslateBilingual = async () => {
        if (!currentDocumentText.trim()) return;
        await translateFullDocument(currentDocumentText, true);
        onTranslateBilingual?.();
    };

    const handleCopy = async () => {
        if (lastResult?.translatedText) {
            await navigator.clipboard.writeText(lastResult.translatedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSwapLanguages = () => {
        if (settings.sourceLanguage !== 'auto') {
            updateSettings({
                sourceLanguage: settings.targetLanguage,
                targetLanguage: settings.sourceLanguage
            });
        }
    };

    const handleSelectHistoryItem = (item: typeof history[0]) => {
        setInputText(item.originalText);
        setShowHistory(false);
        setMode('selection');
    };

    const handleReplaceDocument = () => {
        if (lastResult?.translatedText && onReplaceDocument) {
            onReplaceDocument(lastResult.translatedText);
        }
    };

    const handleInsertAtCursor = () => {
        if (lastResult?.translatedText && onInsertAtCursor) {
            onInsertAtCursor(lastResult.translatedText);
        }
    };

    const sourceLang = SUPPORTED_LANGUAGES.find(l => l.code === settings.sourceLanguage);
    const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === settings.targetLanguage);

    const ProviderOptions: { id: TranslationProvider; name: string }[] = [
        { id: 'google', name: 'Google' },
        { id: 'bing', name: 'Bing' },
    ];

    const wordCount = currentDocumentText.trim().split(/\s+/).filter(Boolean).length;
    const charCount = currentDocumentText.length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-dropdown="source"]')) setSourceLangOpen(false);
            if (!target.closest('[data-dropdown="target"]')) setTargetLangOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Quick language presets
    const quickLangs = useMemo(() => [
        { code: 'en', name: 'EN' },
        { code: 'zh', name: '中' },
        { code: 'ja', name: '日' },
        { code: 'ko', name: '韩' },
    ], []);

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50/80 to-white">
            {/* Compact Header: Logo + Mode Tabs + Actions in one row */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-slate-200/80 bg-white/60 backdrop-blur-sm">
                {/* Logo with Title */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="px-1.5 py-1 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                        <Languages size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Translate</span>
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-slate-200" />

                {/* Mode Tabs - Wider pill buttons */}
                <div className="flex gap-0.5 bg-slate-100/80 rounded-lg p-0.5">
                    {[
                        { id: 'selection', icon: MousePointer, label: 'Text' },
                        { id: 'fullpage', icon: FileText, label: 'Page' },
                        { id: 'bilingual', icon: Columns, label: 'Dual' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMode(tab.id as TranslateMode)}
                            className={`px-3.5 py-1 flex items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-all duration-150 ${mode === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon size={12} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Divider */}
                <div className="w-px h-5 bg-slate-200" />

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }}
                        className={`px-2 py-1.5 flex items-center justify-center rounded-lg transition-all duration-150 ${showHistory
                            ? 'bg-blue-500 text-white'
                            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                        title="History"
                    >
                        <History size={13} />
                    </button>
                    <button
                        onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }}
                        className={`px-2 py-1.5 flex items-center justify-center rounded-lg transition-all duration-150 ${showSettings
                            ? 'bg-blue-500 text-white'
                            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                        title="Settings"
                    >
                        <Settings size={12} />
                    </button>
                </div>
            </div>

            {/* Language Selector - Compact and elegant */}
            <div className="flex items-center gap-1.5 px-3 py-1 border-b border-slate-100">
                {/* Source Language */}
                <div className="relative flex-1" data-dropdown="source">
                    <button
                        onClick={(e) => { e.stopPropagation(); setSourceLangOpen(!sourceLangOpen); setTargetLangOpen(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200 ${sourceLangOpen
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'bg-slate-100/80 hover:bg-slate-200/80 border border-transparent'
                            }`}
                    >
                        <span className="truncate font-medium">{sourceLang?.name || 'Auto Detect'}</span>
                        <ChevronDown size={11} className={`ml-1 transition-transform duration-200 ${sourceLangOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {sourceLangOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-2 py-1.5 border-b border-slate-100">
                                <div className="flex gap-1">
                                    {[{ code: 'auto', name: 'Auto' }, ...quickLangs].map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { updateSettings({ sourceLanguage: lang.code }); setSourceLangOpen(false); }}
                                            className={`flex-1 px-1.5 py-1 text-[10px] font-medium rounded-md transition-colors ${settings.sourceLanguage === lang.code
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                }`}
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="py-1">
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { updateSettings({ sourceLanguage: lang.code }); setSourceLangOpen(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${settings.sourceLanguage === lang.code
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'hover:bg-slate-50 text-slate-600'
                                            }`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Swap Button - Animated */}
                <button
                    onClick={handleSwapLanguages}
                    disabled={settings.sourceLanguage === 'auto'}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Swap Languages"
                >
                    <ArrowRightLeft size={13} />
                </button>

                {/* Target Language */}
                <div className="relative flex-1" data-dropdown="target">
                    <button
                        onClick={(e) => { e.stopPropagation(); setTargetLangOpen(!targetLangOpen); setSourceLangOpen(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200 ${targetLangOpen
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'bg-slate-100/80 hover:bg-slate-200/80 border border-transparent'
                            }`}
                    >
                        <span className="truncate font-medium">{targetLang?.name || 'Chinese'}</span>
                        <ChevronDown size={11} className={`ml-1 transition-transform duration-200 ${targetLangOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {targetLangOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-2 py-1.5 border-b border-slate-100">
                                <div className="flex gap-1">
                                    {quickLangs.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { updateSettings({ targetLanguage: lang.code }); setTargetLangOpen(false); }}
                                            className={`flex-1 px-1.5 py-1 text-[10px] font-medium rounded-md transition-colors ${settings.targetLanguage === lang.code
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                }`}
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="py-1">
                                {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { updateSettings({ targetLanguage: lang.code }); setTargetLangOpen(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${settings.targetLanguage === lang.code
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'hover:bg-slate-50 text-slate-600'
                                            }`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Panel - Refined */}
            {showSettings && (
                <div className="px-3 py-2.5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">Translation Provider</span>
                        <div className="flex gap-1">
                            {ProviderOptions.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => updateSettings({ defaultProvider: p.id })}
                                    className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all duration-200 ${settings.defaultProvider === p.id
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                                        }`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* History Panel - Enhanced */}
            {showHistory && (
                <div className="border-b border-slate-200 max-h-48 overflow-y-auto bg-white animate-in slide-in-from-top-2 duration-200">
                    <div className="sticky top-0 flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
                        <span className="text-xs font-semibold text-slate-600">Recent Translations</span>
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="text-[10px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={10} /> Clear All
                            </button>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <div className="px-3 py-6 text-xs text-slate-400 text-center">
                            <History size={20} className="mx-auto mb-2 opacity-30" />
                            <p>No translation history yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {history.slice(0, 10).map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectHistoryItem(item)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50/50 transition-colors group"
                                >
                                    <div className="text-xs text-slate-600 truncate group-hover:text-slate-800">{item.originalText}</div>
                                    <div className="text-xs text-blue-500 truncate mt-0.5 font-medium">{item.translatedText}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Area - Mode Specific */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {mode === 'selection' ? (
                    /* Selection Mode - Compact input, large result */
                    <div className="flex-1 flex flex-col min-h-0 p-3 gap-2">
                        {/* Compact Input Area */}
                        <div className="shrink-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center gap-1 flex-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Input</span>
                                </div>
                                {inputText && (
                                    <button
                                        onClick={() => { setInputText(''); setSelectedText(''); }}
                                        className="text-slate-300 hover:text-red-400 p-0.5 transition-colors"
                                        title="Clear"
                                    >
                                        <X size={10} />
                                    </button>
                                )}
                                {/* Inline Translate Button */}
                                <button
                                    onClick={() => handleTranslate()}
                                    disabled={isTranslating || !hasTranslatableContent()}
                                    className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${isTranslating || !hasTranslatableContent()
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm'
                                        }`}
                                >
                                    {isTranslating ? (
                                        <Loader2 size={10} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={10} />
                                    )}
                                    <span>{isTranslating ? 'Translating' : 'Translate'}</span>
                                </button>
                            </div>
                            <textarea
                                ref={inputRef}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        handleTranslate();
                                    }
                                }}
                                placeholder="Enter text or select in editor... (⌘↵)"
                                rows={6}
                                className="w-full resize-none border border-slate-200 rounded-xl px-3 py-3 text-sm leading-relaxed bg-white/80 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                            />
                        </div>

                        {/* Translation Result - Takes remaining space */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-1 shrink-0">
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Translation</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {lastResult?.translatedText && (
                                        <>
                                            <button
                                                onClick={handleCopy}
                                                className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-[10px] ${copied
                                                    ? 'bg-green-50 text-green-600'
                                                    : 'hover:bg-blue-50 text-slate-400 hover:text-blue-500'
                                                    }`}
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check size={11} /> : <Copy size={11} />}
                                                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 w-full border-2 border-blue-100 rounded-2xl p-3 text-sm leading-relaxed bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/30 overflow-auto shadow-inner">
                                {isTranslating ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-400">
                                        <div className="relative">
                                            <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                                            <Sparkles size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                                        </div>
                                        <span className="text-xs font-medium">Translating...</span>
                                    </div>
                                ) : lastResult?.success ? (
                                    <div className="h-full">
                                        <p className="text-slate-800 whitespace-pre-wrap text-[13px] leading-[1.8] font-normal">{lastResult.translatedText}</p>
                                    </div>
                                ) : lastResult?.error ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400">
                                        <X size={20} />
                                        <span className="text-xs text-center">{lastResult.error}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <Languages size={32} className="mb-3 opacity-40" />
                                        <span className="text-xs">Translation will appear here</span>
                                        <span className="text-[10px] mt-1 opacity-60">Enter text above or select in editor</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : mode === 'fullpage' ? (
                    /* Full Page Mode - Same layout as Dual */
                    <div className="flex-1 flex flex-col min-h-0 p-3 gap-2">
                        {/* Compact Info + Button Row */}
                        <div className="shrink-0 flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100/80 rounded-xl">
                                <FileText size={14} className="text-blue-600 shrink-0" />
                                <span className="text-[10px] text-blue-700 font-medium">{charCount.toLocaleString()} chars • {wordCount.toLocaleString()} words</span>
                            </div>
                            <button
                                onClick={handleTranslateFullPage}
                                disabled={isTranslating || !currentDocumentText.trim()}
                                className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${isTranslating || !currentDocumentText.trim()
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm'
                                    }`}
                            >
                                {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                            </button>
                        </div>

                        {/* Translation Result - Maximum space */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-1.5 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Full Page Translation</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {lastResult?.translatedText && mode === 'fullpage' && (
                                        <button
                                            onClick={handleCopy}
                                            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-[10px] ${copied
                                                ? 'bg-green-50 text-green-600'
                                                : 'hover:bg-blue-50 text-slate-400 hover:text-blue-500'
                                                }`}
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <Check size={11} /> : <Copy size={11} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 w-full border-2 border-blue-100 rounded-2xl p-3 text-sm bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/30 overflow-auto shadow-inner">
                                {isTranslating ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-400">
                                        <div className="relative">
                                            <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                                            <Sparkles size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                                        </div>
                                        <span className="text-xs font-medium">Translating document...</span>
                                    </div>
                                ) : lastResult?.success && mode === 'fullpage' ? (
                                    <p className="text-slate-800 whitespace-pre-wrap text-[13px] leading-[1.8] font-normal">{lastResult.translatedText}</p>
                                ) : lastResult?.error ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400">
                                        <X size={20} />
                                        <span className="text-xs text-center">{lastResult.error}</span>
                                    </div>
                                ) : !currentDocumentText.trim() ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <FileText size={32} className="mb-3 opacity-40" />
                                        <span className="text-xs">No document content</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <Languages size={32} className="mb-3 opacity-40" />
                                        <span className="text-xs">Click Translate to start</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons - Compact */}
                        {lastResult?.translatedText && mode === 'fullpage' && (
                            <div className="shrink-0 flex gap-2">
                                {onReplaceDocument && (
                                    <button
                                        onClick={handleReplaceDocument}
                                        className="flex-1 py-1.5 text-[10px] font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
                                    >
                                        <Replace size={10} />
                                        Replace
                                    </button>
                                )}
                                {onInsertAtCursor && (
                                    <button
                                        onClick={handleInsertAtCursor}
                                        className="flex-1 py-1.5 text-[10px] font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
                                    >
                                        <ClipboardPaste size={10} />
                                        Insert
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Bilingual Mode - Side by side translation */
                    <div className="flex-1 flex flex-col min-h-0 p-3 gap-2">
                        {/* Compact Info + Button Row */}
                        <div className="shrink-0 flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50/50 border border-indigo-100/80 rounded-xl">
                                <Columns size={14} className="text-indigo-600 shrink-0" />
                                <span className="text-[10px] text-indigo-700 font-medium">Original + Translation</span>
                            </div>
                            <button
                                onClick={handleTranslateBilingual}
                                disabled={isTranslating || !currentDocumentText.trim()}
                                className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${isTranslating || !currentDocumentText.trim()
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-sm'
                                    }`}
                            >
                                {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                <span>{isTranslating ? 'Creating...' : 'Create'}</span>
                            </button>
                        </div>

                        {/* Translation Result - Maximum space */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-1.5 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Bilingual Result</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {lastResult?.translatedText && mode === 'bilingual' && (
                                        <button
                                            onClick={handleCopy}
                                            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-[10px] ${copied
                                                ? 'bg-green-50 text-green-600'
                                                : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-500'
                                                }`}
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <Check size={11} /> : <Copy size={11} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 w-full border-2 border-indigo-100 rounded-2xl p-3 text-sm bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/30 overflow-auto shadow-inner">
                                {isTranslating ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3 text-indigo-400">
                                        <div className="relative">
                                            <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                                            <Sparkles size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" />
                                        </div>
                                        <span className="text-xs font-medium">Creating bilingual version...</span>
                                    </div>
                                ) : lastResult?.success && mode === 'bilingual' ? (
                                    <p className="text-slate-800 whitespace-pre-wrap text-[13px] leading-[1.8] font-normal">{lastResult.translatedText}</p>
                                ) : lastResult?.error ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400">
                                        <X size={20} />
                                        <span className="text-xs text-center">{lastResult.error}</span>
                                    </div>
                                ) : !currentDocumentText.trim() ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <Columns size={32} className="mb-3 opacity-40" />
                                        <span className="text-xs">No document content</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <Languages size={32} className="mb-3 opacity-40" />
                                        <span className="text-xs">Click Create to start</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons - Compact */}
                        {lastResult?.translatedText && mode === 'bilingual' && (
                            <div className="shrink-0 flex gap-2">
                                {onReplaceDocument && (
                                    <button
                                        onClick={handleReplaceDocument}
                                        className="flex-1 py-1.5 text-[10px] font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
                                    >
                                        <Replace size={10} />
                                        Replace
                                    </button>
                                )}
                                {onInsertAtCursor && (
                                    <button
                                        onClick={handleInsertAtCursor}
                                        className="flex-1 py-1.5 text-[10px] font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
                                    >
                                        <ClipboardPaste size={10} />
                                        Insert
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranslatePanel;
