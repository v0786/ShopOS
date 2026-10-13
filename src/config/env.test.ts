import { describe, expect, it } from 'vitest'
import { parsePublicEnv } from './env'

describe('parsePublicEnv', () => {
  it('returns the configured public Supabase URL and anon key', () => {
    expect(
      parsePublicEnv({
        SHOPOS_PUBLIC_SUPABASE_URL: 'https://shopos.example.supabase.co',
        SHOPOS_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
      }),
    ).toEqual({
      supabaseUrl: 'https://shopos.example.supabase.co',
      supabaseAnonKey: 'public-anon-key',
    })
  })

  it('rejects missing public configuration', () => {
    expect(() => parsePublicEnv({})).toThrow(
      'Missing required public environment variable: SHOPOS_PUBLIC_SUPABASE_URL',
    )
  })

  it('rejects a missing public anon key', () => {
    expect(() =>
      parsePublicEnv({ SHOPOS_PUBLIC_SUPABASE_URL: 'https://shopos.example' }),
    ).toThrow(
      'Missing required public environment variable: SHOPOS_PUBLIC_SUPABASE_ANON_KEY',
    )
  })

  it('returns only the public settings when other environment values exist', () => {
    expect(
      parsePublicEnv({
        SHOPOS_PUBLIC_SUPABASE_URL: 'https://shopos.example.supabase.co',
        SHOPOS_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
        SHOPOS_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'must-not-be-returned',
      }),
    ).toEqual({
      supabaseUrl: 'https://shopos.example.supabase.co',
      supabaseAnonKey: 'public-anon-key',
    })
  })

  it('rejects a malformed Supabase URL', () => {
    expect(() =>
      parsePublicEnv({
        SHOPOS_PUBLIC_SUPABASE_URL: 'javascript:alert(1)',
        SHOPOS_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
      }),
    ).toThrow('SHOPOS_PUBLIC_SUPABASE_URL must be an HTTP or HTTPS URL')
  })
})
