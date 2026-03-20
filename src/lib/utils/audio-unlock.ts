/**
 * 在用户手势（click/tap）中调用，播放一段静音音频来解锁浏览器的 autoplay 限制。
 * 调用后，同一页面会话内的所有 audio.play() 都不会被拦截。
 */

let unlocked = false

export function unlockAudio() {
  if (unlocked) return

  try {
    // 方法1：通过 AudioContext 解锁 Web Audio API
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      const ctx = new AudioCtx()
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
      if (ctx.state === 'suspended') ctx.resume()
    }

    // 方法2：通过 HTMLAudioElement 解锁媒体播放
    const audio = new Audio()
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    audio.volume = 0
    audio.play().catch(() => {})

    unlocked = true
  } catch {
    // ignore
  }
}

export function isAudioUnlocked() {
  return unlocked
}
