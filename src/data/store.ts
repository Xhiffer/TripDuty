import type { AppData } from '../types'
import type { Mutation } from './mutations'
import { applyMutation } from './mutations'
import { seedData } from './seed'
import { hasSupabase } from './supabaseClient'
import { supabaseStore } from './supabaseStore'

/**
 * Couche de donnees.
 *
 * L'interface ne propose volontairement aucun `save(data)`. Envoyer l'etat
 * complet revient a dire « voici l'application telle que je la connais », ce
 * qui efface tout ce que l'on n'a pas vu : le geste d'un autre telephone
 * disparait sans erreur ni conflit. On envoie donc des mutations, qui ne
 * parlent que de ce qu'elles touchent.
 *
 * Brancher la base en ligne consiste a ecrire un second objet qui respecte
 * cette interface, en traduisant chaque mutation en une ecriture ciblee
 * (voir supabase/migrations). Aucun ecran n'a besoin d'etre modifie.
 */
export interface Store {
  load(): Promise<AppData>
  apply(mutation: Mutation): Promise<void>
  /**
   * Signale un changement venu d'ailleurs, et retourne de quoi se desabonner.
   * Optionnel : un magasin sans partage n'a rien a annoncer.
   */
  subscribe?(onChange: (data: AppData) => void): () => void
}

const KEY = 'tripduty:data:v3'

function read(): AppData | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AppData) : null
  } catch {
    // donnees illisibles, on repart d'une base propre
    return null
  }
}

/**
 * Tout reste dans le telephone. Suffisant pour valider l'interface, mais
 * chaque telephone garde ses propres donnees : rien n'est partage.
 */
export const localStore: Store = {
  async load() {
    const existing = read()
    if (existing) return existing
    const fresh = seedData()
    localStorage.setItem(KEY, JSON.stringify(fresh))
    return fresh
  },

  async apply(mutation) {
    // On relit avant d'ecrire, plutot que de faire confiance a l'etat que React
    // a en memoire. C'est ce qui evite qu'un second onglet du meme telephone
    // ecrase le premier, et c'est exactement le raisonnement qui vaudra ensuite
    // entre deux telephones.
    const current = read()
    if (!current) return
    localStorage.setItem(KEY, JSON.stringify(applyMutation(current, mutation)))
  },

  subscribe(onChange) {
    // Le navigateur previent les autres onglets, jamais celui qui vient d'ecrire.
    const handler = (event: StorageEvent) => {
      if (event.key !== KEY || !event.newValue) return
      try {
        onChange(JSON.parse(event.newValue) as AppData)
      } catch {
        // ecriture illisible, on garde l'etat courant
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  },
}

/**
 * Le magasin en vigueur.
 *
 * Sans variables d'environnement on reste sur le telephone : une application
 * qui fonctionne seule vaut mieux qu'un ecran blanc. Voir supabaseClient.ts.
 */
export const store: Store = hasSupabase ? supabaseStore : localStore
