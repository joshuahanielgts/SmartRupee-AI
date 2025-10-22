import { supabase } from '@/lib/supabase'

export type Transaction = {
  id?: string
  user_id?: string
  amount: number
  currency: string
  category?: string
  note?: string
  date: string
}

export async function listTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  
  if (error) throw error
  return (data || []) as Transaction[]
}

export async function createTransaction(tx: Transaction): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .insert([tx])
    .select()
  
  if (error) throw error
  return (data || []) as Transaction[]
}
