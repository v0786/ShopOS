/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly SHOPOS_PUBLIC_SUPABASE_URL: string
  readonly SHOPOS_PUBLIC_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
