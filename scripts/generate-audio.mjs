/**
 * 生成 2000 个汉字的 Azure TTS 音频文件
 * 运行：node scripts/generate-audio.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// 读取 Azure 配置
const AZURE_KEY    = process.env.AZURE_TTS_KEY
const AZURE_REGION = process.env.AZURE_TTS_REGION || 'eastasia'
const VOICE        = 'zh-CN-XiaoXiaoNeural'
const OUTPUT_DIR   = join(ROOT, 'audio_output')

if (!AZURE_KEY) {
  console.error('❌ 缺少 AZURE_TTS_KEY，请在 .env.local 中配置')
  process.exit(1)
}

// 收集所有不重复的汉字
const allCharsSet = new Set()
for (const stage of ['stage1', 'stage2', 'stage3', 'stage4']) {
  const data = JSON.parse(readFileSync(join(ROOT, `src/data/${stage}.json`), 'utf-8'))
  for (const unit of data.units) {
    for (const char of unit.chars) allCharsSet.add(char)
  }
}
const allChars = [...allCharsSet]
console.log(`共 ${allChars.length} 个不重复汉字，开始生成...\n`)

// 创建输出目录
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

// 调用 Azure TTS REST API
async function synthesize(char) {
  const ssml = `<speak version='1.0' xml:lang='zh-CN'>
    <voice name='${VOICE}'>${char}</voice>
  </speak>`

  const res = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      },
      body: ssml,
    }
  )

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

// 主循环
let success = 0, skipped = 0, failed = 0

for (let i = 0; i < allChars.length; i++) {
  const char = allChars[i]
  // 用 Unicode 码点作文件名，避免特殊字符问题
  const filename = char.codePointAt(0).toString(16) + '.mp3'
  const filepath = join(OUTPUT_DIR, filename)

  // 已存在则跳过（支持断点续传）
  if (existsSync(filepath)) {
    skipped++
    continue
  }

  try {
    const audio = await synthesize(char)
    writeFileSync(filepath, audio)
    success++
    console.log(`[${i + 1}/${allChars.length}] ✓ ${char}`)
  } catch (err) {
    failed++
    console.error(`[${i + 1}/${allChars.length}] ✗ ${char}：${err.message}`)
  }

  // 每 100ms 一个请求，避免触发频率限制
  await new Promise(r => setTimeout(r, 100))
}

console.log(`\n✅ 完成！成功: ${success}，跳过: ${skipped}，失败: ${failed}`)
console.log(`📁 文件保存在：${OUTPUT_DIR}`)
