import { supabase } from './client'
import { UnitProgress } from '@/types'

export const getUserProgress = async (userId: string): Promise<{ data: UnitProgress[] | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('unit_progress')
    .select('*')
    .eq('user_id', userId)
  
  return { data, error: error as Error | null }
}

export const getUnitProgress = async (
  userId: string,
  stage: number,
  unit: number
): Promise<{ data: UnitProgress | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('unit_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('stage', stage)
    .eq('unit', unit)
    .single()
  
  return { data, error: error as Error | null }
}

export const saveUnitProgress = async (
  progress: Omit<UnitProgress, 'id'>
): Promise<{ data: UnitProgress | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('unit_progress')
    .upsert(progress, { onConflict: 'user_id,stage,unit' })
    .select()
    .single()
  
  return { data, error: error as Error | null }
}

export const updateUnitProgress = async (
  userId: string,
  stage: number,
  unit: number,
  updates: Partial<UnitProgress>
): Promise<{ data: UnitProgress | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('unit_progress')
    .update(updates)
    .eq('user_id', userId)
    .eq('stage', stage)
    .eq('unit', unit)
    .select()
    .single()
  
  return { data, error: error as Error | null }
}

export const getStageProgress = async (
  userId: string,
  stage: number
): Promise<{ completed: number; total: number }> => {
  const { data } = await supabase
    .from('unit_progress')
    .select('completed')
    .eq('user_id', userId)
    .eq('stage', stage)
    .eq('completed', true)
  
  const completed = data?.length || 0
  return { completed, total: 0 } // total 需要从字表数据获取
}
