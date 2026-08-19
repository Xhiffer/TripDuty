// Catalogue des 20 taches par defaut, avec leur bareme.
// Les gens peuvent en creer d'autres avec leurs propres points.

export interface CatalogEntry {
  key: string
  emoji: string
  points: number
  needsLicense: boolean
  fr: string
  en: string
}

export const CATALOG: CatalogEntry[] = [
  { key: 'cook_meal', emoji: '🍲', points: 35, needsLicense: false, fr: 'Cuisiner un vrai repas', en: 'Cook a full meal' },
  { key: 'big_groceries', emoji: '🛒', points: 30, needsLicense: false, fr: 'Faire les grosses courses', en: 'Do the big grocery run' },
  { key: 'drive_long', emoji: '🚗', points: 30, needsLicense: false, fr: "Conduire plus d'1h", en: 'Drive for more than 1h' },
  { key: 'deep_clean', emoji: '🧹', points: 30, needsLicense: false, fr: 'Grand ménage de la maison', en: 'Deep clean the house' },
  { key: 'bathroom', emoji: '🚿', points: 30, needsLicense: false, fr: 'Nettoyer la salle de bain et les WC', en: 'Clean the bathroom and toilets' },
  { key: 'dishes_dinner', emoji: '🍽️', points: 25, needsLicense: false, fr: 'Vaisselle du soir', en: 'Wash up after dinner' },
  { key: 'plan_outing', emoji: '🗺️', points: 25, needsLicense: false, fr: 'Organiser une sortie de A à Z', en: 'Plan an outing from start to finish' },
  { key: 'laundry', emoji: '🧺', points: 20, needsLicense: false, fr: 'Faire une lessive complète', en: 'Do a full load of laundry' },
  { key: 'tidy_kitchen', emoji: '🧽', points: 20, needsLicense: false, fr: 'Ranger la cuisine', en: 'Tidy up the kitchen' },
  { key: 'drive_short', emoji: '🚙', points: 15, needsLicense: false, fr: "Conduire moins d'1h", en: 'Drive for less than 1h' },
  { key: 'breakfast', emoji: '🥐', points: 15, needsLicense: false, fr: 'Préparer le petit-déjeuner', en: 'Make breakfast' },
  { key: 'host_game', emoji: '🎲', points: 15, needsLicense: false, fr: 'Animer un jeu', en: 'Host a game' },
  { key: 'dishes_lunch', emoji: '🍴', points: 15, needsLicense: false, fr: 'Vaisselle du midi', en: 'Wash up after lunch' },
  { key: 'small_groceries', emoji: '🧾', points: 10, needsLicense: false, fr: "Faire les courses d'appoint", en: 'Grab a few groceries' },
  { key: 'vacuum', emoji: '🌀', points: 10, needsLicense: false, fr: "Passer le balai ou l'aspirateur", en: 'Sweep or vacuum' },
  { key: 'bins', emoji: '🗑️', points: 10, needsLicense: false, fr: 'Sortir et trier les poubelles', en: 'Take out and sort the bins' },
  { key: 'table', emoji: '🪑', points: 10, needsLicense: false, fr: 'Mettre et débarrasser la table', en: 'Set and clear the table' },
  { key: 'fuel', emoji: '⛽', points: 10, needsLicense: false, fr: "Faire le plein d'essence", en: 'Fill up the tank' },
  { key: 'suggest_activity', emoji: '💡', points: 5, needsLicense: false, fr: "Proposer l'activité du lendemain", en: "Suggest tomorrow's activity" },
  { key: 'bread', emoji: '🥖', points: 5, needsLicense: false, fr: 'Aller chercher le pain', en: 'Go get the bread' },
]

export const EMOJI_CHOICES = [
  '🍲', '🛒', '🚗', '🧹', '🚿', '🍽️', '🗺️', '🧺', '🧽', '🥐',
  '🎲', '🍴', '🧾', '🌀', '🗑️', '🪑', '⛽', '💡', '🥖', '🏊',
  '🔥', '🎸', '📸', '🧊', '☕', '🐕', '🛶', '🎯',
]
