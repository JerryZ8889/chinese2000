import { supabase } from './client'
import { WrongChar } from '@/types'

export const recordWrongChar = async (
  userId: string,
  char: string,
  stage: number,
  unit: number
): Promise<WrongChar> => {
  const { data: existing } = await supabase
    .from('wrong_chars')
    .select('*')
    .eq('user_id', userId)
    .eq('char', char)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('wrong_chars')
      .update({
        wrong_count: existing.wrong_count + 1,
        last_wrong_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('wrong_chars')
    .insert({ user_id: userId, char, stage, unit, wrong_count: 1, last_wrong_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserWrongChars = async (userId: string): Promise<WrongChar[]> => {
  const { data, error } = await supabase
    .from('wrong_chars')
    .select('*')
    .eq('user_id', userId)
    .order('last_wrong_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const deleteWrongChar = async (userId: string, char: string): Promise<void> => {
  const { error } = await supabase
    .from('wrong_chars')
    .delete()
    .eq('user_id', userId)
    .eq('char', char)

  if (error) throw error
}

export const getWrongCharsByStageUnit = async (
  userId: string,
  stage: number,
  unit: number
): Promise<WrongChar[]> => {
  const { data, error } = await supabase
    .from('wrong_chars')
    .select('*')
    .eq('user_id', userId)
    .eq('stage', stage)
    .eq('unit', unit)

  if (error) throw error
  return data || []
}
