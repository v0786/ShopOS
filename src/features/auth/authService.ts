import { supabase } from '../../lib/supabase'

export interface SignUpParams {
  email: string
  password: string
  fullName: string
  phone?: string
}

export const authService = {
  async signUp({ email, password, fullName, phone }: SignUpParams) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    })
    if (error) throw error

    // Create profile entry if user was created
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        phone: phone || null,
      })
      if (profileError) {
        console.warn('Profile creation error during signup:', profileError)
      }
    }

    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data } = supabase.auth.onAuthStateChange(callback)
    return data.subscription
  },
}
