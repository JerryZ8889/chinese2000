import { supabase } from './client'
import { User } from '@/types'

export const getUserByUsername = async (username: string): Promise<{ data: User | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()
  
  return { data, error: error as Error | null }
}

export const createUser = async (username: string, expireAt: string): Promise<{ data: User | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('users')
    .insert({ username, expire_at: expireAt })
    .select()
    .single()
  
  return { data, error: error as Error | null }
}

export const updateUser = async (id: string, updates: Partial<User>): Promise<{ data: User | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error: error as Error | null }
}

export const deleteUser = async (id: string): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
  
  return { error: error as Error | null }
}

export const getAllUsers = async (): Promise<{ data: User[] | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error: error as Error | null }
}

export const checkUserExpired = (user: User): boolean => {
  if (!user.expire_at) return false
  return new Date(user.expire_at) < new Date()
}
