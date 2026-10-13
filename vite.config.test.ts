import { describe, expect, it } from 'vitest'
import { createPublicEnvDefines } from './vite.config'

describe('public Vite defines', () => {
  it('injects only the exact URL and anon-key values', () => {
    expect(
      createPublicEnvDefines({
        SHOPOS_PUBLIC_SUPABASE_URL: 'https://shopos.example.supabase.co',
        SHOPOS_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
        SHOPOS_PUBLIC_SUPABASE_URL_SECRET: 'url-secret-sentinel',
        SHOPOS_PUBLIC_SUPABASE_ANON_KEY_SECRET: 'anon-secret-sentinel',
        SHOPOS_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'service-role-sentinel',
      }),
    ).toEqual({
      'import.meta.env.SHOPOS_PUBLIC_SUPABASE_URL':
        '"https://shopos.example.supabase.co"',
      'import.meta.env.SHOPOS_PUBLIC_SUPABASE_ANON_KEY':
        '"public-anon-key"',
    })
  })
})
