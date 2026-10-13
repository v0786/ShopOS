import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

type PublicSource = Record<string, string | undefined>

export function createPublicEnvDefines(source: PublicSource) {
  return {
    'import.meta.env.SHOPOS_PUBLIC_SUPABASE_URL': JSON.stringify(
      source.SHOPOS_PUBLIC_SUPABASE_URL ?? '',
    ),
    'import.meta.env.SHOPOS_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
      source.SHOPOS_PUBLIC_SUPABASE_ANON_KEY ?? '',
    ),
  }
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    // Disable Vite's prefix-based browser env exposure; define only exact public keys.
    envPrefix: [],
    define: createPublicEnvDefines(environment),
  }
})
