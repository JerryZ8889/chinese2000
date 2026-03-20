/**
 * 上传 public/audio/camela/ 中的音频文件到 Supabase Storage (camela-audio bucket)
 * 运行：node scripts/upload-camela-audio.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const AUDIO_DIR         = join(ROOT, 'public', 'audio', 'camela')
const BUCKET            = 'camela-audio'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const files = readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'))
console.log(`共 ${files.length} 个文件，开始上传...\n`)

let success = 0, skipped = 0, failed = 0

for (let i = 0; i < files.length; i++) {
  const filename = files[i]
  // 从文件名提取汉字（去掉 .mp3 后缀），上传时用 Unicode codepoint hex 作为 key
  const char = filename.replace(/\.mp3$/, '')
  const cp = char.codePointAt(0)
  const storageKey = cp.toString(16) + '.mp3'
  const fileData = readFileSync(join(AUDIO_DIR, filename))

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, fileData, {
      contentType: 'audio/mpeg',
      upsert: false,
    })

  if (error) {
    if (error.message?.includes('already exists') || error.message?.includes('The resource already exists')) {
      skipped++
    } else {
      failed++
      console.error(`[${i + 1}/${files.length}] ✗ ${char}：${error.message}`)
    }
  } else {
    success++
    if (success % 50 === 0 || i === files.length - 1) {
      console.log(`[${i + 1}/${files.length}] 已上传 ${success} 个...`)
    }
  }
}

console.log(`\n✅ 完成！成功: ${success}，跳过: ${skipped}，失败: ${failed}`)
