import { supabase } from './client'
import { WrongChar } from '@/types'

export const recordWrongChar = async (
  userId: string,
  char: string,
  stage: number,
  unit: number
): Promise<{ data: WrongChar | null; error: Error | null }> => {
  // 先检查是否已存在
  const { data: existing } = await supabase
    .from('wrong_chars')
    .select('*')
    .eq('user_id', userId)
    .eq('char', char)
    .single()

  if (existing) {
    // 更新错误次数
    const { data, error } = await supabase
      .from('wrong_chars')
      .update({
        wrong_count: existing.wrong_count + 1,
        last_wrong_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    return { data, error: error as Error | null }
  }

  // 创建新记录
  const { data, error } = await supabase
    .from('wrong_chars')
    .insert({
      user_id: userId,
      char,
      stage,
      unit,
      wrong_count: 1,
      last_wrong_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  return { data, error: error as Error | null }
}

export const getUserWrongChars = async (userId: string): Promise<{ data: WrongChar[] | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('wrong_chars')
    .select('*')
    .eq('user_id', userId)
    .order('last_wrong_at', { ascending: false })
  
  return { data, error: error as Error | null }
}

export const deleteWrongChar = async (userId: string, char: string): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('wrong_chars')
    .delete()
    .eq('user_id', userId)
    .eq('char', char)
  
  return { error: error as Error | null }
}

export const getWrongCharsByStageUnit = async (
  userId: string,
  stage: number,
  unit: number
): Promise<{ data: WrongChar[] | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('wrong_chars')
    .select('*')
    .eq('user_id', userId)
    .eq('stage', stage)
    .eq('unit', unit)
  
  return { data, error: error as Error | null }
}
