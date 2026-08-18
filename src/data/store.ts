import type { AppData } from '../types'
import { seedData } from './seed'

/**
 * Couche de donnees. Aujourd'hui tout est dans le telephone (localStorage),
 * ce qui suffit pour valider l'application. Le jour ou la base en ligne est
 * branchee, il suffit d'ecrire un autre objet qui respecte cette interface :
 * aucun ecran n'a besoin d'etre modifie.
 */
export interface Store {
  load(): Promise<AppData>
  save(data: AppData): Promise<void>
}

const KEY = 'tripduty:data:v3'

export const localStore: Store = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw) as AppData
    } catch {
      // donnees illisibles, on repart d'une base propre
    }
    const fresh = seedData()
    localStorage.setItem(KEY, JSON.stringify(fresh))
    return fresh
  },
  async save(data) {
    localStorage.setItem(KEY, JSON.stringify(data))
  },
}

export function resetStore() {
  localStorage.removeItem(KEY)
}

export const store: Store = localStore
