# -*- coding: utf-8 -*-
"""
Bareme de points de Trip Duty.

Chaque tache est decrite par quatre mesures, pas par une intuition :

  duree   minutes, pour un groupe de reference de 8 personnes
  met     cout physique, valeur du Compendium of Physical Activities
  corvee  0 neutre, 1 peu aimee, 2 detestee, 3 redoutee (sondages YouGov / Cinch)
  tete    charge mentale, d'apres les quatre operations de Daminger 2019 :
          0 on execute, 1 il faut planifier, 2 il faut anticiper ET surveiller

points = 1.1 * duree ** 0.73 * kPhysique * kCorvee * kTete

L'exposant 0.73 dit qu'une tache longue vaut plus, mais pas proportionnellement :
deux heures de menage ne valent pas quatre fois trente minutes, on est deja lance.
Il est choisi pour que l'echelle aille de 3 (changer un sac poubelle) a 60
(quatre heures de route), soit un rapport de 20 pour un rapport de duree de 60.
"""
import json

def k_phys(met):
    if met <= 2.5: return 1.00
    if met <= 3.4: return 1.10
    if met <= 4.9: return 1.25
    return 1.45

K_CORVEE = {0: 1.00, 1: 1.10, 2: 1.25, 3: 1.40}
K_TETE = {0: 1.00, 1: 1.15, 2: 1.30}

PLAFOND_MINUTES = 150

def points(duree, met, corvee, tete):
    # Au-dela de 2 h 30 sur une meme tache, la valeur cesse de monter : c'est
    # une seule tache, et le partage entre beneficiaires fait deja son travail.
    effort = 1.1 * min(duree, PLAFOND_MINUTES) ** 0.73
    return round(effort * k_phys(met) * K_CORVEE[corvee] * K_TETE[tete])

# (nom, emoji, duree, met, corvee, tete)
FAMILLES = {
"Cuisine et repas": [
 ("Préparer le petit-déjeuner", "🥐", 25, 2.0, 0, 0),
 ("Préparer les cafés du matin", "☕", 10, 2.0, 0, 0),
 ("Aller chercher le pain", "🥖", 15, 2.3, 0, 0),
 ("Préparer un déjeuner simple", "🥗", 35, 2.0, 0, 0),
 ("Cuisiner un vrai repas du soir", "🍲", 75, 2.5, 0, 1),
 ("Cuisiner pour une grande tablée", "🍝", 100, 2.5, 0, 1),
 ("Faire le barbecue", "🔥", 60, 3.0, 0, 0),
 ("Préparer l'apéro", "🍻", 20, 2.0, 0, 0),
 ("Préparer un dessert", "🍰", 40, 2.0, 0, 0),
 ("Éplucher et couper les légumes", "🔪", 20, 2.0, 0, 0),
 ("Préparer le pique-nique de la journée", "🧺", 30, 2.5, 0, 1),
 ("Faire les sandwichs de la rando", "🥪", 20, 2.0, 0, 0),
 ("Mettre la table", "🍽️", 8, 2.0, 0, 0),
 ("Débarrasser la table", "🧽", 10, 2.5, 0, 0),
 ("Ranger les courses en arrivant", "🛍️", 15, 2.5, 0, 0),
 ("Surveiller la cuisson pendant que les autres sont dehors", "⏲️", 30, 2.0, 1, 0),
 ("Sortir la viande à décongeler à temps", "🥩", 5, 2.0, 0, 2),
 ("Gérer les allergies et les régimes de chacun", "🌾", 15, 2.0, 0, 2),
 ("Remplir la glacière et faire les glaçons", "🧊", 10, 2.5, 0, 1),
 ("Préparer le goûter", "🍪", 10, 2.0, 0, 0),
],
"Vaisselle et cuisine à nettoyer": [
 ("Faire la vaisselle du soir à la main", "🧼", 40, 2.3, 1, 0),
 ("Faire la vaisselle du midi", "🍴", 20, 2.3, 1, 0),
 ("Remplir et lancer le lave-vaisselle", "🫧", 10, 2.3, 0, 0),
 ("Vider le lave-vaisselle", "🥣", 8, 2.3, 1, 0),
 ("Récurer les casseroles et le plat du four", "🍳", 20, 2.5, 2, 0),
 ("Laver les verres à la main", "🥂", 12, 2.3, 1, 0),
 ("Nettoyer le plan de travail et l'évier", "🧴", 12, 3.0, 0, 0),
 ("Nettoyer la plaque de cuisson", "♨️", 15, 3.0, 1, 0),
 ("Nettoyer le four", "🔥", 35, 3.0, 2, 0),
 ("Ranger la cuisine après le repas", "🧹", 20, 3.0, 1, 0),
],
"Courses et intendance": [
 ("Faire les grandes courses de la semaine", "🛒", 90, 2.3, 0, 2),
 ("Faire la liste de courses", "📝", 15, 1.5, 0, 2),
 ("Aller au marché", "🥬", 60, 2.3, 0, 1),
 ("Repartir chercher un oubli", "🚙", 25, 2.3, 1, 0),
 ("Porter et monter les courses", "📦", 15, 3.5, 0, 0),
 ("Surveiller les stocks (papier, sacs, éponges)", "🧻", 10, 2.0, 0, 2),
 ("Avancer l'argent pour le groupe", "💶", 5, 1.5, 0, 1),
 ("Tenir les comptes du séjour", "🧮", 20, 1.5, 1, 2),
 ("Aller chercher le gaz, les bûches ou la glace", "⛽", 30, 3.5, 0, 1),
 ("Réserver le restaurant pour tout le monde", "📞", 15, 1.5, 0, 2),
 ("Gérer les boissons et la cave", "🍷", 15, 2.5, 0, 1),
 ("Acheter les viennoiseries pour tous", "🥐", 20, 2.3, 0, 0),
],
"Ménage": [
 ("Passer le balai dans la pièce de vie", "🧹", 15, 3.3, 0, 0),
 ("Passer l'aspirateur dans toute la maison", "🌀", 40, 3.5, 1, 0),
 ("Passer la serpillière", "🪣", 30, 3.5, 1, 0),
 ("Ranger le salon", "🛋️", 15, 2.5, 0, 0),
 ("Faire la poussière", "🪶", 20, 2.5, 1, 0),
 ("Nettoyer les vitres", "🪟", 35, 3.0, 1, 0),
 ("Nettoyer la table extérieure", "🪑", 10, 3.0, 0, 0),
 ("Secouer les tapis et les paillassons", "🧶", 10, 3.0, 0, 0),
 ("Ranger les affaires que les autres ont laissées", "🧦", 15, 2.5, 2, 1),
 ("Faire son lit et ranger sa chambre", "🛏️", 10, 2.0, 0, 0),
 ("Changer les draps d'une chambre", "🧷", 15, 2.0, 1, 0),
 ("Aérer et ranger les chambres communes", "🌬️", 15, 2.5, 0, 0),
 ("Nettoyer l'entrée et les chaussures", "👟", 10, 3.0, 0, 0),
 ("Nettoyer le frigo", "🧊", 25, 3.0, 2, 0),
 ("Ranger le cellier et la réserve", "🗄️", 20, 3.0, 0, 0),
 ("Balayer la terrasse", "🍂", 15, 4.0, 0, 0),
 ("Nettoyer après la soirée", "🎉", 45, 3.0, 2, 0),
 ("Rentrer et ranger les affaires de plage", "🩴", 15, 3.0, 1, 0),
],
"Salle de bain et toilettes": [
 ("Nettoyer les toilettes", "🚽", 12, 2.5, 3, 0),
 ("Nettoyer la salle de bain en entier", "🛁", 30, 3.2, 2, 0),
 ("Nettoyer la douche", "🚿", 20, 3.2, 2, 0),
 ("Déboucher la bonde de douche", "🪠", 10, 2.5, 3, 0),
 ("Nettoyer le lavabo et le miroir", "🪞", 10, 2.5, 1, 0),
 ("Passer un coup après les douches de tout le monde", "💧", 15, 3.2, 2, 0),
 ("Changer les serviettes", "🧻", 8, 1.5, 0, 1),
 ("Remettre du papier toilette et du savon", "🧼", 5, 2.0, 0, 2),
],
"Linge": [
 ("Lancer une machine", "🧺", 8, 1.5, 0, 1),
 ("Étendre le linge", "👕", 15, 1.5, 1, 0),
 ("Ramasser et plier le linge", "🧦", 20, 1.5, 1, 0),
 ("Laver les serviettes de plage", "🏖️", 12, 2.0, 0, 1),
 ("Laver les torchons", "🧽", 8, 2.0, 1, 0),
 ("Repasser", "👔", 25, 2.3, 2, 0),
 ("Trier le linge sale commun", "🗑️", 10, 2.0, 1, 1),
],
"Déchets": [
 ("Sortir les poubelles", "🗑️", 6, 3.0, 2, 0),
 ("Changer le sac poubelle", "♻️", 4, 2.5, 1, 0),
 ("Descendre le verre au conteneur", "🍾", 15, 3.5, 1, 0),
 ("Faire le tri, et refaire celui des autres", "🥫", 12, 2.5, 2, 1),
 ("Nettoyer la poubelle", "🪰", 12, 3.0, 3, 0),
 ("Emmener les cartons à la déchetterie", "📦", 40, 3.5, 1, 1),
],
"Route et voitures": [
 ("Conduire moins d'une heure", "🚗", 45, 2.0, 1, 1),
 ("Conduire entre 1 h et 3 h", "🛣️", 120, 2.0, 1, 1),
 ("Conduire plus de 3 h", "🚐", 240, 2.0, 1, 2),
 ("Conduire de nuit", "🌙", 90, 2.0, 2, 1),
 ("Faire le plein", "⛽", 15, 2.5, 0, 1),
 ("Charger le coffre pour tout le monde", "🧳", 25, 6.0, 1, 1),
 ("Décharger les voitures", "📤", 20, 6.0, 0, 0),
 ("Nettoyer l'habitacle", "🧽", 25, 3.0, 1, 0),
 ("Aller chercher quelqu'un en voiture", "🚕", 40, 2.0, 1, 1),
 ("Gérer l'essence et les péages pour tous", "🎫", 10, 1.5, 0, 2),
],
"Organisation et charge mentale": [
 ("Organiser la journée de demain", "🗺️", 20, 1.5, 0, 2),
 ("Réserver une activité pour le groupe", "🎟️", 25, 1.5, 0, 2),
 ("Trouver le logement et gérer la réservation", "🏡", 90, 1.5, 1, 2),
 ("Faire le planning des repas de la semaine", "📅", 30, 1.5, 0, 2),
 ("Relancer tout le monde pour l'heure du départ", "⏰", 10, 1.5, 2, 2),
 ("Rappeler au groupe les tâches à faire", "📣", 10, 1.5, 3, 2),
 ("Gérer un imprévu (panne, pluie, blessure)", "🚨", 45, 2.0, 2, 2),
 ("Répartir les chambres et les lits", "🗝️", 20, 2.0, 1, 2),
 ("Accueillir et faire visiter à l'arrivée", "👋", 20, 2.0, 0, 1),
 ("Gérer la pharmacie et les petits bobos", "🩹", 15, 2.0, 1, 2),
 ("S'occuper des enfants pendant que les autres soufflent", "🧸", 60, 3.0, 1, 2),
 ("Gérer la musique et l'enceinte", "🎸", 10, 1.5, 0, 0),
 ("Trier et partager les photos du séjour", "📸", 40, 1.5, 0, 1),
],
"Dehors et vacances": [
 ("Monter le parasol et sortir les transats", "⛱️", 15, 3.5, 0, 0),
 ("Nettoyer la piscine", "🏊", 25, 3.5, 1, 1),
 ("Allumer et entretenir le feu", "🪵", 20, 3.0, 0, 0),
 ("Préparer le matériel de rando", "🎒", 25, 2.5, 0, 1),
 ("Porter le sac commun pendant la rando", "⛰️", 90, 7.0, 1, 0),
 ("Sortir le chien", "🐕", 30, 3.0, 0, 1),
 ("Arroser les plantes", "🪴", 10, 2.5, 0, 1),
 ("Ranger le matériel de plage en fin de journée", "🏄", 15, 3.0, 1, 0),
],
"Tâches de clôture (dernier jour)": [
 ("Grand ménage de la maison", "🧹", 120, 3.0, 2, 1),
 ("Passer l'aspirateur partout", "🌀", 60, 3.5, 1, 0),
 ("Nettoyer toutes les salles de bain", "🛁", 60, 3.2, 2, 0),
 ("Vider et nettoyer le frigo", "🧊", 40, 3.0, 2, 1),
 ("Sortir toutes les poubelles et le verre", "🗑️", 30, 3.5, 2, 0),
 ("Défaire tous les lits et regrouper le linge", "🛏️", 35, 2.0, 1, 0),
 ("Nettoyer le barbecue et la plancha", "🔥", 30, 3.0, 3, 0),
 ("Charger les voitures pour le retour", "🧳", 40, 6.0, 1, 1),
 ("Faire l'état des lieux avec le propriétaire", "📋", 30, 1.5, 1, 2),
 ("Rendre les clés et attendre le propriétaire", "🗝️", 30, 1.5, 2, 1),
 ("Solder les comptes du séjour", "🧮", 30, 1.5, 1, 2),
 ("Rendre à chacun ce qu'il a oublié", "🎒", 20, 2.0, 1, 2),
],
"Arrivée et installation": [
 ("Faire tous les lits à l'arrivée", "🛏️", 40, 2.0, 1, 0),
 ("Monter les valises de tout le monde", "🧳", 25, 6.0, 1, 0),
 ("Faire les courses d'arrivée", "🛒", 60, 2.3, 0, 2),
 ("Comprendre et expliquer les équipements de la maison", "🔌", 30, 1.5, 1, 2),
 ("Repérer les commerces et leurs horaires", "🗺️", 20, 1.5, 0, 2),
],
"Enfants": [
 ("Occuper les enfants pendant le trajet", "🚸", 60, 2.0, 2, 1),
 ("Surveiller les enfants à la piscine ou à la plage", "🏊", 60, 2.0, 1, 2),
 ("Coucher les enfants", "🌜", 30, 2.0, 2, 1),
 ("Gérer un réveil en pleine nuit", "😴", 30, 2.0, 3, 1),
 ("Donner le bain aux enfants", "🛁", 25, 3.0, 1, 1),
 ("Préparer les repas des enfants", "🍼", 25, 2.0, 0, 1),
 ("Changer une couche", "🧷", 6, 2.5, 3, 0),
],
"Animaux": [
 ("Nourrir les animaux", "🐈", 8, 2.0, 0, 1),
 ("Ramasser les crottes du chien", "💩", 8, 3.0, 3, 0),
],
"Soirée et lendemain": [
 ("Être le conducteur sobre de la soirée", "🔑", 180, 2.0, 2, 1),
 ("S'occuper de quelqu'un qui a trop bu", "🤢", 45, 2.5, 3, 1),
 ("Ramasser les verres au réveil", "🥂", 20, 2.5, 2, 0),
 ("Préparer le petit-déjeuner du lendemain de fête", "🍳", 30, 2.0, 1, 1),
 ("Ranger la sono et les enceintes", "🔊", 15, 3.0, 0, 0),
 ("Ramasser les mégots et les déchets de la terrasse", "🚬", 15, 3.0, 2, 0),
],
"Pannes et imprévus": [
 ("Déboucher un évier ou des toilettes", "🪠", 25, 3.0, 3, 1),
 ("Réparer ou remplacer quelque chose de cassé", "🔧", 45, 3.0, 2, 2),
 ("Gérer une panne d'eau, d'électricité ou de wifi", "⚡", 40, 2.0, 2, 2),
 ("Emmener quelqu'un chez le médecin", "🏥", 90, 2.0, 2, 2),
 ("Prévenir le propriétaire d'une casse", "📞", 15, 1.5, 2, 2),
],
"Cuisine, le reste du travail": [
 ("Gérer deux services de petit-déjeuner", "⏰", 45, 2.0, 1, 1),
 ("Cuisiner un plat en plus pour les régimes particuliers", "🥦", 30, 2.5, 1, 2),
 ("Utiliser les restes pour ne rien jeter", "🥡", 25, 2.5, 0, 2),
 ("Préparer les provisions de la journée en mer ou en rando", "🎒", 25, 2.5, 0, 2),
 ("Faire le café pour ceux qui se lèvent tard", "☕", 10, 2.0, 1, 0),
],
"Dehors, le reste du travail": [
 ("Gréer et amarrer le bateau", "⛵", 40, 4.0, 0, 1),
 ("Gonfler les paddles et le matériel", "🛟", 25, 4.0, 1, 0),
 ("Nettoyer le barbecue juste après le repas", "🔥", 25, 3.0, 2, 0),
 ("Rentrer le linge et les serviettes le soir", "🌇", 10, 1.5, 0, 1),
 ("Réserver et récupérer le matériel loué", "🚵", 45, 2.3, 0, 2),
],
"Vie du groupe (à débattre)": [
 ("Désamorcer une tension entre deux personnes", "🕊️", 30, 1.5, 3, 2),
 ("Écouter quelqu'un qui ne va pas", "👂", 45, 1.5, 1, 1),
 ("Aller chercher celui qui reste dans son coin", "🫂", 30, 1.5, 1, 2),
 ("Organiser un jeu pour tout le monde", "🎲", 45, 2.0, 0, 1),
 ("Prendre les photos du groupe", "📷", 20, 2.0, 0, 1),
 ("Faire les comptes du restaurant à table", "🧾", 15, 1.5, 2, 1),
],
}

rows = []
for famille, taches in FAMILLES.items():
    for nom, emoji, duree, met, corvee, tete in taches:
        rows.append({
            "famille": famille, "nom": nom, "emoji": emoji,
            "duree": duree, "met": met, "corvee": corvee, "tete": tete,
            "points": points(duree, met, corvee, tete),
        })

print(f"{len(rows)} tâches")
vals = [r["points"] for r in rows]
print(f"min {min(vals)}  max {max(vals)}  médiane {sorted(vals)[len(vals)//2]}")
from collections import Counter
print("répartition :", sorted(Counter(vals).items()))
json.dump(rows, open('scripts/bareme.json', 'w'), ensure_ascii=False, indent=1)
