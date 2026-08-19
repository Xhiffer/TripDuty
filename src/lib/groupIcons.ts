import {
  Anchor,
  Beer,
  Bike,
  Camera,
  Car,
  Caravan,
  Compass,
  Flame,
  Globe,
  Heart,
  House,
  Luggage,
  MapPin,
  Mountain,
  Music,
  Palmtree,
  PartyPopper,
  Plane,
  Sailboat,
  Snowflake,
  Sun,
  Tent,
  TreePine,
  Utensils,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Les icones proposees a la creation d'un groupe.
 *
 * Elles viennent toutes du meme jeu de traits que le reste de l'application :
 * un emoji a cote d'une icone au trait fait toujours rapporte. Qui tient
 * vraiment a son drapeau japonais peut quand meme en choisir un, derriere le
 * bouton « plus ».
 *
 * Une icone est stockee sous la forme `lucide:tent`, un emoji sous sa forme
 * habituelle : les deux tiennent dans la meme colonne, et un groupe deja
 * enregistre avec un emoji continue de s'afficher.
 */
export const GROUP_ICONS: Record<string, LucideIcon> = {
  mountain: Mountain,
  'tree-pine': TreePine,
  palmtree: Palmtree,
  waves: Waves,
  tent: Tent,
  flame: Flame,
  caravan: Caravan,
  sailboat: Sailboat,
  anchor: Anchor,
  plane: Plane,
  car: Car,
  bike: Bike,
  luggage: Luggage,
  compass: Compass,
  'map-pin': MapPin,
  globe: Globe,
  house: House,
  'party-popper': PartyPopper,
  beer: Beer,
  utensils: Utensils,
  heart: Heart,
  music: Music,
  camera: Camera,
  snowflake: Snowflake,
  sun: Sun,
}

export const GROUP_ICON_KEYS = Object.keys(GROUP_ICONS)

const PREFIX = 'lucide:'

export function iconValue(key: string): string {
  return PREFIX + key
}

/** Rend l'icone correspondante, ou rien si la valeur est un emoji. */
export function iconFor(value: string): LucideIcon | null {
  if (!value.startsWith(PREFIX)) return null
  return GROUP_ICONS[value.slice(PREFIX.length)] ?? null
}

/**
 * La couleur d'un groupe est un degrade : on en tire un ton plein pour
 * colorer l'icone, qui est un trait et ne peut pas porter de degrade.
 */
export function solidColor(value: string): string {
  const found = value.match(/#[0-9a-f]{3,8}/gi)
  if (!found || found.length === 0) return value
  return found[Math.min(1, found.length - 1)]
}
