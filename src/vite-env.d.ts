/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Racine du projet Supabase, sans suffixe : le client ajoute /rest/v1 et le reste. */
  readonly VITE_SUPABASE_URL?: string
  /** Cle publique ("publishable" ou "anon"). Publique par conception, voir supabaseClient.ts. */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Prefixe d'URL pour un deploiement dans un sous-chemin (GitHub Pages). */
  readonly VITE_BASE_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Les dernieres modifications du depot, injectees a la compilation. */
declare const __RECENT_CHANGES__: Array<{
  version: string
  author: string
  date: string
  subject: string
  body: string
}>
