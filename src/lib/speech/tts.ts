// Web Speech API 封装

let chineseVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false

// 预加载语音列表
export const preloadVoices = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('浏览器不支持语音合成')
      resolve()
      return
    }

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      console.log('可用语音列表:', voices.map(v => `${v.name} (${v.lang})`))
      
      // 优先使用中文语音
      chineseVoice = voices.find(v => v.lang === 'zh-CN') ||
                      voices.find(v => v.lang.startsWith('zh')) ||
                      // Windows 系统常见中文语音
                      voices.find(v => v.name.toLowerCase().includes('chinese')) ||
                      voices.find(v => v.name.toLowerCase().includes('中文')) ||
                      null
      
      if (chineseVoice) {
        console.log('已选择中文语音:', chineseVoice.name)
      } else {
        console.warn('未找到中文语音，将使用默认语音')
      }
      voicesLoaded = true
      resolve()
    }

    // 某些浏览器需要等待 voiceschanged 事件
    if (speechSynthesis.getVoices().length > 0) {
      loadVoices()
    } else {
      speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true })
      // 设置超时，防止事件不触发
      setTimeout(() => {
        if (!voicesLoaded) {
          loadVoices()
        }
      }, 1000)
    }
  })
}

// 播放语音
export const speak = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.error('浏览器不支持语音合成')
      reject(new Error('浏览器不支持语音合成'))
      return
    }

    // 取消之前的语音
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // 设置中文语音参数
    utterance.lang = 'zh-CN'
    utterance.rate = 0.4    // 0.4 ≈ 0.8/2，约当前0.8倍时长（更慢）
    utterance.pitch = 1.0   // 正常音高
    utterance.volume = 1    // 最大音量

    // 使用预加载的中文语音
    if (chineseVoice) {
      utterance.voice = chineseVoice
    }

    utterance.onstart = () => {
      console.log('开始播放语音:', text)
    }
    
    utterance.onend = () => {
      console.log('语音播放完成')
      resolve()
    }
    
    utterance.onerror = (e) => {
      console.error('语音合成错误:', e)
      resolve() // 即使出错也 resolve，避免阻塞
    }

    // 某些浏览器需要在用户交互后才能播放
    try {
      speechSynthesis.speak(utterance)
      
      // 某些浏览器需要 resume
      if (speechSynthesis.paused) {
        speechSynthesis.resume()
      }
    } catch (error) {
      console.error('播放语音失败:', error)
      resolve()
    }
  })
}

// 停止语音
export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}

// 检查是否支持语音合成
export const isSpeechSupported = (): boolean => {
  return 'speechSynthesis' in window
}

// 获取当前选择的语音
export const getCurrentVoice = (): SpeechSynthesisVoice | null => {
  return chineseVoice
}
