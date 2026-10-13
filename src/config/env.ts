export interface PublicEnv {
  supabaseUrl: string
  supabaseAnonKey: string
}

type EnvSource = Record<string, string | undefined>

function required(source: EnvSource, key: string): string {
  const value = source[key]?.trim()
  if (!value) {
    throw new Error(`Missing required public environment variable: ${key}`)
  }
  return value
}

export function parsePublicEnv(source: EnvSource): PublicEnv {
  const supabaseUrl = required(source, 'SHOPOS_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = required(source, 'SHOPOS_PUBLIC_SUPABASE_ANON_KEY')

  let parsedUrl: URL
  try {
    parsedUrl = new URL(supabaseUrl)
  } catch {
    throw new Error('SHOPOS_PUBLIC_SUPABASE_URL must be an HTTP or HTTPS URL')
  }

  if (
    !['http:', 'https:'].includes(parsedUrl.protocol) ||
    !parsedUrl.hostname
  ) {
    throw new Error('SHOPOS_PUBLIC_SUPABASE_URL must be an HTTP or HTTPS URL')
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv({
    SHOPOS_PUBLIC_SUPABASE_URL: import.meta.env.SHOPOS_PUBLIC_SUPABASE_URL,
    SHOPOS_PUBLIC_SUPABASE_ANON_KEY:
      import.meta.env.SHOPOS_PUBLIC_SUPABASE_ANON_KEY,
  })
}
