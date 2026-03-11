import { supabase } from './client'
import { User } from '@/types'

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data
}

export const createUser = async (username: string, expireAt: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .insert({ username, expire_at: expireAt || null })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const checkUserExpired = (user: User): boolean => {
  if (!user.expire_at) return false
  return new Date(user.expire_at) < new Date()
}
