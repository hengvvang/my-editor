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
        let textToTranslate = text || inputText;

        // If no text in input, try to get selection from editor
        if (!textToTranslate.trim() && onGetSelection) {
            const selection = onGetSelection();
            if (selection.trim()) {
                textToTranslate = selection;
                setInputText(selection); // Also update the input field
            }
        }

        if (!textToTranslate.trim()) return;
        await translateText(textToTranslate);
    };

    // Check if there's content to translate (input text or editor selection)
    const hasTranslatableContent = (): boolean => {
        if (inputText.trim()) return true;
        if (onGetSelection) {
            const selection = onGetSelection();
            if (selection.trim()) return true;
        }
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
            {/* Compact Header with integrated controls */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200/80 bg-white/60 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-sm">
                        <Languages size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 tracking-tight">Translate</span>
                </div>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${showHistory
                            ? 'bg-blue-500 text-white shadow-sm scale-105'
                            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                        title="Translation History"
                    >
                        <History size={13} />
                    </button>
                    <button
                        onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${showSettings
                            ? 'bg-blue-500 text-white shadow-sm scale-105'
                            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                        title="Settings"
                    >
                        <Settings size={13} />
                    </button>
                </div>
            </div>

            {/* Mode Tabs - More refined look */}
            <div className="flex px-2 pt-2 pb-1 gap-1 bg-white/40">
                {[
                    { id: 'selection', icon: MousePointer, label: 'Text', color: 'blue' },
                    { id: 'fullpage', icon: FileText, label: 'Page', color: 'blue' },
                    { id: 'bilingual', icon: Columns, label: 'Dual', color: 'indigo' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setMode(tab.id as TranslateMode)}
                        className={`flex-1 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 rounded-lg transition-all duration-200 ${mode === tab.id
                                ? `bg-${tab.color}-500 text-white shadow-sm`
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon size={11} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Language Selector - Compact and elegant */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100">
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
                    /* Selection Mode - Text Input */
                    <div className="flex-1 flex flex-col min-h-0 p-3 gap-2.5">
                        {/* Original Text */}
                        <div className="flex-1 flex flex-col min-h-[70px]">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Original</span>
                                </div>
                                {inputText && (
                                    <button
                                        onClick={() => { setInputText(''); setSelectedText(''); }}
                                        className="text-slate-300 hover:text-red-400 p-0.5 transition-colors"
                                        title="Clear"
                                    >
                                        <X size={11} />
                                    </button>
                                )}
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
                                placeholder="Enter text or select in editor..."
                                className="flex-1 w-full resize-none border border-slate-200 rounded-xl p-2.5 text-sm leading-relaxed bg-white/80 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                            />
                        </div>

                        {/* Translate Button - Enhanced */}
                        <button
                            onClick={() => handleTranslate()}
                            disabled={isTranslating || !hasTranslatableContent()}
                            className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${isTranslating || !hasTranslatableContent()
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                                }`}
                        >
                            {isTranslating ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Translating...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={14} />
                                    <span>{inputText.trim() ? 'Translate' : 'Translate Selection'}</span>
                                    <span className="text-[10px] opacity-70 font-normal ml-1">⌘↵</span>
                                </>
                            )}
                        </button>

                        {/* Translated Text */}
                        <div className="flex-1 flex flex-col min-h-[70px]">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Translation</span>
                                </div>
                                {lastResult?.translatedText && (
                                    <button
                                        onClick={handleCopy}
                                        className={`p-1 rounded-md transition-all duration-200 ${copied ? 'bg-green-50' : 'hover:bg-blue-50'}`}
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} className="text-slate-400 hover:text-blue-500" />}
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 w-full border border-slate-200 rounded-xl p-2.5 text-sm leading-relaxed bg-gradient-to-br from-blue-50/50 to-white overflow-auto">
                                {isTranslating ? (
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span className="text-xs">Translating...</span>
                                    </div>
                                ) : lastResult?.success ? (
                                    <span className="text-slate-700 whitespace-pre-wrap">{lastResult.translatedText}</span>
                                ) : lastResult?.error ? (
                                    <div className="flex items-center gap-2 text-red-500">
                                        <X size={12} />
                                        <span className="text-xs">{lastResult.error}</span>
                                    </div>
                                ) : (
                                    <span className="text-slate-300 italic text-xs">Translation will appear here...</span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : mode === 'fullpage' ? (
                    /* Full Page Mode - Translate entire document */
                    <div className="flex-1 flex flex-col min-h-0 p-3 gap-2.5">
                        {/* Info Banner */}
                        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100/80 rounded-xl">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                <FileText size={13} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-medium text-blue-800">Full Document Translation</span>
                                <div className="text-[10px] text-blue-600/70 mt-0.5">{charCount.toLocaleString()} characters • {wordCount.toLocaleString()} words</div>
                            </div>
                        </div>

                        {/* Translate Button */}
                        <button
                            onClick={handleTranslateFullPage}
                            disabled={isTranslating || !currentDocumentText.trim()}
                            className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${isTranslating || !currentDocumentText.trim()
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                                }`}
                        >
                            {isTranslating ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    <span>Translating Document...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={15} />
                                    <span>Translate Full Page</span>
                                </>
                            )}
                        </button>

                        {/* Translation Result */}
                        <div className="flex-1 flex flex-col min-h-[100px]">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Result</span>
                                </div>
                                {lastResult?.translatedText && mode === 'fullpage' && (
                                    <button
                                        onClick={handleCopy}
                                        className={`p-1 rounded-md transition-all duration-200 ${copied ? 'bg-green-50' : 'hover:bg-blue-50'}`}
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} className="text-slate-400 hover:text-blue-500" />}
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-gradient-to-br from-blue-50/30 to-white overflow-auto">
                                {isTranslating ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-blue-400">
                                        <Loader2 size={20} className="animate-spin" />
                                        <span className="text-xs font-medium">Translating document...</span>
                                    </div>
                                ) : lastResult?.success && mode === 'fullpage' ? (
                                    <span className="text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">{lastResult.translatedText}</span>
                                ) : lastResult?.error ? (
                                    <div className="flex items-center justify-center h-full gap-2 text-red-400">
                                        <X size={16} />
                                        <span className="text-xs">{lastResult.error}</span>
                                    </div>
                                ) : !currentDocumentText.trim() ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <FileText size={28} className="mb-2 opacity-50" />
                                        <span className="text-xs">No document content</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <Sparkles size={28} className="mb-2 opacity-50" />
                                        <span className="text-xs">Click button above to translate</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {lastResult?.translatedText && mode === 'fullpage' && (
                            <div className="flex gap-2">
                                {onReplaceDocument && (
                                    <button
                                        onClick={handleReplaceDocument}
                                        className="flex-1 py-2 text-[11px] font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
                                        title="Replace document content"
                                    >
                                        <Replace size={12} />
                                        Replace
                                    </button>
                                )}
                                {onInsertAtCursor && (
                                    <button
                                        onClick={handleInsertAtCursor}
                                        className="flex-1 py-2 text-[11px] font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
                                        title="Insert at cursor position"
                                    >
                                        <ClipboardPaste size={12} />
                                        Insert
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Bilingual Mode - Side by side translation */
                    <div className="flex-1 flex flex-col min-h-0 p-3 gap-2.5">
                        {/* Info Banner */}
                        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50/50 border border-indigo-100/80 rounded-xl">
                            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                <Columns size={13} className="text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-medium text-indigo-800">Bilingual Translation</span>
                                <div className="text-[10px] text-indigo-600/70 mt-0.5">Original + translated side by side</div>
                            </div>
                        </div>

                        {/* Translate Button */}
                        <button
                            onClick={handleTranslateBilingual}
                            disabled={isTranslating || !currentDocumentText.trim()}
                            className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${isTranslating || !currentDocumentText.trim()
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                                }`}
                        >
                            {isTranslating ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    <span>Creating Bilingual...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={15} />
                                    <span>Create Bilingual Version</span>
                                </>
                            )}
                        </button>

                        {/* Translation Result */}
                        <div className="flex-1 flex flex-col min-h-[100px]">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Result</span>
                                </div>
                                {lastResult?.translatedText && mode === 'bilingual' && (
                                    <button
                                        onClick={handleCopy}
                                        className={`p-1 rounded-md transition-all duration-200 ${copied ? 'bg-green-50' : 'hover:bg-indigo-50'}`}
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} className="text-slate-400 hover:text-indigo-500" />}
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-gradient-to-br from-indigo-50/30 to-white overflow-auto">
                                {isTranslating ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-indigo-400">
                                        <Loader2 size={20} className="animate-spin" />
                                        <span className="text-xs font-medium">Creating bilingual version...</span>
                                    </div>
                                ) : lastResult?.success && mode === 'bilingual' ? (
                                    <span className="text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">{lastResult.translatedText}</span>
                                ) : lastResult?.error ? (
                                    <div className="flex items-center justify-center h-full gap-2 text-red-400">
                                        <X size={16} />
                                        <span className="text-xs">{lastResult.error}</span>
                                    </div>
                                ) : !currentDocumentText.trim() ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <Columns size={28} className="mb-2 opacity-50" />
                                        <span className="text-xs">No document content</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <Sparkles size={28} className="mb-2 opacity-50" />
                                        <span className="text-xs">Click button above to create bilingual</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {lastResult?.translatedText && mode === 'bilingual' && (
                            <div className="flex gap-2">
                                {onReplaceDocument && (
                                    <button
                                        onClick={handleReplaceDocument}
                                        className="flex-1 py-2 text-[11px] font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
                                        title="Replace document content"
                                    >
                                        <Replace size={12} />
                                        Replace
                                    </button>
                                )}
                                {onInsertAtCursor && (
                                    <button
                                        onClick={handleInsertAtCursor}
                                        className="flex-1 py-2 text-[11px] font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
                                        title="Insert at cursor position"
                                    >
                                        <ClipboardPaste size={12} />
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
