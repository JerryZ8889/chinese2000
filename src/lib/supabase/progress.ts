import { supabase } from './client'
import { UnitProgress } from '@/types'

export const getUserProgress = async (userId: string): Promise<UnitProgress[]> => {
  const { data, error } = await supabase
    .from('unit_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data || []
}

export const getUnitProgress = async (
  userId: string,
  stage: number,
  unit: number
): Promise<UnitProgress | null> => {
  const { data, error } = await supabase
    .from('unit_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('stage', stage)
    .eq('unit', unit)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const saveUnitProgress = async (
  progress: Omit<UnitProgress, 'id'>
): Promise<UnitProgress> => {
  const { data, error } = await supabase
    .from('unit_progress')
    .upsert(progress, { onConflict: 'user_id,stage,unit' })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateUnitProgress = async (
  userId: string,
  stage: number,
  unit: number,
  updates: Partial<UnitProgress>
): Promise<UnitProgress> => {
  const { data, error } = await supabase
    .from('unit_progress')
    .update(updates)
    .eq('user_id', userId)
    .eq('stage', stage)
    .eq('unit', unit)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getStageProgress = async (
  userId: string,
  stage: number
): Promise<{ completed: number; total: number }> => {
  const { data, error } = await supabase
    .from('unit_progress')
    .select('completed')
    .eq('user_id', userId)
    .eq('stage', stage)
    .eq('completed', true)

  if (error) throw error
  return { completed: data?.length || 0, total: 0 }
}
