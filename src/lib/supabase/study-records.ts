import { supabase } from './client'

// 记录今日学习（完成单元时调用）
export const recordStudy = async (
  userId: string
): Promise<{ success: boolean; error: Error | null }> => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  try {
    // 尝试更新今天的记录
    const { data: existing } = await supabase
      .from('study_records')
      .select('*')
      .eq('user_id', userId)
      .eq('study_date', today)
      .single()

    if (existing) {
      // 已有记录，更新单元数
      const { error } = await supabase
        .from('study_records')
        .update({ 
          units_completed: existing.units_completed + 1 
        })
        .eq('id', existing.id)
      
      if (error) throw error
    } else {
      // 没有记录，创建新记录
      const { error } = await supabase
        .from('study_records')
        .insert({
          user_id: userId,
          study_date: today,
          units_completed: 1
        })
      
      if (error) throw error
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

// 获取连续学习天数
export const getStreakDays = async (
  userId: string
): Promise<{ streak: number; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('study_records')
      .select('study_date')
      .eq('user_id', userId)
      .order('study_date', { ascending: false })
      .limit(365) // 最多查询一年

    if (error) throw error
    if (!data || data.length === 0) {
      return { streak: 0, error: null }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 检查今天或昨天是否有学习记录
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const hasToday = data.some(r => r.study_date === todayStr)
    const hasYesterday = data.some(r => r.study_date === yesterdayStr)

    // 如果今天或昨天没有学习，连续天数为0
    if (!hasToday && !hasYesterday) {
      return { streak: 0, error: null }
    }

    // 计算连续天数
    let streak = 0
    const checkDate = hasToday ? today : yesterday
    
    for (const record of data) {
      const recordDate = new Date(record.study_date)
      recordDate.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(checkDate)
      expectedDate.setDate(expectedDate.getDate() - streak)
      expectedDate.setHours(0, 0, 0, 0)
      
      if (recordDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return { streak, error: null }
  } catch (error) {
    return { streak: 0, error: error as Error }
  }
}

// 获取学习统计数据
export const getStudyStats = async (
  userId: string
): Promise<{ 
  streak: number
  totalDays: number
  totalUnits: number
  error: Error | null 
}> => {
  try {
    // 获取连续天数
    const { streak } = await getStreakDays(userId)

    // 获取总学习天数和总单元数
    const { data, error } = await supabase
      .from('study_records')
      .select('units_completed')
      .eq('user_id', userId)

    if (error) throw error

    const totalDays = data?.length || 0
    const totalUnits = data?.reduce((sum, r) => sum + r.units_completed, 0) || 0

    return { streak, totalDays, totalUnits, error: null }
  } catch (error) {
    return { streak: 0, totalDays: 0, totalUnits: 0, error: error as Error }
  }
}
