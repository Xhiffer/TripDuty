import type { TripState } from '../types'
import type { Mutation } from './mutations'
import { applyMutation } from './mutations'
import { seedState } from './seed'

/**
 * Couche de donnees.
 *
 * L'interface ne propose volontairement aucun `save(state)`. Envoyer l'etat
 * complet revient a dire « voici le sejour tel que je le connais », ce qui
 * efface tout ce que l'on n'a pas vu : le geste d'un autre telephone disparait
 * sans erreur ni conflit. On envoie donc des mutations, qui ne parlent que de
 * ce qu'elles touchent.
 *
 * Brancher la base en ligne consiste a ecrire un second objet qui respecte
 * cette interface, en traduisant chaque mutation en une ecriture ciblee
 * (voir supabase/migrations). Aucun ecran n'a besoin d'etre modifie.
 */
export interface Store {
  load(): Promise<TripState>
  apply(mutation: Mutation): Promise<void>
  /**
   * Signale un changement venu d'ailleurs, et retourne de quoi se desabonner.
   * Optionnel : un magasin sans partage n'a rien a annoncer.
   */
  subscribe?(onChange: (state: TripState) => void): () => void
}

const KEY = 'tripduty:state:v2'

function read(): TripState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as TripState) : null
  } catch {
    // donnees illisibles, on repart d'une base propre
    return null
  }
}

/**
 * Tout reste dans le telephone. Suffisant pour valider l'interface, mais
 * chaque telephone garde son propre sejour : rien n'est partage.
 */
export const localStore: Store = {
  async load() {
    const existing = read()
    if (existing) return existing
    const fresh = seedState()
    localStorage.setItem(KEY, JSON.stringify(fresh))
    return fresh
  },

  async apply(mutation) {
    // On relit avant d'ecrire, plutot que de faire confiance a l'etat que React
    // a en memoire. C'est ce qui evite qu'un second onglet du meme telephone
    // ecrase le premier, et c'est exactement le raisonnement qui vaut ensuite
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
        onChange(JSON.parse(event.newValue) as TripState)
      } catch {
        // ecriture illisible, on garde l'etat courant
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  },
}

export const store: Store = localStore
