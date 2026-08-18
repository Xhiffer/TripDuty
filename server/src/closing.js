// Grosses taches de fin de sejour, creees avec le groupe et modifiables ensuite.
export const CLOSING_CATALOG = [
  { key: 'final_clean', emoji: '🧽', points: 40, needsLicense: false, fr: 'Le grand ménage du départ' },
  { key: 'round_drinks', emoji: '🍻', points: 30, needsLicense: false, fr: 'La tournée au bar' },
  { key: 'return_fuel', emoji: '⛽', points: 25, needsLicense: true, fr: "Le plein d'essence du retour" },
  { key: 'empty_fridge', emoji: '🧊', points: 20, needsLicense: false, fr: 'Vider et nettoyer le frigo' },
  { key: 'last_dishes', emoji: '🍽️', points: 20, needsLicense: false, fr: 'La vaisselle du dernier soir' },
  { key: 'hand_keys', emoji: '🔑', points: 15, needsLicense: false, fr: "Rendre les clés et faire l'état des lieux" },
  { key: 'return_toll', emoji: '🛣️', points: 15, needsLicense: true, fr: 'Le péage du retour' },
]

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function makeInviteCode() {
  return Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')
}
