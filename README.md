# Trip Duty

Répartir les tâches d'un séjour entre amis et compter les points.

## Comment ça marche

Un séjour est créé par un chef, qui garde le contrôle. On rejoint avec un simple
lien : prénom, photo, et on précise si on a le permis. Chaque tâche vaut des
points, n'importe qui peut valider une tâche faite, et les points sont partagés
entre les personnes qui l'ont faite. Le score est cumulé sur tout le séjour.
Le dernier du classement se voit attribuer automatiquement la prochaine tâche
libre, signalée par une pastille rouge.

## Lancer en local

```bash
npm install
npm run dev
```

L'app tourne sur http://localhost:3400

## Mise en ligne

Chaque envoi sur `main` déclenche le déploiement sur GitHub Pages
(voir `.github/workflows/deploy.yml`).

## Où en est le projet

Les données sont pour l'instant stockées dans le téléphone de chacun
(`src/data/store.ts`), avec un jeu de données de démonstration. Le partage réel
entre les téléphones se fera en écrivant un autre objet qui respecte la même
interface `Store`, sans toucher aux écrans.
