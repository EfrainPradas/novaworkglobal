/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_ENV: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_ENABLE_GOOGLE_AUTH: string
  readonly VITE_ENABLE_LINKEDIN_AUTH: string
  readonly VITE_ENABLE_MOCK_DATA: string
  readonly VITE_ENABLE_STRIPE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
