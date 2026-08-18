# Trip Duty — logique et structure

Fiche de référence commune. Objectif : que deux personnes qui poussent sur le
même dépôt aient le même modèle mental. À relire avant un gros changement, à
mettre à jour quand une décision est prise.

---

## 1. Le principe, en une phrase

Chaque tâche porte **qui l'a faite** et **pour qui**. Les points sont crédités à
ceux qui font, débités à ceux qui profitent, si bien que **la somme des soldes
du groupe fait toujours zéro**.

Ce n'est pas un score, c'est un solde — comme Tricount, mais pour des tâches.
Trois conséquences qui expliquent la moitié du code :

- Se faire son sandwich tout seul ne rapporte rien : on est à la fois celui qui
  fait et le seul bénéficiaire, les deux montants s'annulent.
- Un petit-déjeuner préparé pour quatre ne concerne que ces quatre-là.
- Le classement n'a pas besoin d'arbitre : celui qui doit au groupe se voit
  proposer les tâches suivantes.

**Les montants sont en centièmes de point** (`CENTI = 100`). Jamais en nombres à
virgule : diviser 10 points entre 3 personnes doit tomber juste, sans qu'un
centième apparaisse ou disparaisse. C'est le rôle de `splitExact`.

---

## 2. Les couches

```
  Écrans  (src/screens, src/components)
     │      ne connaissent ni le stockage ni la base
     ▼
  state.tsx  — contexte React, une seule source de vérité
     │
     ▼
  Store  (src/data/store.ts)  — interface
     │
     ├── localStore    : localStorage          ← aujourd'hui
     └── supabaseStore : Postgres + temps réel ← cible
```

**La règle qui tient tout :** un écran n'appelle jamais le stockage. Il appelle
le contexte. Changer de base de données ne doit toucher qu'un seul fichier.

À côté, de la **logique pure** — sans React, sans navigateur, donc testable
directement et réutilisable telle quelle dans une application native :

| Fichier               | Rôle                                                     |
| --------------------- | -------------------------------------------------------- |
| `src/lib/ledger.ts`   | Toute la comptabilité : montants, soldes, remboursements |
| `src/lib/suggest.ts`  | Qui aurait intérêt à prendre quelle tâche                |
| `src/lib/closing.ts`  | Les tâches de fin de séjour                              |
| `src/lib/identity.ts` | Couleurs, initiales, codes d'invitation, âge             |
| `src/lib/catalog.ts`  | Le catalogue de tâches et leurs points                   |
| `src/lib/i18n.ts`     | Traductions fr/en                                        |

---

## 3. Le modèle de données

Défini dans `src/types.ts`.

```
Account ──┬── Membership ──── Group
          │   (rôle, permis)    │
          │                     ├── Task ──── Entry
          │                     │             (ligne de compte)
          └─────────────────────┘
```

| Type         | Ce que c'est                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Account`    | Une personne. Existe indépendamment des groupes.                                                                                                      |
| `Group`      | Un séjour, un couple, une coloc. Porte les dates et le code d'invitation.                                                                             |
| `Membership` | Le lien entre les deux. C'est **ici** que vivent le rôle et le permis, pas sur le compte : on peut être hôte d'un groupe et simple membre d'un autre. |
| `Task`       | Une tâche dans un groupe. `beneficiaryIds = null` signifie « tout le monde ».                                                                         |
| `Entry`      | Une ligne de compte. **Immuable.**                                                                                                                    |

`GroupView` et `Person` sont des vues aplaties, construites par `state.tsx` pour
les écrans. Elles ne sont jamais stockées.

### Deux natures de données, et c'est structurant

- **De l'état** — `groups`, `memberships`, `tasks`. Ça évolue : une tâche est
  prise, faite, rouverte.
- **Des faits** — `entries`. Une fois écrite, une ligne de compte ne change
  plus. Rouvrir une tâche **supprime** sa ligne ; la revalider en **écrit une
  nouvelle**.

Pourquoi cette rigidité : si on changeait le malus en cours de séjour et que les
montants étaient recalculés, toutes les pénalités passées bougeraient
rétroactivement. Les montants sont donc **figés au moment du geste**, jamais
recalculés à l'affichage.

**Invariant central :** pour toute `Entry`, `somme(amounts) === 0`.

---

## 4. Les trois chantiers ouverts

Aucun n'est un bug à corriger discrètement. Ce sont des décisions.

### 4.1 Le partage entre téléphones n'existe pas

`Store.save(état entier)` envoie **tout** le contenu à chaque geste. Avec deux
appareils :

| Heure | Alice               | Bob              | Ce qui est stocké        |
| ----- | ------------------- | ---------------- | ------------------------ |
| 20:00 | charge 16 tâches    | charge 16 tâches | 16 tâches, 10 lignes     |
| 20:01 | valide la vaisselle | _(n'a rien vu)_  | 16 tâches, 11 lignes     |
| 20:02 |                     | ajoute « Pain »  | **17 tâches, 10 lignes** |

À 20:02 Bob n'a rien fait de mal — sa requête dit simplement « voici le groupe
tel que je le connais », et son état date de 20:00. La validation d'Alice n'est
pas _écrasée par un conflit_ : elle n'existe pas dans son message, donc elle
disparaît. Sans erreur, sans avertissement.

**La correction : envoyer des mutations, pas l'état.** Une mutation ne parle que
de ce qu'elle touche, donc deux gestes portant sur des lignes différentes ne
peuvent plus se croiser. Deux règles la rendent rejouable partout :

1. **Elle se suffit à elle-même** — identifiants, horodatages et montants fixés
   au moment du geste.
2. **Elle porte une valeur, jamais une variation** — « récurrente = vrai », pas
   « inverse ». Sinon deux téléphones qui appuient ensemble s'annulent.

### 4.2 L'authentification est décorative

`identity.ts` fait un SHA-256 **sans sel**, dans le navigateur, et range
l'empreinte dans `localStorage`. Deux problèmes distincts :

- SHA-256 nu se casse par table arc-en-ciel. Un mot de passe doit passer par un
  hachage **lent et salé** (bcrypt, argon2).
- Plus grave : tout est côté client. N'importe qui édite son `localStorage` et
  devient n'importe qui. Aucun hachage ne corrige ça.

**La correction : ne jamais gérer de mot de passe nous-mêmes.** Supabase Auth
s'en charge — hachage, sessions, jetons. La colonne `passwordHash` disparaît.

C'est parfaitement acceptable pour une démo locale. Ça ne doit pas rester en
ligne.

### 4.3 Le schéma SQL

Les migrations décrivent `profiles` / `groups` / `memberships`, en accord avec
`types.ts`. Une version antérieure parlait de `trips` / `members` : elle n'a
jamais été appliquée et a été remplacée.

---

## 5. La cible : Supabase

**Postgres + Auth + Temps réel + Storage.** Le choix tient à une chose : les
règles d'accès vivent dans la base, pas dans le client.

### La sécurité repose sur RLS, jamais sur un secret

La clé `anon` est **publique par conception** : elle est lisible dans le bundle
du navigateur. Ce n'est pas une fuite. Toute la protection vient des politiques
`Row Level Security` (`0002_rls.sql`), que le client ne peut pas contourner.

Modèle en une phrase : **on voit et on modifie un groupe si et seulement si on
en est membre**, et on devient membre en présentant le code d'invitation.

### Ce que la base garantit elle-même

- `check (ledger_is_balanced(amounts))` — Postgres **refuse** une ligne de compte
  déséquilibrée. Un bug client ne peut pas fausser les soldes.
- `unique (task_id)` sur `entries` — une tâche porte au plus une ligne.
- `unique (group_id, profile_id)` — on n'est membre qu'une fois.

Ces garanties ne sont pas des doublons du code : ce sont les seules qui tiennent
quand le client a un bug.

### Fichiers

| Migration                   | Contenu                                  |
| --------------------------- | ---------------------------------------- |
| `0001_schema.sql`           | Tables, contraintes, invariant comptable |
| `0002_rls.sql`              | Qui peut lire et écrire quoi             |
| `0003_rpc.sql`              | Créer un groupe, le rejoindre par code   |
| `0004_realtime_storage.sql` | Temps réel et photos de profil           |

---

## 6. Conventions

**Ne jamais modifier une migration déjà appliquée.** On en ajoute une nouvelle.
Réécrire un fichier ne change rien à ce qui est en base — ça crée juste un
mensonge, et c'est ainsi qu'on obtient du code qui marche en local et casse en
production.

**Ne jamais stocker de mot de passe.** Supabase Auth s'en occupe.

**Un compte ne se supprime pas, il se desactive** (`profiles.deactivated_at`).
Supprimer une personne emporterait ses ecritures comptables et fausserait les
soldes de tous les autres, retroactivement. Les references depuis `tasks` et
`entries` sont en `on delete restrict` : la base refuse la suppression plutot
que de l'accepter en silence.

**Quitter un groupe passe par `leave_group()`, jamais par une suppression
directe.** Un groupe ne doit jamais se retrouver sans responsable : l'hote qui
part designe son successeur, ou c'est automatiquement la seule personne qui
reste. Si plus personne ne reste, le groupe disparait. `memberships` n'a
volontairement aucune politique `DELETE`, sinon la regle serait contournable.

**Pas d'invitation par e-mail.** Chercher qui possede une adresse revient a
permettre a n'importe qui de tester des adresses pour savoir qui a un compte.
Le code d'invitation est le seul chemin.

**Les photos vont dans Storage, pas en base.** Une photo 256×256 pèse ~20 ko,
~27 ko une fois en base64 : à dix personnes, ça alourdit chaque lecture pour
rien. Seule l'URL est stockée.

**La logique de calcul reste pure.** Pas de React ni de `window` dans
`src/lib/` : c'est ce qui la rend testable et portable vers du natif.

**Passer par des PR.** La CI tourne sur `pull_request` : les contrôles sont
visibles avant la fusion. Deux personnes poussant directement sur `main` se
marchent dessus — c'est déjà arrivé une fois, et ça a coûté les tests.

---

## 7. Qualité

```bash
npm test          # 43 tests
npm run lint      # ESLint
npm run build     # tsc -b puis vite build
```

`ci.yml` lance lint + tests + typage à chaque PR et sur `main`. `deploy.yml` le
réutilise : **rien ne part en ligne si un contrôle échoue**.

Les 43 tests couvrent la logique pure — 20 sur la comptabilité, 23 sur
`identity.ts`. Ils ne testent pas les écrans : les écrans changent souvent, la
comptabilité doit être juste. C'est là qu'un bug se voit sur le solde de
quelqu'un plutôt que dans une trace d'erreur.

`format:check` est **volontairement absent** de la CI : Prettier reformaterait 9
fichiers existants. À activer le jour où on décide ensemble de passer tout le
code au même format.

---

## 8. Mise en ligne

**https://xhiffer.github.io/TripDuty/** — chaque push sur `main` déclenche le
déploiement.

`VITE_BASE_PATH` pilote le chemin de base : `/TripDuty/` sur GitHub Pages, `/`
sur un hébergeur servant depuis la racine. Changer d'hébergeur ne demande aucune
modification du code.

Le routing est **en hash** (`#/join/CODE`). Un fragment n'atteint jamais le
serveur, donc aucun fallback SPA n'est nécessaire.
