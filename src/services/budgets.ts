import { supabase } from '@/lib/supabase'

export interface Budget {
  id?: string
  user_id?: string
  category: string
  amount: number
  period: string
  created_at?: string
  updated_at?: string
}

export async function listBudgets(userId: string): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('category', { ascending: true })

  if (error) throw error
  return (data || []) as Budget[]
}

export async function createBudget(budget: Budget): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .insert([budget])
    .select()

  if (error) throw error
  return (data || []) as Budget[]
}

export async function updateBudget(id: string, updates: Partial<Budget>): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return (data || []) as Budget[]
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)

  if (error) throw error
}
