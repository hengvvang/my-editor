// Typing game configuration
export interface TypingConfig {
  // Sound settings
  keySoundEnabled: boolean
  keySoundVolume: number
  hintSoundEnabled: boolean
  correctSoundEnabled: boolean
  wrongSoundEnabled: boolean
  hintSoundVolume: number

  // Display settings
  showTranslation: boolean
  showPhonetic: boolean
  fontSize: number

  // Pronunciation settings
  pronunciationEnabled: boolean
  pronunciationSpeed: number

  // Loop settings
  loopTimes: 1 | 2 | 3 | 4 | 5 | 10

  // Random settings
  randomEnabled: boolean

  // Learning Mode
  mode: 'practice' | 'memory' | 'read'

  // Word dictation (spelling mode)
  wordDictationEnabled: boolean
}

export const defaultTypingConfig: TypingConfig = {
  keySoundEnabled: false,
  keySoundVolume: 0.5,
  hintSoundEnabled: true,
  correctSoundEnabled: true,
  wrongSoundEnabled: true,
  hintSoundVolume: 0.5,
  showTranslation: true,
  showPhonetic: true,
  fontSize: 4, // 1-5 scale
  pronunciationEnabled: false,
  pronunciationSpeed: 1,
  loopTimes: 1,
  randomEnabled: false,
  wordDictationEnabled: false,
  mode: 'practice',
}

// Chapter configuration
export const WORDS_PER_CHAPTER = 20
