'use server'

import { createClient } from '@/utils/supabase/server'
import { getSessionUid } from './auth-session'

export interface ApiaryTask {
  id: string
  user_id: string
  task_description: string
  due_date: string | null
  priority: string | null
  status: string | null
  created_at: string
}

export async function getUserTasks(): Promise<{ data: ApiaryTask[]; error: string | null }> {
  const uid = await getSessionUid()
  if (!uid) {
    return { data: [], error: 'Unauthorized' }
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('apiary_tasks')
      .select('id, user_id, task_description, due_date, priority, status, created_at')
      .eq('user_id', uid)
      .neq('status', 'DONE')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return { data: [], error: error.message }
    }

    return { data: (data || []) as ApiaryTask[], error: null }
  } catch (error: any) {
    console.error('Unexpected error fetching tasks:', error)
    return { data: [], error: error.message || 'Unknown error' }
  }
}

export async function updateTaskStatus(taskId: string, status: string): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid()
  if (!uid) {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('apiary_tasks')
      .update({ status })
      .eq('id', taskId)
      .eq('user_id', uid)

    if (error) {
      console.error('Error updating task status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Unexpected error updating task status:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}
