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

/**
 * Mode demonstration : `?demo=1` dans l'adresse coupe la base en ligne et
 * fait tourner l'application sur un groupe de dix personnes deja rempli.
 * Sert a regarder l'application vivante sans toucher aux vraies donnees.
 */
export const demoMode =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1'

export const hasSupabase = Boolean(url && key) && !demoMode

export const supabase = hasSupabase
  ? createClient(url as string, key as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
