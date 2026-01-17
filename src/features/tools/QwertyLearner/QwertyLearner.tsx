import { useEffect, useState } from 'react';
import { useTyping } from './hooks/useTyping';
import { RotateCcw, Trophy, Target, Zap, SkipForward, SkipBack, Loader2, Volume2, Eye, EyeOff, Languages } from 'lucide-react';
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

    const { state, currentWord, reset, skipWord, prevWord } = useTyping(words, config);

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
                    {/* Wrapper for Word and Phonetic (Grouped for Read Mode Blur) */}
                    <div className={`relative flex flex-col items-center gap-6 transition-all duration-300 w-full
                            ${config.mode === 'read' && readDisplayMode === 'hide-word' ? 'blur-md opacity-20 hover:blur-none hover:opacity-100 cursor-pointer' : ''}
                        `}>
                        {config.mode === 'memory' && state.input.length === 0 && !isRevealed && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 -mt-8">
                                <span className="text-4xl text-slate-200 font-bold tracking-[0.2em] blur-[2px] select-none animate-pulse">
                                    {currentWord?.name.replace(/./g, '?')}
                                </span>
                            </div>
                        )}

                        <div
                            className={`font-bold text-slate-800 tracking-wider select-none leading-none relative z-0
                                    ${config.mode === 'memory' && state.input.length === 0 && !isRevealed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                                    transition-all duration-300 ease-out`}
                            style={{ fontSize: `${config.fontSize * 1.8}rem`, fontFamily: '"JetBrains Mono", monospace' }}
                        >
                            {currentWord?.name.split('').map((char: string, idx: number) => {
                                const isTyped = idx < state.input.length;
                                const isCurrentChar = idx === state.input.length;
                                const isCorrectChar = isTyped && state.input[idx] === char;

                                // Calculate if previous char was an error to show connection issues if desired
                                // For now just simple coloring

                                // In read mode, always show as normal text color unless typed (which shouldn't happen)
                                if (config.mode === 'read') return <span key={idx}>{char}</span>;

                                return (
                                    <span
                                        key={idx}
                                        className={`
                                                relative
                                                transition-colors duration-150
                                                ${isCurrentChar ? 'text-blue-600' : ''}
                                                ${isTyped && isCorrectChar ? 'text-slate-300' : ''}
                                                ${isTyped && !isCorrectChar ? 'text-red-500' : ''}
                                                ${!isTyped && !isCurrentChar ? 'text-slate-800' : ''}
                                            `}
                                    >
                                        {char}
                                        {isCurrentChar && (
                                            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        )}
                                    </span>
                                );
                            })}
                        </div>

                        {config.showPhonetic && (currentWord?.usphone || currentWord?.ukphone) && (
                            <div className="flex items-center gap-3">
                                <div className="text-3xl font-mono text-slate-500 font-medium">/{currentWord?.usphone || currentWord?.ukphone}/</div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        speak(currentWord.name);
                                    }}
                                    className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-blue-500 transition-all hover:scale-110 active:scale-95 hover:shadow-sm"
                                    title="Play Pronunciation"
                                >
                                    <Volume2 size={24} />
                                </button>
                            </div>
                        )}
                    </div>

                    {config.showTranslation && currentWord?.trans && (
                        <div className={`mt-8 text-xl text-slate-600 font-medium transition-all duration-300 max-w-2xl leading-relaxed bg-white/50 backdrop-blur px-8 py-4 rounded-xl border border-slate-200/50 shadow-sm
                            ${config.mode === 'memory' && state.input.length === 0 && !isRevealed ? 'scale-110 text-blue-600 shadow-md bg-white border-blue-100' : ''}
                            ${config.mode === 'read' && readDisplayMode === 'hide-trans' ? 'blur-md opacity-20 hover:blur-none hover:opacity-100 cursor-pointer' : ''}
                        `}>
                            {currentWord.trans.map((t, i) => (
                                <div key={i} className="mb-0.5 last:mb-0">{t}</div>
                            ))}
                        </div>
                    )}

                    {/* Input Progress Display */}
                    {config.mode !== 'read' && (
                        <div className="w-full max-w-xl mt-12 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />

                            <div className={`relative w-full px-8 py-5 text-2xl text-center font-mono bg-white border-2 rounded-2xl min-h-[72px] flex items-center justify-center transition-all duration-200
                                ${state.input
                                    ? state.input.trim() === (currentWord?.name || '').substring(0, state.input.length)
                                        ? 'border-blue-400 shadow-[0_4px_20px_-2px_rgba(59,130,246,0.1)]'
                                        : 'border-red-300 shadow-[0_4px_20px_-2px_rgba(239,68,68,0.1)] bg-red-50'
                                    : 'border-slate-200'
                                }
                            `}>
                                {state.input ? (
                                    <span className={`tracking-wide ${currentWord && currentWord.name.startsWith(state.input.trim())
                                        ? 'text-slate-700'
                                        : 'text-red-500 line-through decoration-2 decoration-red-300'
                                        }`}>
                                        {state.input}
                                    </span>
                                ) : (
                                    <span className="text-slate-300 text-lg flex items-center gap-3 font-medium select-none">
                                        {config.mode === 'memory'
                                            ? <><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Press <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 text-sm font-bold border border-slate-300 border-b-2">Enter</span> to Reveal</>
                                            : (state.isTyping ? 'Typing...' : 'Start typing...')}
                                    </span>
                                )}

                                {/* Right-side indicator */}
                                {state.input && currentWord?.name.startsWith(state.input.trim()) && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 opacity-50">
                                        <Zap size={20} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-24 flex gap-3">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex gap-4">
                                <button
                                    onClick={prevWord}
                                    className="group flex items-center justify-center w-20 h-16 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-2xl text-xl font-bold transition-all border-2 border-slate-200 shadow-[0_4px_0_0_rgb(226,232,240)] hover:shadow-[0_2px_0_0_rgb(226,232,240)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                                    title="Previous Word"
                                >
                                    <SkipBack size={24} className="group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.currentTarget.blur();
                                        speak(currentWord.name);
                                    }}
                                    className="group flex items-center justify-center w-24 h-16 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-500 rounded-2xl text-xl font-bold transition-all border-2 border-slate-200 shadow-[0_4px_0_0_rgb(226,232,240)] hover:shadow-[0_2px_0_0_rgb(226,232,240)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                                    title="Listen (Space)"
                                >
                                    <Volume2 size={28} className="group-hover:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={skipWord}
                                    className="group flex items-center justify-center gap-3 px-10 h-16 min-w-[200px] bg-blue-500 hover:bg-blue-400 text-white rounded-2xl text-xl font-bold transition-all border-2 border-blue-600 shadow-[0_4px_0_0_rgb(29,78,216)] hover:shadow-[0_2px_0_0_rgb(29,78,216)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                                >
                                    {config.mode === 'read' ? 'Next' : 'Skip'} <SkipForward size={24} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                            {config.mode !== 'read' && (
                                <span className="text-xs font-medium text-slate-300 mt-2">Press <kbd>Tab</kbd> to skip</span>
                            )}
                        </div>
                    </div>

                    {/* Hint */}
                    {config.mode !== 'read' && (
                        <div className="mt-8 opacity-0 hover:opacity-100 transition-opacity">
                            {/* Placeholder for future hints or stats */}
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
            )
            }

            {/* Progress Bar */}
            {
                !state.isFinished && (
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
                )
            }
        </div >
    );
}
