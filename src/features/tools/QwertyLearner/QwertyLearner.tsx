import { useEffect, useState } from 'react';
import { useTyping } from './hooks/useTyping';
import { RotateCcw, Trophy, Target, Zap, SkipForward, Loader2, Volume2, Eye, EyeOff, Languages } from 'lucide-react';
import type { Word } from './types';
import { defaultTypingConfig, WORDS_PER_CHAPTER } from './config/typing';
import { idDictionaryMap } from './config/dictionary';

interface QwertyLearnerProps {
    dictId?: string;
    chapter?: number;
    config?: Partial<typeof defaultTypingConfig>;
}

export function QwertyLearner({ dictId = 'cet4', chapter = 0, config: userConfig }: QwertyLearnerProps) {
    const config = { ...defaultTypingConfig, ...userConfig };
    const [words, setWords] = useState<Word[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRevealed, setIsRevealed] = useState(false);
    const [readDisplayMode, setReadDisplayMode] = useState<'all' | 'hide-trans' | 'hide-word'>('all');

    const { state, currentWord, reset, skipWord } = useTyping(words, config);

    const speak = (word: string) => {
        if (!word) return;
        const audio = new Audio(`https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(word)}`);
        audio.play().catch(() => { });
    };

    // Reset revealed state when word changes
    useEffect(() => {
        setIsRevealed(false);
    }, [currentWord]);

    // Handle "Peek" with Enter key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (config.mode === 'memory' && e.key === 'Enter') {
                setIsRevealed(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [config.mode]);

    // Load dictionary words
    useEffect(() => {
        async function loadWords() {
            setIsLoading(true);
            try {
                const dict = idDictionaryMap[dictId];
                if (!dict) {
                    console.error('Dictionary not found:', dictId);
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(dict.url);
                const allWords: Word[] = await response.json();

                // Extract chapter words
                const startIdx = chapter * WORDS_PER_CHAPTER;
                const endIdx = Math.min(startIdx + WORDS_PER_CHAPTER, allWords.length);
                const chapterWords = allWords.slice(startIdx, endIdx);

                setWords(chapterWords);
            } catch (error) {
                console.error('Failed to load dictionary:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadWords();
    }, [dictId, chapter]);

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-blue-500 animate-spin" />
                    <p className="text-slate-500">Loading dictionary...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center relative bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            {/* Top Bar Area */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 pointer-events-none">
                {/* Left: Stats (Practice/Memory) or Counter (Read) */}
                <div className="pointer-events-auto">
                    {config.mode !== 'read' ? (
                        <div className="flex flex-col gap-2 bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-slate-200 p-4 min-w-[140px]">
                            <div className="flex items-center gap-2 text-xs">
                                <Zap size={14} className="text-amber-500" />
                                <span className="font-bold text-slate-700">{state.stats.wpm}</span>
                                <span className="text-slate-400">WPM</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Target size={14} className="text-green-500" />
                                <span className="font-bold text-slate-700">{state.stats.accuracy}%</span>
                                <span className="text-slate-400">ACC</span>
                            </div>
                            <div className="w-full h-px bg-slate-100 my-0.5" />
                            <div className="flex items-center gap-2 text-xs">
                                <Trophy size={14} className="text-blue-500" />
                                <span className="font-bold text-slate-700">{state.currentIndex + 1}</span>
                                <span className="text-slate-400">/ {words.length}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur px-5 py-2.5 rounded-full border border-slate-200 shadow-sm text-sm font-bold text-slate-500">
                            {state.currentIndex + 1} / {words.length}
                        </div>
                    )}
                </div>

                {/* Right: Read Mode Controls */}
                <div className="pointer-events-auto">
                    {config.mode === 'read' && (
                        <div className="flex gap-1 bg-white/80 backdrop-blur rounded-full p-1.5 shadow-sm border border-slate-200">
                            <button
                                onClick={() => setReadDisplayMode('all')}
                                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 text-xs font-bold ${readDisplayMode === 'all' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                title="Show All"
                            >
                                <Eye size={14} /> ALL
                            </button>
                            <button
                                onClick={() => setReadDisplayMode('hide-trans')}
                                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 text-xs font-bold ${readDisplayMode === 'hide-trans' ? 'bg-amber-100 text-amber-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                title="Hide Translation"
                            >
                                <Languages size={14} /> NO CN
                            </button>
                            <button
                                onClick={() => setReadDisplayMode('hide-word')}
                                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 text-xs font-bold ${readDisplayMode === 'hide-word' ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                title="Hide Word"
                            >
                                <EyeOff size={14} /> NO EN
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {!state.isFinished ? (
                <div className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center -mt-20">
                    {/* Current Word Display */}
                    <div className="mb-20 text-center w-full px-8 flex flex-col items-center gap-10">

                        {/* Wrapper for Word and Phonetic (Grouped for Read Mode Blur) */}
                        <div className={`relative flex flex-col items-center gap-4 transition-all duration-300
                            ${config.mode === 'read' && readDisplayMode === 'hide-word' ? 'blur-md opacity-20 hover:blur-none hover:opacity-100 cursor-pointer' : ''}
                        `}>
                            {config.mode === 'memory' && state.input.length === 0 && !isRevealed && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <span className="text-3xl text-slate-300 font-bold tracking-widest blur-sm select-none">
                                        {currentWord?.name.replace(/./g, '?')}
                                    </span>
                                </div>
                            )}

                            <div
                                className={`font-bold text-slate-800 tracking-wider select-none leading-none
                                    ${config.mode === 'memory' && state.input.length === 0 && !isRevealed ? 'opacity-0' : 'opacity-100'}
                                    transition-opacity duration-300`}
                                style={{ fontSize: `${config.fontSize * 1.5}rem` }}
                            >
                                {currentWord?.name.split('').map((char: string, idx: number) => {
                                    const isTyped = idx < state.input.length;
                                    const isCurrentChar = idx === state.input.length;
                                    const isCorrectChar = isTyped && state.input[idx] === char;

                                    // In read mode, always show as normal text color unless typed (which shouldn't happen)
                                    if (config.mode === 'read') return <span key={idx}>{char}</span>;

                                    return (
                                        <span
                                            key={idx}
                                            className={`
                                                transition-colors duration-100
                                                ${isCurrentChar ? 'border-b-4 border-blue-500' : ''}
                                                ${isTyped && isCorrectChar ? 'text-green-500' : ''}
                                                ${isTyped && !isCorrectChar ? 'text-red-500' : ''}
                                                ${!isTyped ? 'text-slate-300' : ''}
                                            `}
                                        >
                                            {char}
                                        </span>
                                    );
                                })}
                            </div>

                            {config.showPhonetic && currentWord?.usphone && (
                                <div className="text-4xl text-slate-500 font-mono font-medium transition-all duration-300">
                                    /{currentWord.usphone}/
                                </div>
                            )}
                        </div>

                        {config.showTranslation && currentWord?.trans && (
                            <div className={`text-xl text-slate-700 font-medium italic transition-all duration-300 max-w-2xl
                                ${config.mode === 'memory' && state.input.length === 0 && !isRevealed ? 'scale-125 mb-4 text-blue-600' : ''}
                                ${config.mode === 'read' && readDisplayMode === 'hide-trans' ? 'blur-md opacity-20 hover:blur-none hover:opacity-100 cursor-pointer' : ''}
                            `}>
                                {currentWord.trans.join('; ')}
                            </div>
                        )}
                    </div>


                    {/* Input Progress Display */}
                    {config.mode !== 'read' && (
                        <div className="w-full max-w-xl">
                            <div className={`w-full px-6 py-4 text-2xl text-center font-mono bg-white border-2 rounded-2xl min-h-[60px] flex items-center justify-center transition-all ${state.input ? 'border-blue-300 shadow-lg' : 'border-slate-300'}`}>
                                {state.input ? (
                                    <span className={currentWord && currentWord.name.startsWith(state.input.trim()) ? 'text-slate-800' : 'text-red-500'}>
                                        {state.input}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 text-lg flex items-center gap-2">
                                        {config.mode === 'memory'
                                            ? <><span className="animate-pulse">Press Enter to Reveal</span> or Type</>
                                            : (state.isTyping ? 'Typing...' : 'Press any key to start...')}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-24 flex gap-3">
                        {config.mode === 'read' ? (
                            <div className="flex gap-6">
                                <button
                                    onClick={() => speak(currentWord.name)}
                                    className="px-8 py-4 bg-white hover:bg-slate-50 text-blue-500 rounded-full font-bold text-xl shadow-md hover:shadow-lg border border-slate-200 transition-all active:scale-95"
                                    title="Listen to Pronunciation"
                                >
                                    <Volume2 size={28} fill="currentColor" />
                                </button>
                                <button
                                    onClick={skipWord}
                                    className="flex items-center gap-4 px-10 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full font-bold text-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                                >
                                    Next Word <SkipForward size={28} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={skipWord}
                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full text-sm font-bold transition-colors shadow-sm hover:shadow"
                            >
                                <SkipForward size={16} />
                                Skip (Tab)
                            </button>
                        )}
                    </div>

                    {/* Hint */}
                    {config.mode !== 'read' && (
                        <div className="mt-6 text-sm text-slate-400">
                            Press <kbd className="px-2 py-1 bg-slate-200 rounded-md text-slate-600 font-sans font-bold border-b-2 border-slate-300">Space</kbd> to continue
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-xl text-center">
                    <div className="mb-8">
                        <div className="text-6xl mb-4 animate-bounce">🎉</div>
                        <div className="text-3xl font-bold text-slate-800 mb-2">Chapter Completed!</div>
                        <div className="text-slate-500">
                            You've finished {words.length} words
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="text-3xl font-bold text-amber-500">{state.stats.wpm}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">WPM</div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="text-3xl font-bold text-green-500">{state.stats.accuracy}%</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Accuracy</div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="text-3xl font-bold text-blue-500">
                                {state.stats.endTime && state.stats.startTime
                                    ? Math.round((state.stats.endTime - state.stats.startTime) / 1000)
                                    : 0}s
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Time</div>
                        </div>
                    </div>

                    <button
                        onClick={reset}
                        className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto transition-all active:scale-95"
                    >
                        <RotateCcw size={20} />
                        Practice Again
                    </button>
                </div>
            )}

            {/* Progress Bar */}
            {!state.isFinished && (
                <div className="absolute bottom-8 w-full max-w-3xl px-8">
                    <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                        <span>Progress</span>
                        <span>{Math.round(((state.currentIndex + 1) / words.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full shadow-sm"
                            style={{ width: `${((state.currentIndex + 1) / words.length) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
