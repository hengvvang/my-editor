import { useCallback, useEffect, useState } from 'react'
import type { TypingConfig } from '../config/typing'
import type { Word } from '../types'

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

const isLegal = (key: string): boolean => {
  return key.length === 1 && /[a-zA-Z0-9\s\-'.!?;:,]/.test(key)
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
    if (state.stats.startTime && state.isTyping) {
      const timer = setInterval(() => {
        setState((prev) => {
          const elapsed = (Date.now() - prev.stats.startTime!) / 1000 / 60
          const totalChars = prev.stats.correctCount + prev.stats.wrongCount
          const wpm = elapsed > 0 ? Math.round(prev.stats.correctCount / 5 / elapsed) : 0
          const accuracy = totalChars > 0 ? Math.round((prev.stats.correctCount / totalChars) * 100) : 100

          return {
            ...prev,
            stats: {
              ...prev.stats,
              wpm,
              accuracy,
            },
          }
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [state.stats.startTime, state.isTyping])

  // Keyboard event handler
  useEffect(() => {
    if (!state.isTyping || state.isFinished || !currentWord) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key

      // Ignore modifier keys and special keys
      if (e.altKey || e.ctrlKey || e.metaKey || !isLegal(key)) {
        return
      }

      e.preventDefault()

      setState((prev) => {
        const newInput = key === ' ' ? prev.input + ' ' : prev.input + key
        const targetWord = currentWord.word

        // Check if input matches target so far
        const isCorrect = targetWord.startsWith(newInput.trim())

        if (!isCorrect) {
          // Wrong input - count error
          return {
            ...prev,
            stats: {
              ...prev.stats,
              wrongCount: prev.stats.wrongCount + 1,
            },
          }
        }

        // Correct so far
        const newStats = {
          ...prev.stats,
          correctCount: prev.stats.correctCount + 1,
        }

        // Check if word is complete (ends with space)
        if (key === ' ' && newInput.trim() === targetWord) {
          // Word completed correctly
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
            }
          }

          // Move to next word
          return {
            ...prev,
            input: '',
            currentIndex: nextIndex,
            stats: newStats,
          }
        }

        // Continue typing current word
        return {
          ...prev,
          input: newInput,
          stats: newStats,
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isTyping, state.isFinished, currentWord])

  // Start typing on any key press
  useEffect(() => {
    if (state.isTyping || state.isFinished || !currentWord) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || !isLegal(e.key)) return

      e.preventDefault()
      setState((prev) => ({
        ...prev,
        isTyping: true,
        stats: {
          ...prev.stats,
          startTime: Date.now(),
        },
      }))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isTyping, state.isFinished, currentWord])

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
  }, [words, config.randomEnabled])

  const skipWord = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1
      if (nextIndex >= prev.chapterData.words.length) {
        return {
          ...prev,
          isFinished: true,
          isTyping: false,
          stats: {
            ...prev.stats,
            endTime: Date.now(),
          },
        }
      }
      return {
        ...prev,
        input: '',
        currentIndex: nextIndex,
      }
    })
  }, [])

  return {
    state,
    currentWord,
    reset,
    skipWord,
  }
}
