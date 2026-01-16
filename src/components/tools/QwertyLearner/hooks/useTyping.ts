import { useCallback, useEffect, useState } from 'react'
import type { TypingConfig } from '../config/typing'
import type { Word } from '../types'
import { useSound } from './useSound'

export interface TypingState {
  currentIndex: number
  input: string
  loopCount: number
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
}

const isLegal = (key: string): boolean => {
  return key.length === 1 && /[a-zA-Z0-9\s\-'.!?;:,]/.test(key)
}

export function useTyping(words: Word[], config: TypingConfig) {
  const { play } = useSound()
  const [state, setState] = useState<TypingState>({
    currentIndex: 0,
    input: '',
    loopCount: 1,
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
  })

  // Speech Synthesis
  const speak = useCallback((text: string) => {
    if (!config.pronunciationEnabled) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }, [config.pronunciationEnabled])

  const currentWord = state.chapterData.words[state.currentIndex]

  // Play word on change
  useEffect(() => {
    if (currentWord && config.pronunciationEnabled) {
      speak(currentWord.name)
    }
  }, [currentWord, config.pronunciationEnabled, speak])

  // Initialize chapter data
  useEffect(() => {
    if (words.length > 0) {
      setState((prev) => ({
        ...prev,
        chapterData: {
          words: config.randomEnabled ? [...words].sort(() => Math.random() - 0.5) : words,
          index: 0,
        },
        currentIndex: 0,
        input: '',
        loopCount: 1,
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
      }))
    }
  }, [words, config.randomEnabled])

  // Calculate WPM and accuracy
  useEffect(() => {
    if (state.stats.startTime && state.isTyping && !state.isFinished) {
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
  }, [state.stats.startTime, state.isTyping, state.isFinished])

  // Keyboard event handler
  useEffect(() => {
    if (state.isFinished || !currentWord) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key

      // Handle Backspace
      if (key === 'Backspace' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setState((prev) => ({
          ...prev,
          input: prev.input.slice(0, -1),
        }))
        return
      }

      // Start typing if not started
      if (!state.isTyping && isLegal(key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
        // Prevent starting with Space
        if (key === ' ') return

        setState((prev) => ({
          ...prev,
          isTyping: true,
          stats: {
            ...prev.stats,
            startTime: Date.now(),
          },
        }))
      }

      // Ignore modifier keys and special keys
      if (e.altKey || e.ctrlKey || e.metaKey || !isLegal(key)) {
        return
      }

      e.preventDefault()

      setState((prev) => {
        // Prevent leading spaces
        if (key === ' ' && prev.input.length === 0) return prev

        const newInput = key === ' ' ? prev.input + ' ' : prev.input + key
        const targetWord = currentWord.name

        // Check if input matches target so far
        const isCorrect = targetWord.startsWith(newInput.trim())

        if (!isCorrect) {
          // Wrong input - count error
          if (config.wrongSoundEnabled) play('/sounds/beep.wav')
          return {
            ...prev,
            stats: {
              ...prev.stats,
              wrongCount: prev.stats.wrongCount + 1,
            },
          }
        }

        // Correct so far
        if (config.keySoundEnabled) play('/sounds/key-sound/Default.wav')
        const newStats = {
          ...prev.stats,
          correctCount: prev.stats.correctCount + 1,
        }

        // Check if word is complete (ends with space)
        if (key === ' ' && newInput.trim() === targetWord) {
          // Word completed correctly
          if (config.correctSoundEnabled) play('/sounds/correct.wav')

          const currentLoop = prev.loopCount || 1
          if (config.loopTimes && config.loopTimes > 1 && currentLoop < config.loopTimes) {
            return {
              ...prev,
              input: '',
              loopCount: currentLoop + 1,
              stats: newStats,
            }
          }

          const nextIndex = prev.currentIndex + 1

          if (nextIndex >= prev.chapterData.words.length) {
            // Chapter finished
            return {
              ...prev,
              input: '',
              loopCount: 1,
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
            loopCount: 1,
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
  }, [state.isTyping, state.isFinished, currentWord, config, play])

  const reset = useCallback(() => {
    setState({
      currentIndex: 0,
      input: '',
      loopCount: 1,
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
