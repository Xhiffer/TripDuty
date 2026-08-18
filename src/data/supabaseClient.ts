import { createClient } from '@supabase/supabase-js'

/**
 * Le client vers la base en ligne, ou rien du tout.
 *
 * Sans variables d'environnement, l'application doit continuer a fonctionner
 * sur le stockage du telephone : c'est ce qui permet de la faire tourner en
 * demonstration, et c'est ce qui evite qu'un deploiement mal configure affiche
 * un ecran blanc plutot qu'une application.
 *
 * La cle "publishable" est publique par conception : elle part dans le bundle
 * du navigateur. La securite repose entierement sur les regles RLS decrites
 * dans supabase/migrations/0002_rls.sql, jamais sur le secret de cette cle.
 */
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const hasSupabase = Boolean(url && key)

export const supabase = hasSupabase
  ? createClient(url as string, key as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
