import { useEffect, useState } from 'react';
import { useTyping } from './hooks/useTyping';
import { RotateCcw, Trophy, Target, Zap, SkipForward, Loader2 } from 'lucide-react';
import type { Word } from './types';
import { defaultTypingConfig, WORDS_PER_CHAPTER } from './config/typing';
import { idDictionaryMap } from './config/dictionary';

interface QwertyLearnerProps {
    dictId?: string;
    chapter?: number;
    config?: typeof defaultTypingConfig;
}

export function QwertyLearner({ dictId = 'programmer', chapter = 0, config = defaultTypingConfig }: QwertyLearnerProps) {
    const [words, setWords] = useState<Word[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { state, currentWord, reset, skipWord } = useTyping(words, config);

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
        <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            {/* Stats Bar */}
            <div className="w-full max-w-3xl mb-8 flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 text-sm">
                    <Zap size={16} className="text-amber-500" />
                    <span className="font-semibold text-slate-700">{state.stats.wpm}</span>
                    <span className="text-slate-400">WPM</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Target size={16} className="text-green-500" />
                    <span className="font-semibold text-slate-700">{state.stats.accuracy}%</span>
                    <span className="text-slate-400">Accuracy</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Trophy size={16} className="text-blue-500" />
                    <span className="font-semibold text-slate-700">{state.currentIndex + 1}</span>
                    <span className="text-slate-400">/ {words.length}</span>
                </div>
            </div>

            {!state.isFinished ? (
                <div className="w-full max-w-3xl flex flex-col items-center">
                    {/* Current Word Display */}
                    <div className="mb-8 text-center">
                        <div
                            className="font-bold text-slate-800 tracking-wider mb-4 select-none"
                            style={{ fontSize: `${config.fontSize * 1.5}rem` }}
                        >
                            {currentWord?.word.split('').map((char: string, idx: number) => {
                                const isTyped = idx < state.input.length;
                                const isCurrentChar = idx === state.input.length;
                                const isCorrectChar = isTyped && state.input[idx] === char;

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
                        {config.showTranslation && currentWord?.trans && (
                            <div className="text-sm text-slate-500 italic">
                                {currentWord.trans.join('; ')}
                            </div>
                        )}
                        {config.showPhonetic && currentWord?.usphone && (
                            <div className="text-xs text-slate-400 mt-1">
                                [{currentWord.usphone}]
                            </div>
                        )}
                    </div>

                    {/* Input Progress Display */}
                    <div className="w-full max-w-xl">
                        <div className="w-full px-6 py-4 text-2xl text-center font-mono bg-white border-2 border-slate-300 rounded-xl min-h-[60px] flex items-center justify-center">
                            {state.input ? (
                                <span className={currentWord && currentWord.word.startsWith(state.input.trim()) ? 'text-slate-800' : 'text-red-500'}>
                                    {state.input}
                                </span>
                            ) : (
                                <span className="text-slate-400">
                                    {state.isTyping ? 'Typing...' : 'Press any key to start...'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={skipWord}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <SkipForward size={16} />
                            Skip (Tab)
                        </button>
                    </div>

                    {/* Hint */}
                    <div className="mt-4 text-sm text-slate-400">
                        Press <kbd className="px-2 py-1 bg-slate-200 rounded text-slate-600">Space</kbd> to continue
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-xl text-center">
                    <div className="mb-8">
                        <div className="text-6xl mb-4">🎉</div>
                        <div className="text-3xl font-bold text-slate-800 mb-2">Chapter Completed!</div>
                        <div className="text-slate-500">
                            You've finished {words.length} words
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="text-3xl font-bold text-amber-500">{state.stats.wpm}</div>
                            <div className="text-sm text-slate-500">WPM</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="text-3xl font-bold text-green-500">{state.stats.accuracy}%</div>
                            <div className="text-sm text-slate-500">Accuracy</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="text-3xl font-bold text-blue-500">
                                {state.stats.endTime && state.stats.startTime
                                    ? Math.round((state.stats.endTime - state.stats.startTime) / 1000)
                                    : 0}s
                            </div>
                            <div className="text-sm text-slate-500">Time</div>
                        </div>
                    </div>

                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors"
                    >
                        <RotateCcw size={18} />
                        Practice Again
                    </button>
                </div>
            )}

            {/* Progress Bar */}
            {!state.isFinished && (
                <div className="w-full max-w-3xl mt-8">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${((state.currentIndex + 1) / words.length) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
