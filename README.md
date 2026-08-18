# Trip Duty

Répartir les tâches d'un séjour entre amis et compter les points.

## Comment ça marche

Un séjour est créé par un chef, qui garde le contrôle. On rejoint avec un simple
lien : prénom, photo, et on précise si on a le permis. Chaque tâche vaut des
points, n'importe qui peut valider une tâche faite, et les points sont partagés
entre les personnes qui l'ont faite. Le score est un solde : ce que gagnent ceux
qui font la tâche est exactement ce que doivent ceux pour qui elle est faite.

## Lancer en local

```bash
npm install
npm run dev
```

L'app tourne sur http://localhost:3400

## Commandes

| Commande                | Rôle                                      |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Serveur de développement                  |
| `npm run build`         | Vérifie le typage (`tsc -b`) puis compile |
| `npm test`              | Tests unitaires                           |
| `npm run test:coverage` | Tests avec couverture                     |
| `npm run lint`          | ESLint                                    |
| `npm run format`        | Prettier, en écriture                     |

## Intégration continue

`.github/workflows/ci.yml` vérifie le format, le lint, les tests et le typage à
chaque _pull request_ et à chaque envoi sur `main`.

`.github/workflows/deploy.yml` réutilise exactement ces contrôles, puis publie
sur GitHub Pages. **Rien ne part en ligne si un seul contrôle échoue.**

Le chemin de base est piloté par `VITE_BASE_PATH` : `/TripDuty/` pour GitHub
Pages, `/` pour un hébergeur qui sert depuis la racine. Changer d'hébergeur ne
demande aucune modification du code.

## Données

Les écrans ne touchent jamais au stockage. Ils appellent le contexte de
[src/state.tsx](src/state.tsx), qui traduit chaque geste en **mutation** — une
modification décrite comme un fait achevé, qui ne parle que de ce qu'elle touche
([src/data/mutations.ts](src/data/mutations.ts)).

C'est ce qui rend le partage possible. Tant qu'un téléphone renvoyait le séjour
entier à chaque action, il effaçait sans erreur ni conflit tout ce qu'il n'avait
pas vu : celui qui ajoutait une tâche supprimait la validation faite trois
secondes plus tôt par quelqu'un d'autre. Deux règles l'évitent :

- **Une mutation se suffit à elle-même.** Identifiants, horodatages et montants
  sont fixés au moment du geste. Rejouée ailleurs, elle donne le même résultat.
- **Une mutation porte une valeur, jamais une variation.** `setRecurring` dit le
  nouvel état, pas « inverse-le » : deux téléphones qui appuient ensemble
  tombent d'accord au lieu de s'annuler.

`applyMutation` est une fonction pure, et la partie la plus testée du projet
([src/data/mutations.test.ts](src/data/mutations.test.ts)).

Aujourd'hui le seul magasin branché est `localStore` : tout reste dans le
téléphone, avec un jeu de données de démonstration. **Deux téléphones ne voient
donc pas encore le même séjour** — mais la couture est en place, et le canal
`subscribe` fonctionne déjà entre deux onglets du même téléphone.

Le schéma de la base partagée est prêt dans [supabase/migrations](supabase/migrations) :

| Fichier                     | Contenu                                           |
| --------------------------- | ------------------------------------------------- |
| `0001_schema.sql`           | Tables, contraintes, invariant comptable          |
| `0002_rls.sql`              | Qui a le droit de lire et d'écrire quoi           |
| `0003_rpc.sql`              | Créer un séjour, le rejoindre par code de partage |
| `0004_realtime_storage.sql` | Temps réel et photos de profil                    |

Deux points structurants :

- **Les lignes de compte sont immuables.** La base refuse une ligne dont la
  somme des montants n'est pas nulle (`ledger_is_balanced`). Rouvrir une tâche
  supprime sa ligne, la revalider en écrit une nouvelle.
- **L'identité est anonyme.** Chaque téléphone reçoit une identité Supabase dès
  le premier chargement, sans création de compte. C'est ce qui permet d'écrire
  des règles d'accès tout en gardant l'entrée par simple lien.

La clé `anon` du client est publique par conception : elle est lisible dans le
bundle. Toute la sécurité repose sur `0002_rls.sql`.

## Configuration

Copier `.env.example` en `.env.local` pour développer contre une vraie base.
Sans ces variables, l'app retombe automatiquement sur le stockage local.
