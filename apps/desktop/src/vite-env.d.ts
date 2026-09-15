/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface SisyflowBridge {
  onAuthCallback(callback: (url: string) => void): () => void
  signalAuthReady(): void
}

interface Window {
  sisyflow?: SisyflowBridge
}
