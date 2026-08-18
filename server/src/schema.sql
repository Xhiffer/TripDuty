-- Trip Duty : schema de la base partagee.
--
-- Deux natures de donnees cohabitent :
--   * comptes, groupes, adhesions, taches = de l'etat, qui evolue
--   * entries                             = des faits comptables, immuables
--
-- Les montants sont en centiemes de point, pour que la division d'une tache
-- entre plusieurs beneficiaires tombe juste et que la somme fasse zero.

create extension if not exists pgcrypto;

create table if not exists accounts (
  id            uuid primary key default gen_random_uuid(),
  email         text        not null unique,
  password_hash text        not null,
  first_name    text        not null default '',
  last_name     text        not null default '',
  birth_date    date,
  photo         text,
  color         text        not null default '#ff6a3d',
  created_at    timestamptz not null default now()
);

create unique index if not exists accounts_email_lower on accounts (lower(email));

create table if not exists groups (
  id           uuid primary key default gen_random_uuid(),
  kind         text        not null check (kind in ('vacances', 'couple', 'potes')),
  name         text        not null check (length(trim(name)) between 1 and 80),
  emoji        text        not null default '⛰️',
  color        text        not null default '#ff6a3d',
  start_date   date        not null,
  end_date     date        not null,
  host_id      uuid        not null references accounts (id) on delete cascade,
  invite_code  text        not null unique,
  penalty      integer     not null default 30 check (penalty >= 0 and penalty <= 1000),
  closing_open boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists memberships (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid        not null references groups (id) on delete cascade,
  account_id  uuid        not null references accounts (id) on delete cascade,
  role        text        not null default 'member' check (role in ('host', 'chef', 'member')),
  has_license boolean     not null default false,
  joined_at   timestamptz not null default now(),
  unique (group_id, account_id)
);

create index if not exists memberships_by_account on memberships (account_id);

create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid        not null references groups (id) on delete cascade,
  title           text        not null,
  title_key       text,
  emoji           text        not null default '🎯',
  points          integer     not null check (points >= 0 and points <= 1000),
  date            date        not null,
  time            text        not null default '19:00',
  needs_license   boolean     not null default false,
  -- null = la tache profite a tout le monde
  beneficiary_ids uuid[],
  assigned_to     uuid        references accounts (id) on delete set null,
  status          text        not null default 'todo' check (status in ('todo', 'done', 'missed')),
  created_by      uuid        references accounts (id) on delete set null,
  recurring       boolean     not null default false,
  is_closing      boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists tasks_by_group on tasks (group_id);

-- Une ligne de compte. La somme des montants d'une entree fait toujours zero.
create table if not exists entries (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid        not null references groups (id) on delete cascade,
  task_id         uuid        not null references tasks (id) on delete cascade,
  kind            text        not null check (kind in ('completion', 'penalty')),
  doer_ids        uuid[]      not null default '{}',
  beneficiary_ids uuid[]      not null default '{}',
  amounts         jsonb       not null,
  validated_by    uuid        references accounts (id) on delete set null,
  at              timestamptz not null default now(),
  -- Une tache n'a qu'une ligne de compte a la fois.
  unique (task_id)
);

create index if not exists entries_by_group on entries (group_id);

-- Compteur de version par groupe : les telephones demandent seulement
-- "est-ce que quelque chose a bouge ?" avant de retelecharger.
create table if not exists group_versions (
  group_id uuid primary key references groups (id) on delete cascade,
  version  bigint      not null default 1,
  bumped_at timestamptz not null default now()
);
