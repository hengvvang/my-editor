import { useCallback, useEffect, useRef, useState } from 'react';

export interface Word {
    word: string;
    translation?: string;
}

export interface TypingStats {
    correctChars: number;
    incorrectChars: number;
    totalWords: number;
    correctWords: number;
    startTime: number | null;
    wpm: number;
    accuracy: number;
}

export function useTypingGame(wordList: Word[]) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState('');
    const [isCorrect, setIsCorrect] = useState(true);
    const [stats, setStats] = useState<TypingStats>({
        correctChars: 0,
        incorrectChars: 0,
        totalWords: 0,
        correctWords: 0,
        startTime: null,
        wpm: 0,
        accuracy: 100
    });
    const [isCompleted, setIsCompleted] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const currentWord = wordList[currentIndex];

    // Auto-focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Calculate WPM and accuracy
    useEffect(() => {
        if (stats.startTime) {
            const elapsed = (Date.now() - stats.startTime) / 1000 / 60; // minutes
            const wpm = elapsed > 0 ? Math.round(stats.correctChars / 5 / elapsed) : 0;
            const totalChars = stats.correctChars + stats.incorrectChars;
            const accuracy = totalChars > 0 ? Math.round((stats.correctChars / totalChars) * 100) : 100;

            setStats(prev => ({ ...prev, wpm, accuracy }));
        }
    }, [stats.correctChars, stats.incorrectChars, stats.startTime]);

    const handleInput = useCallback((value: string) => {
        if (!currentWord) return;

        // Start timer on first input
        if (!stats.startTime) {
            setStats(prev => ({ ...prev, startTime: Date.now() }));
        }

        setInput(value);

        // Check if input matches current word prefix
        const isMatch = currentWord.word.startsWith(value);
        setIsCorrect(isMatch);

        // Complete word on space or exact match
        if (value.endsWith(' ') || value === currentWord.word) {
            const trimmed = value.trim();
            const isWordCorrect = trimmed === currentWord.word;

            if (isWordCorrect) {
                setStats(prev => ({
                    ...prev,
                    correctChars: prev.correctChars + currentWord.word.length,
                    totalWords: prev.totalWords + 1,
                    correctWords: prev.correctWords + 1
                }));

                // Move to next word
                if (currentIndex < wordList.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                    setInput('');
                    setIsCorrect(true);
                } else {
                    // Completed all words
                    setIsCompleted(true);
                }
            } else {
                setStats(prev => ({
                    ...prev,
                    incorrectChars: prev.incorrectChars + Math.max(trimmed.length, currentWord.word.length),
                    totalWords: prev.totalWords + 1
                }));
                // Skip to next word on error
                if (currentIndex < wordList.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                    setInput('');
                    setIsCorrect(true);
                } else {
                    setIsCompleted(true);
                }
            }
        }
    }, [currentWord, currentIndex, wordList.length, stats.startTime]);

    const reset = useCallback(() => {
        setCurrentIndex(0);
        setInput('');
        setIsCorrect(true);
        setStats({
            correctChars: 0,
            incorrectChars: 0,
            totalWords: 0,
            correctWords: 0,
            startTime: null,
            wpm: 0,
            accuracy: 100
        });
        setIsCompleted(false);
        setTimeout(() => inputRef.current?.focus(), 0);
    }, []);

    return {
        currentWord,
        currentIndex,
        input,
        isCorrect,
        stats,
        isCompleted,
        inputRef,
        handleInput,
        reset,
        totalWords: wordList.length
    };
}
