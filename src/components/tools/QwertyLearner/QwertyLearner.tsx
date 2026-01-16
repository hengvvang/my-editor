import { useTypingGame, Word } from './useTypingGame';
import { RotateCcw, Trophy, Target, Zap } from 'lucide-react';
import programmerWords from './dicts/programmer.json';

export function QwertyLearner() {
    const words = programmerWords as Word[];
    const {
        currentWord,
        currentIndex,
        input,
        isCorrect,
        stats,
        isCompleted,
        inputRef,
        handleInput,
        reset,
        totalWords
    } = useTypingGame(words);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            {/* Stats Bar */}
            <div className="w-full max-w-3xl mb-8 flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 text-sm">
                    <Zap size={16} className="text-amber-500" />
                    <span className="font-semibold text-slate-700">{stats.wpm}</span>
                    <span className="text-slate-400">WPM</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Target size={16} className="text-green-500" />
                    <span className="font-semibold text-slate-700">{stats.accuracy}%</span>
                    <span className="text-slate-400">Accuracy</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Trophy size={16} className="text-blue-500" />
                    <span className="font-semibold text-slate-700">{currentIndex + 1}</span>
                    <span className="text-slate-400">/ {totalWords}</span>
                </div>
            </div>

            {!isCompleted ? (
                <div className="w-full max-w-3xl flex flex-col items-center">
                    {/* Current Word Display */}
                    <div className="mb-8 text-center">
                        <div className="text-6xl font-bold text-slate-800 tracking-wider mb-4 select-none">
                            {currentWord?.word.split('').map((char, idx) => {
                                const isTyped = idx < input.length;
                                const isCurrentChar = idx === input.length;
                                const isCorrectChar = isTyped && input[idx] === char;

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
                        {currentWord?.translation && (
                            <div className="text-sm text-slate-500 italic">
                                {currentWord.translation}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="w-full max-w-xl">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => handleInput(e.target.value)}
                            className={`
                                w-full px-6 py-4 text-2xl text-center font-mono
                                border-2 rounded-xl outline-none transition-all
                                ${isCorrect
                                    ? 'border-slate-300 focus:border-blue-400 bg-white'
                                    : 'border-red-300 focus:border-red-400 bg-red-50 animate-shake'
                                }
                            `}
                            placeholder="Type the word..."
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>

                    {/* Hint */}
                    <div className="mt-6 text-sm text-slate-400">
                        Press <kbd className="px-2 py-1 bg-slate-200 rounded text-slate-600">Space</kbd> or type exactly to continue
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-xl text-center">
                    <div className="mb-8">
                        <div className="text-6xl mb-4">🎉</div>
                        <div className="text-3xl font-bold text-slate-800 mb-2">Completed!</div>
                        <div className="text-slate-500">
                            You've finished all {totalWords} words
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="text-3xl font-bold text-amber-500">{stats.wpm}</div>
                            <div className="text-sm text-slate-500">WPM</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="text-3xl font-bold text-green-500">{stats.accuracy}%</div>
                            <div className="text-sm text-slate-500">Accuracy</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="text-3xl font-bold text-blue-500">{stats.correctWords}</div>
                            <div className="text-sm text-slate-500">Correct</div>
                        </div>
                    </div>

                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto transition-colors"
                    >
                        <RotateCcw size={18} />
                        Try Again
                    </button>
                </div>
            )}

            {/* Progress Bar */}
            {!isCompleted && (
                <div className="w-full max-w-3xl mt-8">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${((currentIndex + 1) / totalWords) * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
