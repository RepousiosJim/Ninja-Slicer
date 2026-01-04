/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_SKIP_INTRO?: string;
  readonly VITE_START_SCENE?: string;
  readonly VITE_START_LEVEL?: string;
  readonly VITE_UNLIMITED_SOULS?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
