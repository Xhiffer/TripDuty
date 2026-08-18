-- Trip Duty : schema de base.
--
-- Deux natures de donnees cohabitent ici, et la difference structure tout :
--
--   * trips / members / tasks  = de l'etat, qui evolue (une tache est prise,
--     puis faite, puis rouverte).
--   * entries                  = des faits comptables, immuables. Une fois
--     ecrite, une ligne de compte ne change plus. C'est ce qui permet a deux
--     telephones d'ecrire en meme temps sans se marcher dessus.
--
-- Les montants sont en centiemes de point (voir CENTI dans src/lib/ledger.ts).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Sejours
-- ---------------------------------------------------------------------------

create table trips (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null check (length(trim(name)) between 1 and 80),
  start_date   date        not null,
  end_date     date        not null,
  penalty      integer     not null default 30 check (penalty >= 0 and penalty <= 1000),
  closing_open boolean     not null default false,
  -- Le lien de partage. Court, lisible a voix haute, mais assez large pour ne
  -- pas se deviner (32^10 combinaisons).
  join_code    text        not null unique check (join_code ~ '^[a-z0-9]{10}$'),
  created_at   timestamptz not null default now(),
  check (end_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- Participants
-- ---------------------------------------------------------------------------

create type member_role as enum ('owner', 'chef', 'member');

create table members (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid        not null references trips (id) on delete cascade,
  -- Chaque telephone recoit une identite anonyme Supabase des le premier
  -- chargement. C'est ce qui permet d'ecrire des regles RLS sans imposer
  -- la creation d'un compte.
  auth_user_id uuid        not null references auth.users (id) on delete cascade,
  name         text        not null check (length(trim(name)) between 1 and 40),
  photo_url    text,
  has_license  boolean     not null default false,
  role         member_role not null default 'member',
  joined_at    timestamptz not null default now(),
  -- Un telephone = une seule personne par sejour.
  unique (trip_id, auth_user_id)
);

-- Deux "Camille" dans le meme sejour rendent le classement illisible.
create unique index members_unique_name on members (trip_id, lower(trim(name)));
create index members_by_trip on members (trip_id);

-- ---------------------------------------------------------------------------
-- Taches
-- ---------------------------------------------------------------------------

create type task_status as enum ('todo', 'done', 'missed');

create table tasks (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid        not null references trips (id) on delete cascade,
  title           text        not null check (length(trim(title)) between 1 and 120),
  title_key       text,
  emoji           text        not null default '',
  points          integer     not null check (points > 0 and points <= 1000),
  day             date        not null,
  time_of_day     time        not null,
  needs_license   boolean     not null default false,
  -- NULL = la tache profite a tout le monde. Un tableau vide serait ambigu,
  -- on l'interdit explicitement.
  beneficiary_ids uuid[] check (beneficiary_ids is null or array_length(beneficiary_ids, 1) > 0),
  assigned_to     uuid        references members (id) on delete set null,
  status          task_status not null default 'todo',
  created_by      uuid        not null references members (id) on delete cascade,
  recurring       boolean     not null default false,
  is_closing      boolean     not null default false,
  created_at      timestamptz not null default now()
);

create index tasks_by_trip_day on tasks (trip_id, day, time_of_day);

-- ---------------------------------------------------------------------------
-- Lignes de compte
-- ---------------------------------------------------------------------------

create type entry_kind as enum ('completion', 'penalty');

-- Le coeur de la comptabilite : ce que gagnent ceux qui font la tache est
-- exactement ce que doivent ceux pour qui elle est faite. La base refuse une
-- ligne desequilibree, quelle que soit l'erreur du client.
create or replace function ledger_is_balanced(amounts jsonb) returns boolean
  language sql
  immutable
as $$
  select coalesce(sum(value::numeric), 0) = 0 from jsonb_each_text(amounts);
$$;

create table entries (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid        not null references trips (id) on delete cascade,
  -- Une tache porte au plus une ligne de compte. Rouvrir une tache, c'est
  -- supprimer sa ligne ; la revalider, c'est en ecrire une nouvelle.
  task_id         uuid        not null unique references tasks (id) on delete cascade,
  kind            entry_kind  not null,
  doer_ids        uuid[]      not null,
  beneficiary_ids uuid[]      not null,
  -- { "<member_id>": <centiemes> }, positif = credit, negatif = debit.
  amounts         jsonb       not null check (ledger_is_balanced(amounts)),
  validated_by    uuid        not null references members (id) on delete cascade,
  at              timestamptz not null default now(),
  check (kind = 'penalty' or array_length(doer_ids, 1) > 0)
);

create index entries_by_trip on entries (trip_id);
