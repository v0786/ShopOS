import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getPublicEnv } from '../config/env'

let clientInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    const { supabaseUrl, supabaseAnonKey } = getPublicEnv()
    clientInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return clientInstance
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const instance = getSupabase()
    const value = Reflect.get(instance, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})
