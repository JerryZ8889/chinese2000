// 语音播放：优先使用 Supabase Storage 预生成音频，降级到 Web Speech API

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// 会话内音频元素缓存，同一个字第二次播放直接复用
const audioCache = new Map<string, HTMLAudioElement>()

// 根据汉字获取 Supabase Storage 音频 URL（基础练习 bucket，用 codepoint hex 作文件名）
const getAudioUrl = (char: string): string | null => {
  const cp = char.codePointAt(0)
  if (!cp) return null
  return `${SUPABASE_URL}/storage/v1/object/public/audio/${cp.toString(16)}.mp3`
}

// 根据汉字获取卡梅拉 bucket 音频 URL（用 Unicode codepoint hex 作文件名，与 audio bucket 一致）
const getCamelaAudioUrl = (char: string): string | null => {
  const cp = char.codePointAt(0)
  if (!cp || !SUPABASE_URL) return null
  return `${SUPABASE_URL}/storage/v1/object/public/camela-audio/${cp.toString(16)}.mp3`
}

// 用预生成音频播放
const speakWithAudio = (char: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const url = getAudioUrl(char)
    if (!url) { reject(new Error('无效字符')); return }
    let audio = audioCache.get(char)
    if (!audio) {
      audio = new Audio(url)
      audioCache.set(char, audio)
    } else {
      audio.currentTime = 0
    }

    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error('音频加载失败'))
    audio.play().catch(reject)
  })
}

// 降级：Web Speech API
const speakWithWebSpeech = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return }

    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.4
    utterance.pitch = 1.0
    utterance.volume = 1

    const voices = speechSynthesis.getVoices()
    const chineseVoice = voices.find(v => v.lang === 'zh-CN') ||
                         voices.find(v => v.lang.startsWith('zh')) || null
    if (chineseVoice) utterance.voice = chineseVoice

    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()

    try {
      speechSynthesis.speak(utterance)
      if (speechSynthesis.paused) speechSynthesis.resume()
    } catch {
      resolve()
    }
  })
}

// 主入口：优先高质量音频，失败则降级
export const speak = async (text: string): Promise<void> => {
  if (SUPABASE_URL) {
    try {
      await speakWithAudio(text)
      return
    } catch {
      // 降级到 Web Speech API
    }
  }
  await speakWithWebSpeech(text)
}

// 停止播放
export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) speechSynthesis.cancel()
  audioCache.forEach(audio => { audio.pause(); audio.currentTime = 0 })
}

// 预加载语音列表（保持接口兼容）
export const preloadVoices = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return }
    if (speechSynthesis.getVoices().length > 0) { resolve(); return }
    speechSynthesis.addEventListener('voiceschanged', () => resolve(), { once: true })
    setTimeout(resolve, 1000)
  })
}

export const isSpeechSupported = (): boolean => true
export const getCurrentVoice = (): SpeechSynthesisVoice | null => null

// 卡梅拉专用播放函数：优先 camela-audio bucket，失败则降级 Web Speech API
export const speakCamela = async (char: string): Promise<void> => {
  const url = getCamelaAudioUrl(char)
  if (url) {
    try {
      await new Promise<void>((resolve, reject) => {
        let audio = audioCache.get(`camela:${char}`)
        if (!audio) {
          audio = new Audio(url)
          audioCache.set(`camela:${char}`, audio)
        } else {
          audio.currentTime = 0
        }
        audio.onended = () => resolve()
        audio.onerror = () => reject(new Error('音频加载失败'))
        audio.play().catch(reject)
      })
      return
    } catch {
      // 降级到 Web Speech API
    }
  }
  await speakWithWebSpeech(char)
}
