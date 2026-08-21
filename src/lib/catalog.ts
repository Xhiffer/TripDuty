/**
 * Le catalogue des taches, et ce que chacune vaut.
 *
 * Les points ne sont pas poses a l'intuition. Chaque tache a ete chiffree a
 * partir de quatre mesures : sa duree pour un groupe de huit, son cout
 * physique (valeur MET du Compendium of Physical Activities), le degout
 * qu'elle inspire (sondages YouGov et Cinch) et la charge mentale qu'elle
 * demande (les quatre operations de Daminger, 2019).
 *
 *   points = 1,1 x min(duree, 150) ^ 0,73 x kPhysique x kCorvee x kTete
 *
 * L'exposant dit qu'une tache longue vaut plus, mais pas proportionnellement :
 * deux heures de menage ne valent pas quatre fois trente minutes, on est deja
 * lance. Le plafond de 150 minutes ferme l'echelle en haut : au-dela de deux
 * heures trente c'est une seule tache, pas une accumulation.
 *
 * Ces valeurs sont celles d'une tache rendue a tout le groupe. Le grand livre
 * applique ensuite sa propre courbe quand on ne sert que quelques personnes.
 *
 * Le detail du calcul est dans docs/bareme.md.
 */

export interface CatalogEntry {
  key: string
  /** Sert a regrouper la liste deroulante ; voir FAMILIES. */
  famille: string
  emoji: string
  points: number
  needsLicense: boolean
  fr: string
  en: string
}

export interface Family {
  id: string
  fr: string
  en: string
}

/** L'ordre des familles dans la liste : celui d'une journee de sejour. */
export const FAMILIES: Family[] = [
  { id: 'arrivee', fr: 'Arrivée et installation', en: 'Arriving and settling in' },
  { id: 'cuisine', fr: 'Cuisine et repas', en: 'Cooking and meals' },
  { id: 'cuisine_suite', fr: 'Cuisine, le reste du travail', en: 'Cooking, the rest of the work' },
  { id: 'vaisselle', fr: 'Vaisselle et cuisine à nettoyer', en: 'Washing up' },
  { id: 'courses', fr: 'Courses et intendance', en: 'Shopping and supplies' },
  { id: 'menage', fr: 'Ménage', en: 'Cleaning' },
  { id: 'sdb', fr: 'Salle de bain et toilettes', en: 'Bathroom and toilets' },
  { id: 'linge', fr: 'Linge', en: 'Laundry' },
  { id: 'dechets', fr: 'Déchets', en: 'Bins and recycling' },
  { id: 'route', fr: 'Route et voitures', en: 'Driving' },
  { id: 'organisation', fr: 'Organisation et charge mentale', en: 'Organising and mental load' },
  { id: 'dehors', fr: 'Dehors et vacances', en: 'Outdoors' },
  { id: 'dehors_suite', fr: 'Dehors, le reste du travail', en: 'Outdoors, the rest of the work' },
  { id: 'soiree', fr: 'Soirée et lendemain', en: 'The night out and the morning after' },
  { id: 'enfants', fr: 'Enfants', en: 'Kids' },
  { id: 'animaux', fr: 'Animaux', en: 'Pets' },
  { id: 'pannes', fr: 'Pannes et imprévus', en: 'Things going wrong' },
  { id: 'groupe', fr: 'Vie du groupe (à débattre)', en: 'Keeping the group together' },
]

export const CATALOG: CatalogEntry[] = [
  // --- Arrivée et installation
  { key: 'faire_les_courses_d', famille: 'arrivee', emoji: '🛒', points: 28, needsLicense: false, fr: 'Faire les courses d\'arrivée', en: 'Do the first grocery run' },
  { key: 'comprendre_et_expliquer_les', famille: 'arrivee', emoji: '🔌', points: 19, needsLicense: false, fr: 'Comprendre et expliquer les équipements de la maison', en: 'Work out the house and explain it to everyone' },
  { key: 'faire_tous_les_lits', famille: 'arrivee', emoji: '🛏️', points: 18, needsLicense: false, fr: 'Faire tous les lits à l\'arrivée', en: 'Make every bed on arrival' },
  { key: 'monter_les_valises_de', famille: 'arrivee', emoji: '🧳', points: 18, needsLicense: false, fr: 'Monter les valises de tout le monde', en: 'Carry everyone\'s bags up' },
  { key: 'reperer_les_commerces_et', famille: 'arrivee', emoji: '🗺️', points: 13, needsLicense: false, fr: 'Repérer les commerces et leurs horaires', en: 'Find the local shops and their hours' },
  // --- Cuisine et repas
  { key: 'cuisiner_pour_une_grande', famille: 'cuisine', emoji: '🍝', points: 36, needsLicense: false, fr: 'Cuisiner pour une grande tablée', en: 'Cook for a big table' },
  { key: 'cook_meal', famille: 'cuisine', emoji: '🍲', points: 30, needsLicense: false, fr: 'Cuisiner un vrai repas du soir', en: 'Cook a proper dinner' },
  { key: 'faire_le_barbecue', famille: 'cuisine', emoji: '🔥', points: 24, needsLicense: false, fr: 'Faire le barbecue', en: 'Run the barbecue' },
  { key: 'preparer_un_dessert', famille: 'cuisine', emoji: '🍰', points: 16, needsLicense: false, fr: 'Préparer un dessert', en: 'Make a dessert' },
  { key: 'preparer_un_dejeuner_simple', famille: 'cuisine', emoji: '🥗', points: 15, needsLicense: false, fr: 'Préparer un déjeuner simple', en: 'Put together a simple lunch' },
  { key: 'preparer_le_pique_nique', famille: 'cuisine', emoji: '🧺', points: 15, needsLicense: false, fr: 'Préparer le pique-nique de la journée', en: 'Pack the day\'s picnic' },
  { key: 'surveiller_la_cuisson_pendant', famille: 'cuisine', emoji: '⏲️', points: 14, needsLicense: false, fr: 'Surveiller la cuisson pendant que les autres sont dehors', en: 'Watch the pot while everyone else is outside' },
  { key: 'breakfast', famille: 'cuisine', emoji: '🥐', points: 12, needsLicense: false, fr: 'Préparer le petit-déjeuner', en: 'Make breakfast' },
  { key: 'preparer_l_apero', famille: 'cuisine', emoji: '🍻', points: 10, needsLicense: false, fr: 'Préparer l\'apéro', en: 'Put out the drinks and snacks' },
  { key: 'eplucher_et_couper_les', famille: 'cuisine', emoji: '🔪', points: 10, needsLicense: false, fr: 'Éplucher et couper les légumes', en: 'Peel and chop the vegetables' },
  { key: 'faire_les_sandwichs_de', famille: 'cuisine', emoji: '🥪', points: 10, needsLicense: false, fr: 'Faire les sandwichs de la rando', en: 'Make the sandwiches for the hike' },
  { key: 'gerer_les_allergies_et', famille: 'cuisine', emoji: '🌾', points: 10, needsLicense: false, fr: 'Gérer les allergies et les régimes de chacun', en: 'Keep track of everyone\'s allergies and diets' },
  { key: 'bread', famille: 'cuisine', emoji: '🥖', points: 8, needsLicense: false, fr: 'Aller chercher le pain', en: 'Go get the bread' },
  { key: 'ranger_les_courses_en', famille: 'cuisine', emoji: '🛍️', points: 8, needsLicense: false, fr: 'Ranger les courses en arrivant', en: 'Put the shopping away' },
  { key: 'remplir_la_glaciere_et', famille: 'cuisine', emoji: '🧊', points: 7, needsLicense: false, fr: 'Remplir la glacière et faire les glaçons', en: 'Fill the cooler and make the ice' },
  { key: 'preparer_les_cafes_du', famille: 'cuisine', emoji: '☕', points: 6, needsLicense: false, fr: 'Préparer les cafés du matin', en: 'Make the morning coffees' },
  { key: 'debarrasser_la_table', famille: 'cuisine', emoji: '🧽', points: 6, needsLicense: false, fr: 'Débarrasser la table', en: 'Clear the table' },
  { key: 'preparer_le_gouter', famille: 'cuisine', emoji: '🍪', points: 6, needsLicense: false, fr: 'Préparer le goûter', en: 'Make the afternoon snack' },
  { key: 'table', famille: 'cuisine', emoji: '🍽️', points: 5, needsLicense: false, fr: 'Mettre la table', en: 'Set the table' },
  { key: 'sortir_la_viande_a', famille: 'cuisine', emoji: '🥩', points: 5, needsLicense: false, fr: 'Sortir la viande à décongeler à temps', en: 'Take the meat out to defrost in time' },
  // --- Cuisine, le reste du travail
  { key: 'gerer_deux_services_de', famille: 'cuisine_suite', emoji: '⏰', points: 22, needsLicense: false, fr: 'Gérer deux services de petit-déjeuner', en: 'Run two breakfast sittings' },
  { key: 'cuisiner_un_plat_en', famille: 'cuisine_suite', emoji: '🥦', points: 19, needsLicense: false, fr: 'Cuisiner un plat en plus pour les régimes particuliers', en: 'Cook an extra dish for special diets' },
  { key: 'utiliser_les_restes_pour', famille: 'cuisine_suite', emoji: '🥡', points: 15, needsLicense: false, fr: 'Utiliser les restes pour ne rien jeter', en: 'Use up the leftovers so nothing is wasted' },
  { key: 'preparer_les_provisions_de', famille: 'cuisine_suite', emoji: '🎒', points: 15, needsLicense: false, fr: 'Préparer les provisions de la journée en mer ou en rando', en: 'Pack the supplies for a day out' },
  { key: 'faire_le_cafe_pour', famille: 'cuisine_suite', emoji: '☕', points: 6, needsLicense: false, fr: 'Faire le café pour ceux qui se lèvent tard', en: 'Make coffee for the late risers' },
  // --- Vaisselle et cuisine à nettoyer
  { key: 'nettoyer_le_four', famille: 'vaisselle', emoji: '🔥', points: 20, needsLicense: false, fr: 'Nettoyer le four', en: 'Clean the oven' },
  { key: 'dishes_dinner', famille: 'vaisselle', emoji: '🧼', points: 18, needsLicense: false, fr: 'Faire la vaisselle du soir à la main', en: 'Wash up after dinner by hand' },
  { key: 'recurer_les_casseroles_et', famille: 'vaisselle', emoji: '🍳', points: 12, needsLicense: false, fr: 'Récurer les casseroles et le plat du four', en: 'Scrub the pans and the roasting dish' },
  { key: 'tidy_kitchen', famille: 'vaisselle', emoji: '🧹', points: 12, needsLicense: false, fr: 'Ranger la cuisine après le repas', en: 'Tidy the kitchen after the meal' },
  { key: 'dishes_lunch', famille: 'vaisselle', emoji: '🍴', points: 11, needsLicense: false, fr: 'Faire la vaisselle du midi', en: 'Wash up after lunch' },
  { key: 'nettoyer_la_plaque_de', famille: 'vaisselle', emoji: '♨️', points: 10, needsLicense: false, fr: 'Nettoyer la plaque de cuisson', en: 'Clean the hob' },
  { key: 'laver_les_verres_a', famille: 'vaisselle', emoji: '🥂', points: 7, needsLicense: false, fr: 'Laver les verres à la main', en: 'Wash the glasses by hand' },
  { key: 'nettoyer_le_plan_de', famille: 'vaisselle', emoji: '🧴', points: 7, needsLicense: false, fr: 'Nettoyer le plan de travail et l\'évier', en: 'Clean the worktop and the sink' },
  { key: 'remplir_et_lancer_le', famille: 'vaisselle', emoji: '🫧', points: 6, needsLicense: false, fr: 'Remplir et lancer le lave-vaisselle', en: 'Load and start the dishwasher' },
  { key: 'vider_le_lave_vaisselle', famille: 'vaisselle', emoji: '🥣', points: 6, needsLicense: false, fr: 'Vider le lave-vaisselle', en: 'Empty the dishwasher' },
  // --- Courses et intendance
  { key: 'big_groceries', famille: 'courses', emoji: '🛒', points: 38, needsLicense: false, fr: 'Faire les grandes courses de la semaine', en: 'Do the big weekly shop' },
  { key: 'aller_au_marche', famille: 'courses', emoji: '🥬', points: 25, needsLicense: false, fr: 'Aller au marché', en: 'Go to the market' },
  { key: 'aller_chercher_le_gaz', famille: 'courses', emoji: '⛽', points: 19, needsLicense: false, fr: 'Aller chercher le gaz, les bûches ou la glace', en: 'Fetch gas, firewood or ice' },
  { key: 'tenir_les_comptes_du', famille: 'courses', emoji: '🧮', points: 14, needsLicense: false, fr: 'Tenir les comptes du séjour', en: 'Keep the trip accounts' },
  { key: 'small_groceries', famille: 'courses', emoji: '🚙', points: 13, needsLicense: false, fr: 'Repartir chercher un oubli', en: 'Drive back out for something forgotten' },
  { key: 'faire_la_liste_de', famille: 'courses', emoji: '📝', points: 10, needsLicense: false, fr: 'Faire la liste de courses', en: 'Write the shopping list' },
  { key: 'porter_et_monter_les', famille: 'courses', emoji: '📦', points: 10, needsLicense: false, fr: 'Porter et monter les courses', en: 'Carry the shopping in' },
  { key: 'reserver_le_restaurant_pour', famille: 'courses', emoji: '📞', points: 10, needsLicense: false, fr: 'Réserver le restaurant pour tout le monde', en: 'Book the restaurant for everyone' },
  { key: 'acheter_les_viennoiseries_pour', famille: 'courses', emoji: '🥐', points: 10, needsLicense: false, fr: 'Acheter les viennoiseries pour tous', en: 'Buy pastries for everyone' },
  { key: 'gerer_les_boissons_et', famille: 'courses', emoji: '🍷', points: 9, needsLicense: false, fr: 'Gérer les boissons et la cave', en: 'Look after the drinks' },
  { key: 'surveiller_les_stocks_papier', famille: 'courses', emoji: '🧻', points: 8, needsLicense: false, fr: 'Surveiller les stocks (papier, sacs, éponges)', en: 'Keep an eye on supplies (paper, bags, sponges)' },
  { key: 'avancer_l_argent_pour', famille: 'courses', emoji: '💶', points: 4, needsLicense: false, fr: 'Avancer l\'argent pour le groupe', en: 'Front the money for the group' },
  // --- Ménage
  { key: 'nettoyer_apres_la_soiree', famille: 'menage', emoji: '🎉', points: 24, needsLicense: false, fr: 'Nettoyer après la soirée', en: 'Clean up after the party' },
  { key: 'vacuum', famille: 'menage', emoji: '🌀', points: 22, needsLicense: false, fr: 'Passer l\'aspirateur dans toute la maison', en: 'Vacuum the whole house' },
  { key: 'passer_la_serpilliere', famille: 'menage', emoji: '🪣', points: 18, needsLicense: false, fr: 'Passer la serpillière', en: 'Mop the floors' },
  { key: 'nettoyer_les_vitres', famille: 'menage', emoji: '🪟', points: 18, needsLicense: false, fr: 'Nettoyer les vitres', en: 'Clean the windows' },
  { key: 'nettoyer_le_frigo', famille: 'menage', emoji: '🧊', points: 16, needsLicense: false, fr: 'Nettoyer le frigo', en: 'Clean the fridge' },
  { key: 'faire_la_poussiere', famille: 'menage', emoji: '🪶', points: 11, needsLicense: false, fr: 'Faire la poussière', en: 'Dust' },
  { key: 'ranger_les_affaires_que', famille: 'menage', emoji: '🧦', points: 11, needsLicense: false, fr: 'Ranger les affaires que les autres ont laissées', en: 'Tidy up what everyone else left lying around' },
  { key: 'ranger_le_cellier_et', famille: 'menage', emoji: '🗄️', points: 11, needsLicense: false, fr: 'Ranger le cellier et la réserve', en: 'Tidy the pantry' },
  { key: 'balayer_la_terrasse', famille: 'menage', emoji: '🍂', points: 10, needsLicense: false, fr: 'Balayer la terrasse', en: 'Sweep the terrace' },
  { key: 'rentrer_et_ranger_les', famille: 'menage', emoji: '🩴', points: 10, needsLicense: false, fr: 'Rentrer et ranger les affaires de plage', en: 'Bring in and put away the beach things' },
  { key: 'passer_le_balai_dans', famille: 'menage', emoji: '🧹', points: 9, needsLicense: false, fr: 'Passer le balai dans la pièce de vie', en: 'Sweep the living room' },
  { key: 'changer_les_draps_d', famille: 'menage', emoji: '🧷', points: 9, needsLicense: false, fr: 'Changer les draps d\'une chambre', en: 'Change the sheets in a room' },
  { key: 'ranger_le_salon', famille: 'menage', emoji: '🛋️', points: 8, needsLicense: false, fr: 'Ranger le salon', en: 'Tidy the living room' },
  { key: 'aerer_et_ranger_les', famille: 'menage', emoji: '🌬️', points: 8, needsLicense: false, fr: 'Aérer et ranger les chambres communes', en: 'Air and tidy the shared rooms' },
  { key: 'nettoyer_la_table_exterieure', famille: 'menage', emoji: '🪑', points: 6, needsLicense: false, fr: 'Nettoyer la table extérieure', en: 'Clean the outdoor table' },
  { key: 'secouer_les_tapis_et', famille: 'menage', emoji: '🧶', points: 6, needsLicense: false, fr: 'Secouer les tapis et les paillassons', en: 'Shake out the rugs and doormats' },
  { key: 'faire_son_lit_et', famille: 'menage', emoji: '🛏️', points: 6, needsLicense: false, fr: 'Faire son lit et ranger sa chambre', en: 'Make your bed and tidy your room' },
  { key: 'nettoyer_l_entree_et', famille: 'menage', emoji: '👟', points: 6, needsLicense: false, fr: 'Nettoyer l\'entrée et les chaussures', en: 'Clean the hallway and the shoes' },
  // --- Salle de bain et toilettes
  { key: 'bathroom', famille: 'sdb', emoji: '🛁', points: 18, needsLicense: false, fr: 'Nettoyer la salle de bain en entier', en: 'Clean the whole bathroom' },
  { key: 'nettoyer_la_douche', famille: 'sdb', emoji: '🚿', points: 13, needsLicense: false, fr: 'Nettoyer la douche', en: 'Clean the shower' },
  { key: 'passer_un_coup_apres', famille: 'sdb', emoji: '💧', points: 11, needsLicense: false, fr: 'Passer un coup après les douches de tout le monde', en: 'Wipe down after everyone\'s showers' },
  { key: 'nettoyer_les_toilettes', famille: 'sdb', emoji: '🚽', points: 9, needsLicense: false, fr: 'Nettoyer les toilettes', en: 'Clean the toilet' },
  { key: 'deboucher_la_bonde_de', famille: 'sdb', emoji: '🪠', points: 8, needsLicense: false, fr: 'Déboucher la bonde de douche', en: 'Clear the shower drain' },
  { key: 'nettoyer_le_lavabo_et', famille: 'sdb', emoji: '🪞', points: 6, needsLicense: false, fr: 'Nettoyer le lavabo et le miroir', en: 'Clean the basin and the mirror' },
  { key: 'changer_les_serviettes', famille: 'sdb', emoji: '🧻', points: 6, needsLicense: false, fr: 'Changer les serviettes', en: 'Change the towels' },
  { key: 'remettre_du_papier_toilette', famille: 'sdb', emoji: '🧼', points: 5, needsLicense: false, fr: 'Remettre du papier toilette et du savon', en: 'Restock the toilet paper and soap' },
  // --- Linge
  { key: 'repasser', famille: 'linge', emoji: '👔', points: 14, needsLicense: false, fr: 'Repasser', en: 'Do the ironing' },
  { key: 'ramasser_et_plier_le', famille: 'linge', emoji: '🧦', points: 11, needsLicense: false, fr: 'Ramasser et plier le linge', en: 'Bring in and fold the washing' },
  { key: 'etendre_le_linge', famille: 'linge', emoji: '👕', points: 9, needsLicense: false, fr: 'Étendre le linge', en: 'Hang the washing out' },
  { key: 'laver_les_serviettes_de', famille: 'linge', emoji: '🏖️', points: 8, needsLicense: false, fr: 'Laver les serviettes de plage', en: 'Wash the beach towels' },
  { key: 'trier_le_linge_sale', famille: 'linge', emoji: '🗑️', points: 7, needsLicense: false, fr: 'Trier le linge sale commun', en: 'Sort the shared laundry' },
  { key: 'laundry', famille: 'linge', emoji: '🧺', points: 6, needsLicense: false, fr: 'Lancer une machine', en: 'Put a wash on' },
  { key: 'laver_les_torchons', famille: 'linge', emoji: '🧽', points: 6, needsLicense: false, fr: 'Laver les torchons', en: 'Wash the tea towels' },
  // --- Déchets
  { key: 'emmener_les_cartons_a', famille: 'dechets', emoji: '📦', points: 26, needsLicense: false, fr: 'Emmener les cartons à la déchetterie', en: 'Take the cardboard to the tip' },
  { key: 'descendre_le_verre_au', famille: 'dechets', emoji: '🍾', points: 11, needsLicense: false, fr: 'Descendre le verre au conteneur', en: 'Take the glass to the bottle bank' },
  { key: 'faire_le_tri_et', famille: 'dechets', emoji: '🥫', points: 10, needsLicense: false, fr: 'Faire le tri, et refaire celui des autres', en: 'Sort the recycling, and redo everyone else\'s' },
  { key: 'nettoyer_la_poubelle', famille: 'dechets', emoji: '🪰', points: 10, needsLicense: false, fr: 'Nettoyer la poubelle', en: 'Clean the bin' },
  { key: 'bins', famille: 'dechets', emoji: '🗑️', points: 6, needsLicense: false, fr: 'Sortir les poubelles', en: 'Take the bins out' },
  { key: 'changer_le_sac_poubelle', famille: 'dechets', emoji: '♻️', points: 3, needsLicense: false, fr: 'Changer le sac poubelle', en: 'Change the bin bag' },
  // --- Route et voitures
  { key: 'conduire_plus_de_3', famille: 'route', emoji: '🚐', points: 61, needsLicense: false, fr: 'Conduire plus de 3 h', en: 'Drive for over three hours' },
  { key: 'drive_long', famille: 'route', emoji: '🛣️', points: 46, needsLicense: false, fr: 'Conduire entre 1 h et 3 h', en: 'Drive for one to three hours' },
  { key: 'conduire_de_nuit', famille: 'route', emoji: '🌙', points: 42, needsLicense: false, fr: 'Conduire de nuit', en: 'Drive at night' },
  { key: 'drive_short', famille: 'route', emoji: '🚗', points: 22, needsLicense: false, fr: 'Conduire moins d\'une heure', en: 'Drive for under an hour' },
  { key: 'charger_le_coffre_pour', famille: 'route', emoji: '🧳', points: 21, needsLicense: false, fr: 'Charger le coffre pour tout le monde', en: 'Load the boot for everyone' },
  { key: 'aller_chercher_quelqu_un', famille: 'route', emoji: '🚕', points: 21, needsLicense: false, fr: 'Aller chercher quelqu\'un en voiture', en: 'Drive out to pick someone up' },
  { key: 'decharger_les_voitures', famille: 'route', emoji: '📤', points: 14, needsLicense: false, fr: 'Décharger les voitures', en: 'Unload the cars' },
  { key: 'nettoyer_l_habitacle', famille: 'route', emoji: '🧽', points: 14, needsLicense: false, fr: 'Nettoyer l\'habitacle', en: 'Clean the inside of the car' },
  { key: 'fuel', famille: 'route', emoji: '⛽', points: 9, needsLicense: false, fr: 'Faire le plein', en: 'Fill up the tank' },
  { key: 'gerer_l_essence_et', famille: 'route', emoji: '🎫', points: 8, needsLicense: false, fr: 'Gérer l\'essence et les péages pour tous', en: 'Handle the fuel and tolls for everyone' },
  // --- Organisation et charge mentale
  { key: 'trouver_le_logement_et', famille: 'organisation', emoji: '🏡', points: 42, needsLicense: false, fr: 'Trouver le logement et gérer la réservation', en: 'Find the place and handle the booking' },
  { key: 's_occuper_des_enfants', famille: 'organisation', emoji: '🧸', points: 34, needsLicense: false, fr: 'S\'occuper des enfants pendant que les autres soufflent', en: 'Watch the kids while the others get a break' },
  { key: 'gerer_un_imprevu_panne', famille: 'organisation', emoji: '🚨', points: 29, needsLicense: false, fr: 'Gérer un imprévu (panne, pluie, blessure)', en: 'Deal with something going wrong' },
  { key: 'trier_et_partager_les', famille: 'organisation', emoji: '📸', points: 19, needsLicense: false, fr: 'Trier et partager les photos du séjour', en: 'Sort and share the trip photos' },
  { key: 'faire_le_planning_des', famille: 'organisation', emoji: '📅', points: 17, needsLicense: false, fr: 'Faire le planning des repas de la semaine', en: 'Plan the week\'s meals' },
  { key: 'plan_outing', famille: 'organisation', emoji: '🎟️', points: 15, needsLicense: false, fr: 'Réserver une activité pour le groupe', en: 'Book an activity for the group' },
  { key: 'repartir_les_chambres_et', famille: 'organisation', emoji: '🗝️', points: 14, needsLicense: false, fr: 'Répartir les chambres et les lits', en: 'Sort out who sleeps where' },
  { key: 'suggest_activity', famille: 'organisation', emoji: '🗺️', points: 13, needsLicense: false, fr: 'Organiser la journée de demain', en: 'Plan tomorrow' },
  { key: 'rappeler_au_groupe_les', famille: 'organisation', emoji: '📣', points: 11, needsLicense: false, fr: 'Rappeler au groupe les tâches à faire', en: 'Remind the group what needs doing' },
  { key: 'accueillir_et_faire_visiter', famille: 'organisation', emoji: '👋', points: 11, needsLicense: false, fr: 'Accueillir et faire visiter à l\'arrivée', en: 'Welcome everyone and show them around' },
  { key: 'gerer_la_pharmacie_et', famille: 'organisation', emoji: '🩹', points: 11, needsLicense: false, fr: 'Gérer la pharmacie et les petits bobos', en: 'Look after the first aid kit and the small injuries' },
  { key: 'relancer_tout_le_monde', famille: 'organisation', emoji: '⏰', points: 10, needsLicense: false, fr: 'Relancer tout le monde pour l\'heure du départ', en: 'Chase everyone to leave on time' },
  { key: 'gerer_la_musique_et', famille: 'organisation', emoji: '🎸', points: 6, needsLicense: false, fr: 'Gérer la musique et l\'enceinte', en: 'Run the music' },
  // --- Dehors et vacances
  { key: 'porter_le_sac_commun', famille: 'dehors', emoji: '⛰️', points: 47, needsLicense: false, fr: 'Porter le sac commun pendant la rando', en: 'Carry the group\'s pack on the hike' },
  { key: 'nettoyer_la_piscine', famille: 'dehors', emoji: '🏊', points: 18, needsLicense: false, fr: 'Nettoyer la piscine', en: 'Clean the pool' },
  { key: 'sortir_le_chien', famille: 'dehors', emoji: '🐕', points: 17, needsLicense: false, fr: 'Sortir le chien', en: 'Walk the dog' },
  { key: 'preparer_le_materiel_de', famille: 'dehors', emoji: '🎒', points: 13, needsLicense: false, fr: 'Préparer le matériel de rando', en: 'Get the hiking gear ready' },
  { key: 'allumer_et_entretenir_le', famille: 'dehors', emoji: '🪵', points: 11, needsLicense: false, fr: 'Allumer et entretenir le feu', en: 'Light and keep the fire going' },
  { key: 'monter_le_parasol_et', famille: 'dehors', emoji: '⛱️', points: 10, needsLicense: false, fr: 'Monter le parasol et sortir les transats', en: 'Put up the parasol and set out the loungers' },
  { key: 'ranger_le_materiel_de', famille: 'dehors', emoji: '🏄', points: 10, needsLicense: false, fr: 'Ranger le matériel de plage en fin de journée', en: 'Pack up the beach gear at the end of the day' },
  { key: 'arroser_les_plantes', famille: 'dehors', emoji: '🪴', points: 7, needsLicense: false, fr: 'Arroser les plantes', en: 'Water the plants' },
  // --- Dehors, le reste du travail
  { key: 'greer_et_amarrer_le', famille: 'dehors_suite', emoji: '⛵', points: 23, needsLicense: false, fr: 'Gréer et amarrer le bateau', en: 'Rig and moor the boat' },
  { key: 'reserver_et_recuperer_le', famille: 'dehors_suite', emoji: '🚵', points: 23, needsLicense: false, fr: 'Réserver et récupérer le matériel loué', en: 'Book and collect the rented gear' },
  { key: 'gonfler_les_paddles_et', famille: 'dehors_suite', emoji: '🛟', points: 16, needsLicense: false, fr: 'Gonfler les paddles et le matériel', en: 'Inflate the paddleboards and the gear' },
  { key: 'nettoyer_le_barbecue_juste', famille: 'dehors_suite', emoji: '🔥', points: 16, needsLicense: false, fr: 'Nettoyer le barbecue juste après le repas', en: 'Clean the barbecue straight after the meal' },
  { key: 'rentrer_le_linge_et', famille: 'dehors_suite', emoji: '🌇', points: 7, needsLicense: false, fr: 'Rentrer le linge et les serviettes le soir', en: 'Bring in the washing and towels for the night' },
  // --- Soirée et lendemain
  { key: 'etre_le_conducteur_sobre', famille: 'soiree', emoji: '🔑', points: 61, needsLicense: false, fr: 'Être le conducteur sobre de la soirée', en: 'Be the designated driver' },
  { key: 's_occuper_de_quelqu', famille: 'soiree', emoji: '🤢', points: 29, needsLicense: false, fr: 'S\'occuper de quelqu\'un qui a trop bu', en: 'Look after someone who has had too much' },
  { key: 'preparer_le_petit_dejeuner', famille: 'soiree', emoji: '🍳', points: 17, needsLicense: false, fr: 'Préparer le petit-déjeuner du lendemain de fête', en: 'Make breakfast the morning after' },
  { key: 'ramasser_les_verres_au', famille: 'soiree', emoji: '🥂', points: 12, needsLicense: false, fr: 'Ramasser les verres au réveil', en: 'Collect the glasses in the morning' },
  { key: 'ramasser_les_megots_et', famille: 'soiree', emoji: '🚬', points: 11, needsLicense: false, fr: 'Ramasser les mégots et les déchets de la terrasse', en: 'Pick up the butts and the mess on the terrace' },
  { key: 'ranger_la_sono_et', famille: 'soiree', emoji: '🔊', points: 9, needsLicense: false, fr: 'Ranger la sono et les enceintes', en: 'Put the speakers away' },
  // --- Enfants
  { key: 'occuper_les_enfants_pendant', famille: 'enfants', emoji: '🚸', points: 31, needsLicense: false, fr: 'Occuper les enfants pendant le trajet', en: 'Keep the kids busy on the drive' },
  { key: 'surveiller_les_enfants_a', famille: 'enfants', emoji: '🏊', points: 31, needsLicense: false, fr: 'Surveiller les enfants à la piscine ou à la plage', en: 'Watch the kids at the pool or the beach' },
  { key: 'gerer_un_reveil_en', famille: 'enfants', emoji: '😴', points: 21, needsLicense: false, fr: 'Gérer un réveil en pleine nuit', en: 'Handle a wake-up in the middle of the night' },
  { key: 'coucher_les_enfants', famille: 'enfants', emoji: '🌜', points: 19, needsLicense: false, fr: 'Coucher les enfants', en: 'Put the kids to bed' },
  { key: 'donner_le_bain_aux', famille: 'enfants', emoji: '🛁', points: 16, needsLicense: false, fr: 'Donner le bain aux enfants', en: 'Bath the kids' },
  { key: 'preparer_les_repas_des', famille: 'enfants', emoji: '🍼', points: 13, needsLicense: false, fr: 'Préparer les repas des enfants', en: 'Make the kids\' meals' },
  { key: 'changer_une_couche', famille: 'enfants', emoji: '🧷', points: 6, needsLicense: false, fr: 'Changer une couche', en: 'Change a nappy' },
  // --- Animaux
  { key: 'ramasser_les_crottes_du', famille: 'animaux', emoji: '💩', points: 8, needsLicense: false, fr: 'Ramasser les crottes du chien', en: 'Pick up after the dog' },
  { key: 'nourrir_les_animaux', famille: 'animaux', emoji: '🐈', points: 6, needsLicense: false, fr: 'Nourrir les animaux', en: 'Feed the animals' },
  // --- Pannes et imprévus
  { key: 'emmener_quelqu_un_chez', famille: 'pannes', emoji: '🏥', points: 48, needsLicense: false, fr: 'Emmener quelqu\'un chez le médecin', en: 'Take someone to the doctor' },
  { key: 'reparer_ou_remplacer_quelque', famille: 'pannes', emoji: '🔧', points: 32, needsLicense: false, fr: 'Réparer ou remplacer quelque chose de cassé', en: 'Fix or replace something broken' },
  { key: 'gerer_une_panne_d', famille: 'pannes', emoji: '⚡', points: 26, needsLicense: false, fr: 'Gérer une panne d\'eau, d\'électricité ou de wifi', en: 'Deal with the water, power or wifi going out' },
  { key: 'deboucher_un_evier_ou', famille: 'pannes', emoji: '🪠', points: 20, needsLicense: false, fr: 'Déboucher un évier ou des toilettes', en: 'Unblock a sink or a toilet' },
  { key: 'prevenir_le_proprietaire_d', famille: 'pannes', emoji: '📞', points: 13, needsLicense: false, fr: 'Prévenir le propriétaire d\'une casse', en: 'Tell the owner something got broken' },
  // --- Vie du groupe (à débattre)
  { key: 'desamorcer_une_tension_entre', famille: 'groupe', emoji: '🕊️', points: 24, needsLicense: false, fr: 'Désamorcer une tension entre deux personnes', en: 'Defuse a row between two people' },
  { key: 'ecouter_quelqu_un_qui', famille: 'groupe', emoji: '👂', points: 22, needsLicense: false, fr: 'Écouter quelqu\'un qui ne va pas', en: 'Listen to someone who is struggling' },
  { key: 'host_game', famille: 'groupe', emoji: '🎲', points: 20, needsLicense: false, fr: 'Organiser un jeu pour tout le monde', en: 'Get a game going for everyone' },
  { key: 'aller_chercher_celui_qui', famille: 'groupe', emoji: '🫂', points: 19, needsLicense: false, fr: 'Aller chercher celui qui reste dans son coin', en: 'Draw in whoever is keeping to themselves' },
  { key: 'prendre_les_photos_du', famille: 'groupe', emoji: '📷', points: 11, needsLicense: false, fr: 'Prendre les photos du groupe', en: 'Take the group photos' },
  { key: 'faire_les_comptes_du', famille: 'groupe', emoji: '🧾', points: 11, needsLicense: false, fr: 'Faire les comptes du restaurant à table', en: 'Split the restaurant bill at the table' },
]

export const EMOJI_CHOICES = [
  '🍲', '🛒', '🚗', '🧹', '🚿', '🍽️', '🗺️', '🧺', '🧽', '🥐',
  '🎲', '🍴', '🧾', '🌀', '🗑️', '🪑', '⛽', '💡', '🥖', '🏊',
  '🔥', '🎸', '📸', '🧊', '☕', '🐕', '🛶', '🎯',
]

/**
 * Les emojis proposes pour un groupe : des lieux et des occasions, pas des
 * taches. Un groupe se reconnait a l'endroit ou l'on va, ou a ce qu'on y fait.
 */
export const GROUP_EMOJIS = [
  '🏝️', '⛰️', '🏖️', '🏡', '🏕️', '⛵', '🎿', '🌴',
  '🏙️', '✈️', '🚌', '🚗', '🎪', '🎉', '🍻', '🍝',
  '❤️', '🔥', '🎸', '🎮', '🐕', '☀️', '❄️', '🌈',
]
