import type { TripState } from '../types'
import { seedState } from './seed'

/**
 * Couche de donnees. Aujourd'hui tout est dans le telephone (localStorage),
 * ce qui suffit pour valider l'app. Le jour ou la base en ligne est branchee,
 * il suffit d'ecrire un autre objet qui respecte cette meme interface :
 * aucun ecran n'a besoin d'etre modifie.
 */
export interface Store {
  load(): Promise<TripState>
  save(state: TripState): Promise<void>
}

const KEY = 'tripduty:state:v2'

export const localStore: Store = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw) as TripState
    } catch {
      // donnees illisibles, on repart d'une base propre
    }
    const fresh = seedState()
    localStorage.setItem(KEY, JSON.stringify(fresh))
    return fresh
  },
  async save(state) {
    localStorage.setItem(KEY, JSON.stringify(state))
  },
}

export function resetStore() {
  localStorage.removeItem(KEY)
}

export const store: Store = localStore
