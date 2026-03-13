import { supabase } from './client'

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
}

// 获取用户已解锁的徽章（按解锁时间降序）
export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) throw error
  return data || []
}

// 批量解锁新徽章（已解锁的由 UNIQUE 约束保证不重复）
export const awardBadges = async (userId: string, badgeIds: string[]): Promise<void> => {
  if (badgeIds.length === 0) return

  const rows = badgeIds.map(badge_id => ({ user_id: userId, badge_id }))
  const { error } = await supabase.from('user_badges').insert(rows)
  if (error) throw error
}
