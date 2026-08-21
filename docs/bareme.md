# Le barème

Ce que vaut chaque tâche, et pourquoi.

Le catalogue de `src/lib/catalog.ts` n'est pas rempli à l'intuition. Chaque
valeur est calculée à partir de quatre mesures, pour que personne ne puisse
dire « ça vaut pas ça » sans qu'on ait une réponse.

## La formule

```
points = 1,1 × min(durée, 150) ^ 0,73 × kPhysique × kCorvée × kTête
```

L'exposant 0,73 dit qu'une tâche longue vaut plus, mais pas
proportionnellement : deux heures de ménage ne valent pas quatre fois trente
minutes, parce qu'on est déjà lancé. Il est calé pour que l'échelle aille de 3
(changer un sac poubelle) à 61, soit un rapport de 20 pour un rapport de durée
de 60.

Le plafond de 150 minutes ferme l'échelle en haut. Au-delà de deux heures
trente sur une même tâche, la valeur cesse de monter : c'est une seule tâche,
pas une accumulation, et le partage entre bénéficiaires fait déjà son travail.
Sans lui, conduire quatre heures valait 98 points et écrasait tout le reste.

Ces points sont la valeur d'une tâche **rendue à tout le groupe**. Le grand
livre applique ensuite `shareOfGroup` quand on ne sert que quelques personnes,
et partage la somme entre ceux qui l'ont faite.

## Les quatre mesures

**Durée**, en minutes, pour un groupe de référence de huit personnes. Estimée
à partir des enquêtes emploi du temps (American Time Use Survey) : 52 min par
jour de préparation des repas, ~30 min pour une salle de bain, ~100 min pour
les courses de la semaine. C'est le facteur dominant.

**MET**, le coût physique, tiré du Compendium of Physical Activities. C'est une
mesure, pas une opinion : 2,3 pour la vaisselle debout, 3,5 pour l'aspirateur
et la serpillière, 6,0 pour porter des cartons, 7,0 pour marcher chargé.

| MET | Coefficient |
| --- | ---: |
| ≤ 2,5 assis ou debout léger | × 1,00 |
| 2,6 à 3,4 ménage courant | × 1,10 |
| 3,5 à 4,9 aspirateur, serpillière | × 1,25 |
| ≥ 5 porter, charger | × 1,45 |

**Corvée**, le dégoût qu'elle inspire, d'après les sondages YouGov (2021) et
Cinch Home Services (2024). Attention : cet axe mesure le dégoût, pas la
fatigue. La fatigue est déjà comptée par la durée et par le MET. C'est pour
ça que conduire longtemps est au niveau 1 et pas au niveau 2.

| Niveau | Coefficient |
| --- | ---: |
| 0 neutre | × 1,00 |
| 1 peu aimée | × 1,10 |
| 2 détestée | × 1,25 |
| 3 redoutée (toilettes, bondes, couches) | × 1,40 |

**Tête**, la charge mentale, d'après les quatre opérations de Daminger (*The
Cognitive Dimension of Household Labor*, American Sociological Review, 2019) :
anticiper, identifier les options, décider, surveiller que ce soit fait.

| Niveau | Coefficient |
| --- | ---: |
| 0 on exécute, quelqu'un a demandé | × 1,00 |
| 1 il faut planifier | × 1,15 |
| 2 il faut anticiper et vérifier | × 1,30 |

## Deux limites connues

**La taille du groupe ne joue pas.** Cuisiner pour quatre et cuisiner pour
douze valent la même chose, alors que la durée n'a rien à voir. L'application
ajuste selon le nombre de *servis*, mais pas selon la quantité de travail que
ce nombre impose.

**Découper une tâche rapporte plus que la faire d'un bloc.** C'est la
conséquence de l'exposant : deux fois « vaisselle du midi » rapporte plus
qu'une « vaisselle du soir » de durée équivalente. Pour la route, c'est bloqué
par trois paliers plutôt qu'une tâche horaire. Ailleurs le risque est faible.

## Recalculer

Le script qui produit ces valeurs est dans `scripts/bareme.py`. Il écrit
`src/lib/catalog.ts` et la liste de clôture. Modifier une durée ou un niveau
là-bas, relancer, et le catalogue suit.

## Le tableau complet

### Cuisine et repas

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🍝 Cuisiner pour une grande tablée | 100 min | 2.5 | 0 | 1 | **36** |
| 🍲 Cuisiner un vrai repas du soir | 75 min | 2.5 | 0 | 1 | **30** |
| 🔥 Faire le barbecue | 60 min | 3.0 | 0 | 0 | **24** |
| 🍰 Préparer un dessert | 40 min | 2.0 | 0 | 0 | **16** |
| 🥗 Préparer un déjeuner simple | 35 min | 2.0 | 0 | 0 | **15** |
| 🧺 Préparer le pique-nique de la journée | 30 min | 2.5 | 0 | 1 | **15** |
| ⏲️ Surveiller la cuisson pendant que les autres sont dehors | 30 min | 2.0 | 1 | 0 | **14** |
| 🥐 Préparer le petit-déjeuner | 25 min | 2.0 | 0 | 0 | **12** |
| 🍻 Préparer l'apéro | 20 min | 2.0 | 0 | 0 | **10** |
| 🔪 Éplucher et couper les légumes | 20 min | 2.0 | 0 | 0 | **10** |
| 🥪 Faire les sandwichs de la rando | 20 min | 2.0 | 0 | 0 | **10** |
| 🌾 Gérer les allergies et les régimes de chacun | 15 min | 2.0 | 0 | 2 | **10** |
| 🥖 Aller chercher le pain | 15 min | 2.3 | 0 | 0 | **8** |
| 🛍️ Ranger les courses en arrivant | 15 min | 2.5 | 0 | 0 | **8** |
| 🧊 Remplir la glacière et faire les glaçons | 10 min | 2.5 | 0 | 1 | **7** |
| ☕ Préparer les cafés du matin | 10 min | 2.0 | 0 | 0 | **6** |
| 🧽 Débarrasser la table | 10 min | 2.5 | 0 | 0 | **6** |
| 🍪 Préparer le goûter | 10 min | 2.0 | 0 | 0 | **6** |
| 🍽️ Mettre la table | 8 min | 2.0 | 0 | 0 | **5** |
| 🥩 Sortir la viande à décongeler à temps | 5 min | 2.0 | 0 | 2 | **5** |

### Vaisselle et cuisine à nettoyer

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🔥 Nettoyer le four | 35 min | 3.0 | 2 | 0 | **20** |
| 🧼 Faire la vaisselle du soir à la main | 40 min | 2.3 | 1 | 0 | **18** |
| 🍳 Récurer les casseroles et le plat du four | 20 min | 2.5 | 2 | 0 | **12** |
| 🧹 Ranger la cuisine après le repas | 20 min | 3.0 | 1 | 0 | **12** |
| 🍴 Faire la vaisselle du midi | 20 min | 2.3 | 1 | 0 | **11** |
| ♨️ Nettoyer la plaque de cuisson | 15 min | 3.0 | 1 | 0 | **10** |
| 🥂 Laver les verres à la main | 12 min | 2.3 | 1 | 0 | **7** |
| 🧴 Nettoyer le plan de travail et l'évier | 12 min | 3.0 | 0 | 0 | **7** |
| 🫧 Remplir et lancer le lave-vaisselle | 10 min | 2.3 | 0 | 0 | **6** |
| 🥣 Vider le lave-vaisselle | 8 min | 2.3 | 1 | 0 | **6** |

### Courses et intendance

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🛒 Faire les grandes courses de la semaine | 90 min | 2.3 | 0 | 2 | **38** |
| 🥬 Aller au marché | 60 min | 2.3 | 0 | 1 | **25** |
| ⛽ Aller chercher le gaz, les bûches ou la glace | 30 min | 3.5 | 0 | 1 | **19** |
| 🧮 Tenir les comptes du séjour | 20 min | 1.5 | 1 | 2 | **14** |
| 🚙 Repartir chercher un oubli | 25 min | 2.3 | 1 | 0 | **13** |
| 📝 Faire la liste de courses | 15 min | 1.5 | 0 | 2 | **10** |
| 📦 Porter et monter les courses | 15 min | 3.5 | 0 | 0 | **10** |
| 📞 Réserver le restaurant pour tout le monde | 15 min | 1.5 | 0 | 2 | **10** |
| 🥐 Acheter les viennoiseries pour tous | 20 min | 2.3 | 0 | 0 | **10** |
| 🍷 Gérer les boissons et la cave | 15 min | 2.5 | 0 | 1 | **9** |
| 🧻 Surveiller les stocks (papier, sacs, éponges) | 10 min | 2.0 | 0 | 2 | **8** |
| 💶 Avancer l'argent pour le groupe | 5 min | 1.5 | 0 | 1 | **4** |

### Ménage

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🎉 Nettoyer après la soirée | 45 min | 3.0 | 2 | 0 | **24** |
| 🌀 Passer l'aspirateur dans toute la maison | 40 min | 3.5 | 1 | 0 | **22** |
| 🪣 Passer la serpillière | 30 min | 3.5 | 1 | 0 | **18** |
| 🪟 Nettoyer les vitres | 35 min | 3.0 | 1 | 0 | **18** |
| 🧊 Nettoyer le frigo | 25 min | 3.0 | 2 | 0 | **16** |
| 🪶 Faire la poussière | 20 min | 2.5 | 1 | 0 | **11** |
| 🧦 Ranger les affaires que les autres ont laissées | 15 min | 2.5 | 2 | 1 | **11** |
| 🗄️ Ranger le cellier et la réserve | 20 min | 3.0 | 0 | 0 | **11** |
| 🍂 Balayer la terrasse | 15 min | 4.0 | 0 | 0 | **10** |
| 🩴 Rentrer et ranger les affaires de plage | 15 min | 3.0 | 1 | 0 | **10** |
| 🧹 Passer le balai dans la pièce de vie | 15 min | 3.3 | 0 | 0 | **9** |
| 🧷 Changer les draps d'une chambre | 15 min | 2.0 | 1 | 0 | **9** |
| 🛋️ Ranger le salon | 15 min | 2.5 | 0 | 0 | **8** |
| 🌬️ Aérer et ranger les chambres communes | 15 min | 2.5 | 0 | 0 | **8** |
| 🪑 Nettoyer la table extérieure | 10 min | 3.0 | 0 | 0 | **6** |
| 🧶 Secouer les tapis et les paillassons | 10 min | 3.0 | 0 | 0 | **6** |
| 🛏️ Faire son lit et ranger sa chambre | 10 min | 2.0 | 0 | 0 | **6** |
| 👟 Nettoyer l'entrée et les chaussures | 10 min | 3.0 | 0 | 0 | **6** |

### Salle de bain et toilettes

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🛁 Nettoyer la salle de bain en entier | 30 min | 3.2 | 2 | 0 | **18** |
| 🚿 Nettoyer la douche | 20 min | 3.2 | 2 | 0 | **13** |
| 💧 Passer un coup après les douches de tout le monde | 15 min | 3.2 | 2 | 0 | **11** |
| 🚽 Nettoyer les toilettes | 12 min | 2.5 | 3 | 0 | **9** |
| 🪠 Déboucher la bonde de douche | 10 min | 2.5 | 3 | 0 | **8** |
| 🪞 Nettoyer le lavabo et le miroir | 10 min | 2.5 | 1 | 0 | **6** |
| 🧻 Changer les serviettes | 8 min | 1.5 | 0 | 1 | **6** |
| 🧼 Remettre du papier toilette et du savon | 5 min | 2.0 | 0 | 2 | **5** |

### Linge

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 👔 Repasser | 25 min | 2.3 | 2 | 0 | **14** |
| 🧦 Ramasser et plier le linge | 20 min | 1.5 | 1 | 0 | **11** |
| 👕 Étendre le linge | 15 min | 1.5 | 1 | 0 | **9** |
| 🏖️ Laver les serviettes de plage | 12 min | 2.0 | 0 | 1 | **8** |
| 🗑️ Trier le linge sale commun | 10 min | 2.0 | 1 | 1 | **7** |
| 🧺 Lancer une machine | 8 min | 1.5 | 0 | 1 | **6** |
| 🧽 Laver les torchons | 8 min | 2.0 | 1 | 0 | **6** |

### Déchets

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 📦 Emmener les cartons à la déchetterie | 40 min | 3.5 | 1 | 1 | **26** |
| 🍾 Descendre le verre au conteneur | 15 min | 3.5 | 1 | 0 | **11** |
| 🥫 Faire le tri, et refaire celui des autres | 12 min | 2.5 | 2 | 1 | **10** |
| 🪰 Nettoyer la poubelle | 12 min | 3.0 | 3 | 0 | **10** |
| 🗑️ Sortir les poubelles | 6 min | 3.0 | 2 | 0 | **6** |
| ♻️ Changer le sac poubelle | 4 min | 2.5 | 1 | 0 | **3** |

### Route et voitures

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🚐 Conduire plus de 3 h | 240 min | 2.0 | 1 | 2 | **61** |
| 🛣️ Conduire entre 1 h et 3 h | 120 min | 2.0 | 1 | 1 | **46** |
| 🌙 Conduire de nuit | 90 min | 2.0 | 2 | 1 | **42** |
| 🚗 Conduire moins d'une heure | 45 min | 2.0 | 1 | 1 | **22** |
| 🧳 Charger le coffre pour tout le monde | 25 min | 6.0 | 1 | 1 | **21** |
| 🚕 Aller chercher quelqu'un en voiture | 40 min | 2.0 | 1 | 1 | **21** |
| 📤 Décharger les voitures | 20 min | 6.0 | 0 | 0 | **14** |
| 🧽 Nettoyer l'habitacle | 25 min | 3.0 | 1 | 0 | **14** |
| ⛽ Faire le plein | 15 min | 2.5 | 0 | 1 | **9** |
| 🎫 Gérer l'essence et les péages pour tous | 10 min | 1.5 | 0 | 2 | **8** |

### Organisation et charge mentale

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🏡 Trouver le logement et gérer la réservation | 90 min | 1.5 | 1 | 2 | **42** |
| 🧸 S'occuper des enfants pendant que les autres soufflent | 60 min | 3.0 | 1 | 2 | **34** |
| 🚨 Gérer un imprévu (panne, pluie, blessure) | 45 min | 2.0 | 2 | 2 | **29** |
| 📸 Trier et partager les photos du séjour | 40 min | 1.5 | 0 | 1 | **19** |
| 📅 Faire le planning des repas de la semaine | 30 min | 1.5 | 0 | 2 | **17** |
| 🎟️ Réserver une activité pour le groupe | 25 min | 1.5 | 0 | 2 | **15** |
| 🗝️ Répartir les chambres et les lits | 20 min | 2.0 | 1 | 2 | **14** |
| 🗺️ Organiser la journée de demain | 20 min | 1.5 | 0 | 2 | **13** |
| 📣 Rappeler au groupe les tâches à faire | 10 min | 1.5 | 3 | 2 | **11** |
| 👋 Accueillir et faire visiter à l'arrivée | 20 min | 2.0 | 0 | 1 | **11** |
| 🩹 Gérer la pharmacie et les petits bobos | 15 min | 2.0 | 1 | 2 | **11** |
| ⏰ Relancer tout le monde pour l'heure du départ | 10 min | 1.5 | 2 | 2 | **10** |
| 🎸 Gérer la musique et l'enceinte | 10 min | 1.5 | 0 | 0 | **6** |

### Dehors et vacances

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| ⛰️ Porter le sac commun pendant la rando | 90 min | 7.0 | 1 | 0 | **47** |
| 🏊 Nettoyer la piscine | 25 min | 3.5 | 1 | 1 | **18** |
| 🐕 Sortir le chien | 30 min | 3.0 | 0 | 1 | **17** |
| 🎒 Préparer le matériel de rando | 25 min | 2.5 | 0 | 1 | **13** |
| 🪵 Allumer et entretenir le feu | 20 min | 3.0 | 0 | 0 | **11** |
| ⛱️ Monter le parasol et sortir les transats | 15 min | 3.5 | 0 | 0 | **10** |
| 🏄 Ranger le matériel de plage en fin de journée | 15 min | 3.0 | 1 | 0 | **10** |
| 🪴 Arroser les plantes | 10 min | 2.5 | 0 | 1 | **7** |

### Tâches de clôture (dernier jour)

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🧹 Grand ménage de la maison | 120 min | 3.0 | 2 | 1 | **57** |
| 🌀 Passer l'aspirateur partout | 60 min | 3.5 | 1 | 0 | **30** |
| 🛁 Nettoyer toutes les salles de bain | 60 min | 3.2 | 2 | 0 | **30** |
| 🧳 Charger les voitures pour le retour | 40 min | 6.0 | 1 | 1 | **30** |
| 🧊 Vider et nettoyer le frigo | 40 min | 3.0 | 2 | 1 | **26** |
| 🗑️ Sortir toutes les poubelles et le verre | 30 min | 3.5 | 2 | 0 | **21** |
| 🔥 Nettoyer le barbecue et la plancha | 30 min | 3.0 | 3 | 0 | **20** |
| 📋 Faire l'état des lieux avec le propriétaire | 30 min | 1.5 | 1 | 2 | **19** |
| 🗝️ Rendre les clés et attendre le propriétaire | 30 min | 1.5 | 2 | 1 | **19** |
| 🧮 Solder les comptes du séjour | 30 min | 1.5 | 1 | 2 | **19** |
| 🛏️ Défaire tous les lits et regrouper le linge | 35 min | 2.0 | 1 | 0 | **16** |
| 🎒 Rendre à chacun ce qu'il a oublié | 20 min | 2.0 | 1 | 2 | **14** |

### Arrivée et installation

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🛒 Faire les courses d'arrivée | 60 min | 2.3 | 0 | 2 | **28** |
| 🔌 Comprendre et expliquer les équipements de la maison | 30 min | 1.5 | 1 | 2 | **19** |
| 🛏️ Faire tous les lits à l'arrivée | 40 min | 2.0 | 1 | 0 | **18** |
| 🧳 Monter les valises de tout le monde | 25 min | 6.0 | 1 | 0 | **18** |
| 🗺️ Repérer les commerces et leurs horaires | 20 min | 1.5 | 0 | 2 | **13** |

### Enfants

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🚸 Occuper les enfants pendant le trajet | 60 min | 2.0 | 2 | 1 | **31** |
| 🏊 Surveiller les enfants à la piscine ou à la plage | 60 min | 2.0 | 1 | 2 | **31** |
| 😴 Gérer un réveil en pleine nuit | 30 min | 2.0 | 3 | 1 | **21** |
| 🌜 Coucher les enfants | 30 min | 2.0 | 2 | 1 | **19** |
| 🛁 Donner le bain aux enfants | 25 min | 3.0 | 1 | 1 | **16** |
| 🍼 Préparer les repas des enfants | 25 min | 2.0 | 0 | 1 | **13** |
| 🧷 Changer une couche | 6 min | 2.5 | 3 | 0 | **6** |

### Animaux

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 💩 Ramasser les crottes du chien | 8 min | 3.0 | 3 | 0 | **8** |
| 🐈 Nourrir les animaux | 8 min | 2.0 | 0 | 1 | **6** |

### Soirée et lendemain

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🔑 Être le conducteur sobre de la soirée | 180 min | 2.0 | 2 | 1 | **61** |
| 🤢 S'occuper de quelqu'un qui a trop bu | 45 min | 2.5 | 3 | 1 | **29** |
| 🍳 Préparer le petit-déjeuner du lendemain de fête | 30 min | 2.0 | 1 | 1 | **17** |
| 🥂 Ramasser les verres au réveil | 20 min | 2.5 | 2 | 0 | **12** |
| 🚬 Ramasser les mégots et les déchets de la terrasse | 15 min | 3.0 | 2 | 0 | **11** |
| 🔊 Ranger la sono et les enceintes | 15 min | 3.0 | 0 | 0 | **9** |

### Pannes et imprévus

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🏥 Emmener quelqu'un chez le médecin | 90 min | 2.0 | 2 | 2 | **48** |
| 🔧 Réparer ou remplacer quelque chose de cassé | 45 min | 3.0 | 2 | 2 | **32** |
| ⚡ Gérer une panne d'eau, d'électricité ou de wifi | 40 min | 2.0 | 2 | 2 | **26** |
| 🪠 Déboucher un évier ou des toilettes | 25 min | 3.0 | 3 | 1 | **20** |
| 📞 Prévenir le propriétaire d'une casse | 15 min | 1.5 | 2 | 2 | **13** |

### Cuisine, le reste du travail

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| ⏰ Gérer deux services de petit-déjeuner | 45 min | 2.0 | 1 | 1 | **22** |
| 🥦 Cuisiner un plat en plus pour les régimes particuliers | 30 min | 2.5 | 1 | 2 | **19** |
| 🥡 Utiliser les restes pour ne rien jeter | 25 min | 2.5 | 0 | 2 | **15** |
| 🎒 Préparer les provisions de la journée en mer ou en rando | 25 min | 2.5 | 0 | 2 | **15** |
| ☕ Faire le café pour ceux qui se lèvent tard | 10 min | 2.0 | 1 | 0 | **6** |

### Dehors, le reste du travail

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| ⛵ Gréer et amarrer le bateau | 40 min | 4.0 | 0 | 1 | **23** |
| 🚵 Réserver et récupérer le matériel loué | 45 min | 2.3 | 0 | 2 | **23** |
| 🛟 Gonfler les paddles et le matériel | 25 min | 4.0 | 1 | 0 | **16** |
| 🔥 Nettoyer le barbecue juste après le repas | 25 min | 3.0 | 2 | 0 | **16** |
| 🌇 Rentrer le linge et les serviettes le soir | 10 min | 1.5 | 0 | 1 | **7** |

### Vie du groupe (à débattre)

| Tâche | Durée | MET | Corvée | Tête | Points |
| --- | ---: | ---: | ---: | ---: | ---: |
| 🕊️ Désamorcer une tension entre deux personnes | 30 min | 1.5 | 3 | 2 | **24** |
| 👂 Écouter quelqu'un qui ne va pas | 45 min | 1.5 | 1 | 1 | **22** |
| 🎲 Organiser un jeu pour tout le monde | 45 min | 2.0 | 0 | 1 | **20** |
| 🫂 Aller chercher celui qui reste dans son coin | 30 min | 1.5 | 1 | 2 | **19** |
| 📷 Prendre les photos du groupe | 20 min | 2.0 | 0 | 1 | **11** |
| 🧾 Faire les comptes du restaurant à table | 15 min | 1.5 | 2 | 1 | **11** |
