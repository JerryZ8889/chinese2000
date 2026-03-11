// Fisher-Yates 洗牌算法
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 从数组中随机选择 n 个不重复的元素
export const pickRandom = <T>(array: T[], n: number, exclude?: T[]): T[] => {
  const available = exclude 
    ? array.filter(item => !exclude.includes(item))
    : [...array]
  
  const shuffled = shuffleArray(available)
  return shuffled.slice(0, n)
}

// 打乱数组顺序（原地修改）
export const shuffleInPlace = <T>(array: T[]): void => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

// 生成随机整数
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 生成随机字符串 ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}
