# Trip Duty

Répartir les tâches d'un séjour entre amis et garder les comptes à zéro.

Application web pour l'instant, pensée pour devenir une application Android et
iPhone. Elle s'installe déjà sur l'écran d'accueil des deux plateformes.

## Le principe

Chaque tâche porte deux informations : **qui l'a faite** et **pour qui**. Les
points sont crédités à ceux qui la font et débités à ceux pour qui elle est
faite, si bien que la somme des soldes du groupe fait toujours zéro. Se faire
son sandwich tout seul ne rapporte donc rien, et un petit-déjeuner préparé pour
quatre personnes ne concerne que ces quatre-là.

Personne n'est jamais désigné d'office. L'application affiche les soldes et
suggère qui aurait intérêt à s'y coller. À la fin du séjour, les grosses tâches
de clôture (la tournée, le grand ménage du départ) reviennent à ceux qui doivent
encore au groupe.

## Le parcours

1. Compte avec adresse e-mail et mot de passe
2. Profil : prénom, nom, date de naissance, photo facultative (sinon les
   initiales sur une couleur au choix)
3. Explication du principe en quatre écrans
4. Création d'un groupe : vacances, couple ou potes
5. L'hôte choisit les dates, une icône, une couleur, puis invite par lien de
   partage ou par e-mail

## Lancer en local

```bash
npm install
npm run dev
```

L'application tourne sur http://localhost:3400

Comptes de démonstration : `ismael@demo.fr`, `lola@demo.fr`, `hugo@demo.fr` et
les autres prénoms du groupe de test, tous avec le mot de passe `verdon2026`.

## Mise en ligne

Chaque envoi sur `main` déclenche le déploiement sur GitHub Pages
(voir `.github/workflows/deploy.yml`).

## Où en est le projet

Les données sont stockées dans le téléphone de chacun (`src/data/store.ts`).
Rien n'est encore partagé entre les appareils : c'est la prochaine étape, et
elle ne touchera aucun écran, seulement l'objet `Store`.

Toute la logique de calcul (`src/lib/ledger.ts`, `suggest.ts`, `closing.ts`) est
en TypeScript pur, sans rien qui dépende du navigateur, donc réutilisable telle
quelle dans une application native.
