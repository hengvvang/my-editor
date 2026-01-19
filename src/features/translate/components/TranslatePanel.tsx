import React, { useState, useRef, useEffect } from 'react';
import {
    Languages, ChevronDown, Copy, Check, FileText,
    Columns, ArrowRightLeft, Loader2, History, Trash2, X, Settings,
    MousePointer, Replace, ClipboardPaste
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

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Languages size={16} className="text-blue-500" />
                    <span className="text-xs font-semibold text-slate-600">Translate</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`p-1.5 rounded-md transition-colors ${showHistory ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
                        title="History"
                    >
                        <History size={14} />
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-1.5 rounded-md transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
                        title="Settings"
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setMode('selection')}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors border-b-2 ${mode === 'selection'
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <MousePointer size={11} />
                    <span>Selection</span>
                </button>
                <button
                    onClick={() => setMode('fullpage')}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors border-b-2 ${mode === 'fullpage'
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <FileText size={11} />
                    <span>Full Page</span>
                </button>
                <button
                    onClick={() => setMode('bilingual')}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors border-b-2 ${mode === 'bilingual'
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Columns size={11} />
                    <span>Bilingual</span>
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Provider</span>
                        <select
                            value={settings.defaultProvider}
                            onChange={(e) => updateSettings({ defaultProvider: e.target.value as TranslationProvider })}
                            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                        >
                            {ProviderOptions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200">
                {/* Source Language */}
                <div className="relative flex-1">
                    <button
                        onClick={() => setSourceLangOpen(!sourceLangOpen)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                        <span className="truncate">{sourceLang?.name || 'Auto'}</span>
                        <ChevronDown size={12} className={`transition-transform ${sourceLangOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {sourceLangOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        updateSettings({ sourceLanguage: lang.code });
                                        setSourceLangOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 ${settings.sourceLanguage === lang.code ? 'bg-blue-50 text-blue-600' : ''}`}
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Swap Button */}
                <button
                    onClick={handleSwapLanguages}
                    disabled={settings.sourceLanguage === 'auto'}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Swap Languages"
                >
                    <ArrowRightLeft size={14} />
                </button>

                {/* Target Language */}
                <div className="relative flex-1">
                    <button
                        onClick={() => setTargetLangOpen(!targetLangOpen)}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                        <span className="truncate">{targetLang?.name || 'Chinese'}</span>
                        <ChevronDown size={12} className={`transition-transform ${targetLangOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {targetLangOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
                            {SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        updateSettings({ targetLanguage: lang.code });
                                        setTargetLangOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 ${settings.targetLanguage === lang.code ? 'bg-blue-50 text-blue-600' : ''}`}
                                >
                                    {lang.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* History Panel */}
            {showHistory && (
                <div className="border-b border-slate-200 max-h-40 overflow-y-auto bg-slate-50">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100">
                        <span className="text-xs font-medium text-slate-500">Recent Translations</span>
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                            >
                                <Trash2 size={10} /> Clear
                            </button>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-slate-400 text-center">No history yet</div>
                    ) : (
                        history.slice(0, 10).map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelectHistoryItem(item)}
                                className="w-full text-left px-3 py-2 hover:bg-white border-b border-slate-100 last:border-0"
                            >
                                <div className="text-xs text-slate-600 truncate">{item.originalText}</div>
                                <div className="text-xs text-blue-500 truncate mt-0.5">{item.translatedText}</div>
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Main Content Area - Mode Specific */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {mode === 'selection' ? (
                    /* Selection Mode - Text Input */
                    <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
                        {/* Original Text */}
                        <div className="flex-1 flex flex-col min-h-[80px]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Original</span>
                                <button
                                    onClick={() => { setInputText(''); setSelectedText(''); }}
                                    className="text-slate-400 hover:text-slate-600 p-0.5"
                                    title="Clear"
                                >
                                    <X size={12} />
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
                                placeholder="Enter text or select in editor... (Ctrl+Enter)"
                                className="flex-1 w-full resize-none border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                            />
                        </div>

                        {/* Translate Button */}
                        <button
                            onClick={() => handleTranslate()}
                            disabled={isTranslating || !hasTranslatableContent()}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isTranslating ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Translating...
                                </>
                            ) : (
                                <>
                                    <Languages size={14} />
                                    {inputText.trim() ? 'Translate' : 'Translate Selection'}
                                </>
                            )}
                        </button>

                        {/* Translated Text */}
                        <div className="flex-1 flex flex-col min-h-[80px]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Translation</span>
                                {lastResult?.translatedText && (
                                    <button
                                        onClick={handleCopy}
                                        className="text-slate-400 hover:text-blue-500 p-0.5 flex items-center gap-1"
                                        title="Copy"
                                    >
                                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 overflow-auto">
                                {isTranslating ? (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Translating...</span>
                                    </div>
                                ) : lastResult?.success ? (
                                    <span className="text-slate-700 whitespace-pre-wrap">{lastResult.translatedText}</span>
                                ) : lastResult?.error ? (
                                    <span className="text-red-500 text-xs">{lastResult.error}</span>
                                ) : (
                                    <span className="text-slate-400 italic">Translation will appear here...</span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : mode === 'fullpage' ? (
                    /* Full Page Mode - Translate entire document */
                    <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
                        {/* Info Banner */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                            <FileText size={14} className="text-blue-500 shrink-0" />
                            <span className="text-xs text-blue-700">
                                Translates entire document content ({charCount} chars, {wordCount} words)
                            </span>
                        </div>

                        {/* Translate Button */}
                        <button
                            onClick={handleTranslateFullPage}
                            disabled={isTranslating || !currentDocumentText.trim()}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isTranslating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Translating...
                                </>
                            ) : (
                                <>
                                    <FileText size={16} />
                                    Translate Full Page
                                </>
                            )}
                        </button>

                        {/* Translation Result */}
                        <div className="flex-1 flex flex-col min-h-[100px]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Translation Result</span>
                                {lastResult?.translatedText && mode === 'fullpage' && (
                                    <button
                                        onClick={handleCopy}
                                        className="text-slate-400 hover:text-blue-500 p-1 rounded hover:bg-slate-100"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 overflow-auto">
                                {isTranslating ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                        <Loader2 size={20} className="animate-spin" />
                                        <span className="text-xs">Translating document...</span>
                                    </div>
                                ) : lastResult?.success && mode === 'fullpage' ? (
                                    <span className="text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">{lastResult.translatedText}</span>
                                ) : lastResult?.error ? (
                                    <span className="text-red-500 text-xs">{lastResult.error}</span>
                                ) : !currentDocumentText.trim() ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <FileText size={24} className="mb-2 opacity-30" />
                                        <span className="text-xs italic">No document content</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <FileText size={24} className="mb-2 opacity-30" />
                                        <span className="text-xs italic">Click button above to translate</span>
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
                                        className="flex-1 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                        title="Replace document content"
                                    >
                                        <Replace size={12} />
                                        Replace Document
                                    </button>
                                )}
                                {onInsertAtCursor && (
                                    <button
                                        onClick={handleInsertAtCursor}
                                        className="flex-1 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                        title="Insert at cursor position"
                                    >
                                        <ClipboardPaste size={12} />
                                        Insert at Cursor
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Bilingual Mode - Side by side translation */
                    <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
                        {/* Info Banner */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <Columns size={14} className="text-indigo-500 shrink-0" />
                            <span className="text-xs text-indigo-700">
                                Creates bilingual version with original + translation ({charCount} chars)
                            </span>
                        </div>

                        {/* Translate Button */}
                        <button
                            onClick={handleTranslateBilingual}
                            disabled={isTranslating || !currentDocumentText.trim()}
                            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isTranslating ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Creating bilingual...
                                </>
                            ) : (
                                <>
                                    <Columns size={16} />
                                    Create Bilingual Version
                                </>
                            )}
                        </button>

                        {/* Translation Result */}
                        <div className="flex-1 flex flex-col min-h-[100px]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Bilingual Result</span>
                                {lastResult?.translatedText && mode === 'bilingual' && (
                                    <button
                                        onClick={handleCopy}
                                        className="text-slate-400 hover:text-indigo-500 p-1 rounded hover:bg-slate-100"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 overflow-auto">
                                {isTranslating ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                        <Loader2 size={20} className="animate-spin" />
                                        <span className="text-xs">Creating bilingual version...</span>
                                    </div>
                                ) : lastResult?.success && mode === 'bilingual' ? (
                                    <span className="text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">{lastResult.translatedText}</span>
                                ) : lastResult?.error ? (
                                    <span className="text-red-500 text-xs">{lastResult.error}</span>
                                ) : !currentDocumentText.trim() ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Columns size={24} className="mb-2 opacity-30" />
                                        <span className="text-xs italic">No document content</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Columns size={24} className="mb-2 opacity-30" />
                                        <span className="text-xs italic">Click button above to create bilingual</span>
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
                                        className="flex-1 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                        title="Replace document content"
                                    >
                                        <Replace size={12} />
                                        Replace Document
                                    </button>
                                )}
                                {onInsertAtCursor && (
                                    <button
                                        onClick={handleInsertAtCursor}
                                        className="flex-1 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                        title="Insert at cursor position"
                                    >
                                        <ClipboardPaste size={12} />
                                        Insert at Cursor
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
