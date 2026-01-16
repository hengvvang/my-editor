import { useState, useCallback, useEffect, useRef } from 'react'
import type { Word } from '../types'
import type { TypingConfig } from '../config/typing'

export interface TypingState {
  currentIndex: number
  input: string
  chapterData: {
    words: Word[]
    index: number
  }
  isTyping: boolean
  isFinished: boolean
  stats: {
    correctCount: number
    wrongCount: number
    startTime: number | null
    endTime: number | null
    wpm: number
    accuracy: number
  }
  wordStats: Array<{
    word: string
    correctCount: number
    wrongCount: number
    timeSpent: number
  }>
}

export function useTyping(words: Word[], config: TypingConfig) {
  const [state, setState] = useState<TypingState>({
    currentIndex: 0,
    input: '',
    chapterData: {
      words: [],
      index: 0,
    },
    isTyping: false,
    isFinished: false,
    stats: {
      correctCount: 0,
      wrongCount: 0,
      startTime: null,
      endTime: null,
      wpm: 0,
      accuracy: 100,
    },
    wordStats: [],
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const wordStartTimeRef = useRef<number>(0)

  const currentWord = state.chapterData.words[state.currentIndex]

  // Initialize chapter data
  useEffect(() => {
    if (words.length > 0) {
      setState((prev) => ({
        ...prev,
        chapterData: {
          words: config.randomEnabled ? [...words].sort(() => Math.random() - 0.5) : words,
          index: 0,
        },
        wordStats: words.map((w) => ({
          word: w.word,
          correctCount: 0,
          wrongCount: 0,
          timeSpent: 0,
        })),
      }))
    }
  }, [words, config.randomEnabled])

  // Calculate WPM and accuracy
  useEffect(() => {
    if (state.stats.startTime) {
      const elapsed = (Date.now() - state.stats.startTime) / 1000 / 60
      const totalChars = state.stats.correctCount + state.stats.wrongCount
      const wpm = elapsed > 0 ? Math.round(state.stats.correctCount / 5 / elapsed) : 0
      const accuracy = totalChars > 0 ? Math.round((state.stats.correctCount / totalChars) * 100) : 100

      setState((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          wpm,
          accuracy,
        },
      }))
    }
  }, [state.stats.correctCount, state.stats.wrongCount, state.stats.startTime])

  const handleInput = useCallback(
    (value: string) => {
      if (!currentWord) return

      // Start timer on first input
      if (!state.stats.startTime) {
        setState((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            startTime: Date.now(),
          },
          isTyping: true,
        }))
        wordStartTimeRef.current = Date.now()
      }

      setState((prev) => ({ ...prev, input: value }))

      // Check completion
      if (value === currentWord.word + ' ' || (value === currentWord.word && value.endsWith(' '))) {
        const timeSpent = Date.now() - wordStartTimeRef.current

        // Update word stats
        setState((prev) => {
          const newWordStats = [...prev.wordStats]
          const wordStatIndex = newWordStats.findIndex((s) => s.word === currentWord.word)
          if (wordStatIndex !== -1) {
            newWordStats[wordStatIndex].correctCount += 1
            newWordStats[wordStatIndex].timeSpent += timeSpent
          }

          const newStats = {
            ...prev.stats,
            correctCount: prev.stats.correctCount + currentWord.word.length,
          }

          // Move to next word
          const nextIndex = prev.currentIndex + 1
          if (nextIndex >= prev.chapterData.words.length) {
            // Chapter finished
            return {
              ...prev,
              input: '',
              currentIndex: nextIndex,
              isFinished: true,
              isTyping: false,
              stats: {
                ...newStats,
                endTime: Date.now(),
              },
              wordStats: newWordStats,
            }
          }

          wordStartTimeRef.current = Date.now()
          return {
            ...prev,
            input: '',
            currentIndex: nextIndex,
            stats: newStats,
            wordStats: newWordStats,
          }
        })
      }
    },
    [currentWord, state.stats.startTime],
  )

  const reset = useCallback(() => {
    setState({
      currentIndex: 0,
      input: '',
      chapterData: {
        words: config.randomEnabled ? [...words].sort(() => Math.random() - 0.5) : words,
        index: 0,
      },
      isTyping: false,
      isFinished: false,
      stats: {
        correctCount: 0,
        wrongCount: 0,
        startTime: null,
        endTime: null,
        wpm: 0,
        accuracy: 100,
      },
      wordStats: words.map((w) => ({
        word: w.word,
        correctCount: 0,
        wrongCount: 0,
        timeSpent: 0,
      })),
    })
    wordStartTimeRef.current = 0
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [words, config.randomEnabled])

  const skipWord = useCallback(() => {
    setState((prev) => {
      if (prev.currentIndex >= prev.chapterData.words.length - 1) {
        return prev
      }
      return {
        ...prev,
        input: '',
        currentIndex: prev.currentIndex + 1,
      }
    })
    wordStartTimeRef.current = Date.now()
  }, [])

  return {
    state,
    currentWord,
    inputRef,
    handleInput,
    reset,
    skipWord,
  }
}
