# -*- coding: utf-8 -*-
"""
Ecrit src/lib/catalog.ts a partir du bareme calcule par bareme.py.

    python3 scripts/bareme.py && python3 scripts/gen_catalog.py

Les entrees de cloture sortent dans scripts/closing_entries.txt, a recopier
dans src/lib/closing.ts.
"""
import json, re, unicodedata

rows = json.load(open('scripts/bareme.json'))

EN = {
 # Arrivée et installation
 "Faire tous les lits à l'arrivée": "Make every bed on arrival",
 "Monter les valises de tout le monde": "Carry everyone's bags up",
 "Faire les courses d'arrivée": "Do the first grocery run",
 "Comprendre et expliquer les équipements de la maison": "Work out the house and explain it to everyone",
 "Repérer les commerces et leurs horaires": "Find the local shops and their hours",
 # Cuisine et repas
 "Préparer le petit-déjeuner": "Make breakfast",
 "Préparer les cafés du matin": "Make the morning coffees",
 "Aller chercher le pain": "Go get the bread",
 "Préparer un déjeuner simple": "Put together a simple lunch",
 "Cuisiner un vrai repas du soir": "Cook a proper dinner",
 "Cuisiner pour une grande tablée": "Cook for a big table",
 "Faire le barbecue": "Run the barbecue",
 "Préparer l'apéro": "Put out the drinks and snacks",
 "Préparer un dessert": "Make a dessert",
 "Éplucher et couper les légumes": "Peel and chop the vegetables",
 "Préparer le pique-nique de la journée": "Pack the day's picnic",
 "Faire les sandwichs de la rando": "Make the sandwiches for the hike",
 "Mettre la table": "Set the table",
 "Débarrasser la table": "Clear the table",
 "Ranger les courses en arrivant": "Put the shopping away",
 "Surveiller la cuisson pendant que les autres sont dehors": "Watch the pot while everyone else is outside",
 "Sortir la viande à décongeler à temps": "Take the meat out to defrost in time",
 "Gérer les allergies et les régimes de chacun": "Keep track of everyone's allergies and diets",
 "Remplir la glacière et faire les glaçons": "Fill the cooler and make the ice",
 "Préparer le goûter": "Make the afternoon snack",
 # Cuisine, le reste
 "Gérer deux services de petit-déjeuner": "Run two breakfast sittings",
 "Cuisiner un plat en plus pour les régimes particuliers": "Cook an extra dish for special diets",
 "Utiliser les restes pour ne rien jeter": "Use up the leftovers so nothing is wasted",
 "Préparer les provisions de la journée en mer ou en rando": "Pack the supplies for a day out",
 "Faire le café pour ceux qui se lèvent tard": "Make coffee for the late risers",
 # Vaisselle
 "Faire la vaisselle du soir à la main": "Wash up after dinner by hand",
 "Faire la vaisselle du midi": "Wash up after lunch",
 "Remplir et lancer le lave-vaisselle": "Load and start the dishwasher",
 "Vider le lave-vaisselle": "Empty the dishwasher",
 "Récurer les casseroles et le plat du four": "Scrub the pans and the roasting dish",
 "Laver les verres à la main": "Wash the glasses by hand",
 "Nettoyer le plan de travail et l'évier": "Clean the worktop and the sink",
 "Nettoyer la plaque de cuisson": "Clean the hob",
 "Nettoyer le four": "Clean the oven",
 "Ranger la cuisine après le repas": "Tidy the kitchen after the meal",
 # Courses
 "Faire les grandes courses de la semaine": "Do the big weekly shop",
 "Faire la liste de courses": "Write the shopping list",
 "Aller au marché": "Go to the market",
 "Repartir chercher un oubli": "Drive back out for something forgotten",
 "Porter et monter les courses": "Carry the shopping in",
 "Surveiller les stocks (papier, sacs, éponges)": "Keep an eye on supplies (paper, bags, sponges)",
 "Avancer l'argent pour le groupe": "Front the money for the group",
 "Tenir les comptes du séjour": "Keep the trip accounts",
 "Aller chercher le gaz, les bûches ou la glace": "Fetch gas, firewood or ice",
 "Réserver le restaurant pour tout le monde": "Book the restaurant for everyone",
 "Gérer les boissons et la cave": "Look after the drinks",
 "Acheter les viennoiseries pour tous": "Buy pastries for everyone",
 # Ménage
 "Passer le balai dans la pièce de vie": "Sweep the living room",
 "Passer l'aspirateur dans toute la maison": "Vacuum the whole house",
 "Passer la serpillière": "Mop the floors",
 "Ranger le salon": "Tidy the living room",
 "Faire la poussière": "Dust",
 "Nettoyer les vitres": "Clean the windows",
 "Nettoyer la table extérieure": "Clean the outdoor table",
 "Secouer les tapis et les paillassons": "Shake out the rugs and doormats",
 "Ranger les affaires que les autres ont laissées": "Tidy up what everyone else left lying around",
 "Faire son lit et ranger sa chambre": "Make your bed and tidy your room",
 "Changer les draps d'une chambre": "Change the sheets in a room",
 "Aérer et ranger les chambres communes": "Air and tidy the shared rooms",
 "Nettoyer l'entrée et les chaussures": "Clean the hallway and the shoes",
 "Nettoyer le frigo": "Clean the fridge",
 "Ranger le cellier et la réserve": "Tidy the pantry",
 "Balayer la terrasse": "Sweep the terrace",
 "Nettoyer après la soirée": "Clean up after the party",
 "Rentrer et ranger les affaires de plage": "Bring in and put away the beach things",
 # Salle de bain
 "Nettoyer les toilettes": "Clean the toilet",
 "Nettoyer la salle de bain en entier": "Clean the whole bathroom",
 "Nettoyer la douche": "Clean the shower",
 "Déboucher la bonde de douche": "Clear the shower drain",
 "Nettoyer le lavabo et le miroir": "Clean the basin and the mirror",
 "Passer un coup après les douches de tout le monde": "Wipe down after everyone's showers",
 "Changer les serviettes": "Change the towels",
 "Remettre du papier toilette et du savon": "Restock the toilet paper and soap",
 # Linge
 "Lancer une machine": "Put a wash on",
 "Étendre le linge": "Hang the washing out",
 "Ramasser et plier le linge": "Bring in and fold the washing",
 "Laver les serviettes de plage": "Wash the beach towels",
 "Laver les torchons": "Wash the tea towels",
 "Repasser": "Do the ironing",
 "Trier le linge sale commun": "Sort the shared laundry",
 # Déchets
 "Sortir les poubelles": "Take the bins out",
 "Changer le sac poubelle": "Change the bin bag",
 "Descendre le verre au conteneur": "Take the glass to the bottle bank",
 "Faire le tri, et refaire celui des autres": "Sort the recycling, and redo everyone else's",
 "Nettoyer la poubelle": "Clean the bin",
 "Emmener les cartons à la déchetterie": "Take the cardboard to the tip",
 # Route
 "Conduire moins d'une heure": "Drive for under an hour",
 "Conduire entre 1 h et 3 h": "Drive for one to three hours",
 "Conduire plus de 3 h": "Drive for over three hours",
 "Conduire de nuit": "Drive at night",
 "Faire le plein": "Fill up the tank",
 "Charger le coffre pour tout le monde": "Load the boot for everyone",
 "Décharger les voitures": "Unload the cars",
 "Nettoyer l'habitacle": "Clean the inside of the car",
 "Aller chercher quelqu'un en voiture": "Drive out to pick someone up",
 "Gérer l'essence et les péages pour tous": "Handle the fuel and tolls for everyone",
 # Organisation
 "Organiser la journée de demain": "Plan tomorrow",
 "Réserver une activité pour le groupe": "Book an activity for the group",
 "Trouver le logement et gérer la réservation": "Find the place and handle the booking",
 "Faire le planning des repas de la semaine": "Plan the week's meals",
 "Relancer tout le monde pour l'heure du départ": "Chase everyone to leave on time",
 "Rappeler au groupe les tâches à faire": "Remind the group what needs doing",
 "Gérer un imprévu (panne, pluie, blessure)": "Deal with something going wrong",
 "Répartir les chambres et les lits": "Sort out who sleeps where",
 "Accueillir et faire visiter à l'arrivée": "Welcome everyone and show them around",
 "Gérer la pharmacie et les petits bobos": "Look after the first aid kit and the small injuries",
 "S'occuper des enfants pendant que les autres soufflent": "Watch the kids while the others get a break",
 "Gérer la musique et l'enceinte": "Run the music",
 "Trier et partager les photos du séjour": "Sort and share the trip photos",
 # Dehors
 "Monter le parasol et sortir les transats": "Put up the parasol and set out the loungers",
 "Nettoyer la piscine": "Clean the pool",
 "Allumer et entretenir le feu": "Light and keep the fire going",
 "Préparer le matériel de rando": "Get the hiking gear ready",
 "Porter le sac commun pendant la rando": "Carry the group's pack on the hike",
 "Sortir le chien": "Walk the dog",
 "Arroser les plantes": "Water the plants",
 "Ranger le matériel de plage en fin de journée": "Pack up the beach gear at the end of the day",
 "Gréer et amarrer le bateau": "Rig and moor the boat",
 "Gonfler les paddles et le matériel": "Inflate the paddleboards and the gear",
 "Nettoyer le barbecue juste après le repas": "Clean the barbecue straight after the meal",
 "Rentrer le linge et les serviettes le soir": "Bring in the washing and towels for the night",
 "Réserver et récupérer le matériel loué": "Book and collect the rented gear",
 # Soirée
 "Être le conducteur sobre de la soirée": "Be the designated driver",
 "S'occuper de quelqu'un qui a trop bu": "Look after someone who has had too much",
 "Ramasser les verres au réveil": "Collect the glasses in the morning",
 "Préparer le petit-déjeuner du lendemain de fête": "Make breakfast the morning after",
 "Ranger la sono et les enceintes": "Put the speakers away",
 "Ramasser les mégots et les déchets de la terrasse": "Pick up the butts and the mess on the terrace",
 # Enfants
 "Occuper les enfants pendant le trajet": "Keep the kids busy on the drive",
 "Surveiller les enfants à la piscine ou à la plage": "Watch the kids at the pool or the beach",
 "Coucher les enfants": "Put the kids to bed",
 "Gérer un réveil en pleine nuit": "Handle a wake-up in the middle of the night",
 "Donner le bain aux enfants": "Bath the kids",
 "Préparer les repas des enfants": "Make the kids' meals",
 "Changer une couche": "Change a nappy",
 # Animaux
 "Nourrir les animaux": "Feed the animals",
 "Ramasser les crottes du chien": "Pick up after the dog",
 # Pannes
 "Déboucher un évier ou des toilettes": "Unblock a sink or a toilet",
 "Réparer ou remplacer quelque chose de cassé": "Fix or replace something broken",
 "Gérer une panne d'eau, d'électricité ou de wifi": "Deal with the water, power or wifi going out",
 "Emmener quelqu'un chez le médecin": "Take someone to the doctor",
 "Prévenir le propriétaire d'une casse": "Tell the owner something got broken",
 # Vie du groupe
 "Désamorcer une tension entre deux personnes": "Defuse a row between two people",
 "Écouter quelqu'un qui ne va pas": "Listen to someone who is struggling",
 "Aller chercher celui qui reste dans son coin": "Draw in whoever is keeping to themselves",
 "Organiser un jeu pour tout le monde": "Get a game going for everyone",
 "Prendre les photos du groupe": "Take the group photos",
 "Faire les comptes du restaurant à table": "Split the restaurant bill at the table",
 # Clôture
 "Grand ménage de la maison": "Deep clean the house",
 "Passer l'aspirateur partout": "Vacuum everywhere",
 "Nettoyer toutes les salles de bain": "Clean every bathroom",
 "Vider et nettoyer le frigo": "Empty and clean the fridge",
 "Sortir toutes les poubelles et le verre": "Take out all the bins and the glass",
 "Défaire tous les lits et regrouper le linge": "Strip every bed and gather the linen",
 "Nettoyer le barbecue et la plancha": "Clean the barbecue and the griddle",
 "Charger les voitures pour le retour": "Load the cars for the trip home",
 "Faire l'état des lieux avec le propriétaire": "Do the check-out with the owner",
 "Rendre les clés et attendre le propriétaire": "Hand back the keys and wait for the owner",
 "Solder les comptes du séjour": "Settle up the trip accounts",
 "Rendre à chacun ce qu'il a oublié": "Get everyone back what they left behind",
}

# Les cles d'origine survivent : les taches deja enregistrees gardent leur
# libelle traduit, et le jeu de demonstration continue de tourner.
LEGACY = {
 "Cuisiner un vrai repas du soir": "cook_meal",
 "Faire les grandes courses de la semaine": "big_groceries",
 "Conduire entre 1 h et 3 h": "drive_long",
 "Grand ménage de la maison": "deep_clean",
 "Nettoyer la salle de bain en entier": "bathroom",
 "Faire la vaisselle du soir à la main": "dishes_dinner",
 "Réserver une activité pour le groupe": "plan_outing",
 "Lancer une machine": "laundry",
 "Ranger la cuisine après le repas": "tidy_kitchen",
 "Conduire moins d'une heure": "drive_short",
 "Préparer le petit-déjeuner": "breakfast",
 "Organiser un jeu pour tout le monde": "host_game",
 "Faire la vaisselle du midi": "dishes_lunch",
 "Repartir chercher un oubli": "small_groceries",
 "Passer l'aspirateur dans toute la maison": "vacuum",
 "Sortir les poubelles": "bins",
 "Mettre la table": "table",
 "Faire le plein": "fuel",
 "Organiser la journée de demain": "suggest_activity",
 "Aller chercher le pain": "bread",
 "Vider et nettoyer le frigo": "empty_fridge",
 "Rendre les clés et attendre le propriétaire": "hand_keys",
}

FAMILLE_ID = {
 "Arrivée et installation": "arrivee",
 "Cuisine et repas": "cuisine",
 "Cuisine, le reste du travail": "cuisine_suite",
 "Vaisselle et cuisine à nettoyer": "vaisselle",
 "Courses et intendance": "courses",
 "Ménage": "menage",
 "Salle de bain et toilettes": "sdb",
 "Linge": "linge",
 "Déchets": "dechets",
 "Route et voitures": "route",
 "Organisation et charge mentale": "organisation",
 "Dehors et vacances": "dehors",
 "Dehors, le reste du travail": "dehors_suite",
 "Soirée et lendemain": "soiree",
 "Enfants": "enfants",
 "Animaux": "animaux",
 "Pannes et imprévus": "pannes",
 "Vie du groupe (à débattre)": "groupe",
 "Tâches de clôture (dernier jour)": "cloture",
}

FAMILLE_EN = {
 "Arrivée et installation": "Arriving and settling in",
 "Cuisine et repas": "Cooking and meals",
 "Cuisine, le reste du travail": "Cooking, the rest of the work",
 "Vaisselle et cuisine à nettoyer": "Washing up",
 "Courses et intendance": "Shopping and supplies",
 "Ménage": "Cleaning",
 "Salle de bain et toilettes": "Bathroom and toilets",
 "Linge": "Laundry",
 "Déchets": "Bins and recycling",
 "Route et voitures": "Driving",
 "Organisation et charge mentale": "Organising and mental load",
 "Dehors et vacances": "Outdoors",
 "Dehors, le reste du travail": "Outdoors, the rest of the work",
 "Soirée et lendemain": "The night out and the morning after",
 "Enfants": "Kids",
 "Animaux": "Pets",
 "Pannes et imprévus": "Things going wrong",
 "Vie du groupe (à débattre)": "Keeping the group together",
 "Tâches de clôture (dernier jour)": "Last day",
}

def slug(text):
    t = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode()
    t = re.sub(r"[^a-zA-Z0-9]+", "_", t).strip("_").lower()
    return "_".join(t.split("_")[:4])

vus = set()
def cle(nom):
    if nom in LEGACY:
        k = LEGACY[nom]
    else:
        k = slug(nom)
    base, n = k, 2
    while k in vus:
        k, n = f"{base}{n}", n + 1
    vus.add(k)
    return k

manquants = [r["nom"] for r in rows if r["nom"] not in EN]
if manquants:
    raise SystemExit("Traductions manquantes :\n  " + "\n  ".join(manquants))

def esc(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")

courant = [r for r in rows if r["famille"] != "Tâches de clôture (dernier jour)"]
cloture = [r for r in rows if r["famille"] == "Tâches de clôture (dernier jour)"]

ORDRE = [f for f in FAMILLE_ID if f != "Tâches de clôture (dernier jour)"]

def ligne(r):
    return ("  { key: '%s', famille: '%s', emoji: '%s', points: %d, needsLicense: false, fr: '%s', en: '%s' },"
            % (cle(r["nom"]), FAMILLE_ID[r["famille"]], r["emoji"], r["points"], esc(r["nom"]), esc(EN[r["nom"]])))

blocs = []
for famille in ORDRE:
    taches = [r for r in courant if r["famille"] == famille]
    if not taches:
        continue
    taches.sort(key=lambda r: -r["points"])
    blocs.append("  // --- %s\n%s" % (famille, "\n".join(ligne(r) for r in taches)))

familles_ts = "\n".join(
    "  { id: '%s', fr: '%s', en: '%s' }," % (FAMILLE_ID[f], esc(f), esc(FAMILLE_EN[f]))
    for f in ORDRE if any(r["famille"] == f for r in courant)
)

entete = '''/**
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
%s
]

export const CATALOG: CatalogEntry[] = [
%s
]
''' % (familles_ts, "\n".join(blocs))

emojis = '''
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
'''

open('src/lib/catalog.ts', 'w').write(entete + emojis)

cloture.sort(key=lambda r: -r["points"])
lignes_cloture = "\n".join(
    "  { key: '%s', emoji: '%s', points: %d, needsLicense: false, fr: '%s', en: '%s' },"
    % (cle(r["nom"]), r["emoji"], r["points"], esc(r["nom"]), esc(EN[r["nom"]]))
    for r in cloture)
open('scripts/closing_entries.txt', 'w').write(lignes_cloture)

print(f"{len(courant)} tâches courantes, {len(cloture)} de clôture")
