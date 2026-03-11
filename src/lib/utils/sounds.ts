// 音效播放工具

// 音效 URL（使用免费的音效资源）
const SOUND_URLS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 正确音效
  wrong: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3',   // 错误音效
}

// 音频缓存
const audioCache: { [key: string]: HTMLAudioElement } = {}

// 预加载音效
export const preloadSounds = () => {
  Object.entries(SOUND_URLS).forEach(([key, url]) => {
    if (!audioCache[key]) {
      const audio = new Audio(url)
      audio.volume = 0.5
      audioCache[key] = audio
    }
  })
}

// 播放正确音效
export const playCorrectSound = (): Promise<void> => {
  return playSound('correct')
}

// 播放错误音效
export const playWrongSound = (): Promise<void> => {
  return playSound('wrong')
}

// 播放音效
const playSound = (key: 'correct' | 'wrong'): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const audio = audioCache[key] || new Audio(SOUND_URLS[key])
      audio.currentTime = 0
      audio.volume = 0.5
      
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      
      audio.play().catch(() => resolve())
    } catch {
      resolve()
    }
  })
}
