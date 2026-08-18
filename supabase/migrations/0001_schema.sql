-- Trip Duty : schema de base.
--
-- Deux natures de donnees cohabitent, et la difference structure tout :
--
--   * profiles / groups / memberships / tasks = de l'etat, qui evolue.
--   * entries                                 = des faits comptables, immuables.
--
-- Les montants sont en centiemes de point (voir CENTI dans src/lib/ledger.ts).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Personnes
-- ---------------------------------------------------------------------------

-- Le mot de passe n'apparait nulle part ici, et c'est le point important :
-- Supabase Auth detient `auth.users`, gere le hachage lent et les sessions.
-- Cette table ne porte que ce qui s'affiche.
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  first_name text        not null default '' check (length(first_name) <= 40),
  last_name  text        not null default '' check (length(last_name) <= 40),
  birth_date date,
  photo_url  text,
  color      text        not null default '#3d8bff',
  -- Un compte ne se supprime pas, il se desactive. Supprimer une personne
  -- emporterait ses ecritures comptables et fausserait les soldes de tous les
  -- autres, retroactivement. On marque donc, on n'efface jamais.
  deactivated_at timestamptz,
  created_at timestamptz not null default now()
);

-- Une inscription cree la fiche correspondante. Sans ce declencheur, un compte
-- existerait sans profil et l'application afficherait un membre vide.
create or replace function handle_new_user() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Groupes
-- ---------------------------------------------------------------------------

create type group_kind  as enum ('vacances', 'couple', 'potes');
create type member_role as enum ('host', 'chef', 'member');

create table groups (
  id           uuid primary key default gen_random_uuid(),
  kind         group_kind  not null default 'vacances',
  name         text        not null check (length(trim(name)) between 1 and 80),
  emoji        text        not null default '',
  color        text        not null default '#ff6a3d',
  start_date   date        not null,
  end_date     date        not null,
  host_id      uuid        not null references profiles (id) on delete cascade,
  -- Meme alphabet que makeInviteCode() dans src/lib/identity.ts : ni O/0 ni
  -- I/1, pour qu'un code se dicte au telephone sans confusion.
  invite_code  text        not null unique check (invite_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  penalty      integer     not null default 30 check (penalty >= 0 and penalty <= 1000),
  closing_open boolean     not null default false,
  created_at   timestamptz not null default now(),
  check (end_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- Appartenances
-- ---------------------------------------------------------------------------

-- Le role et le permis vivent ici, pas sur le profil : on peut etre hote d'un
-- groupe et simple membre d'un autre.
create table memberships (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid        not null references groups (id) on delete cascade,
  profile_id  uuid        not null references profiles (id) on delete cascade,
  role        member_role not null default 'member',
  has_license boolean     not null default false,
  joined_at   timestamptz not null default now(),
  unique (group_id, profile_id)
);

create index memberships_by_profile on memberships (profile_id);

-- ---------------------------------------------------------------------------
-- Taches
-- ---------------------------------------------------------------------------

create type task_status as enum ('todo', 'done', 'missed');

create table tasks (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid        not null references groups (id) on delete cascade,
  title           text        not null check (length(trim(title)) between 1 and 120),
  title_key       text,
  emoji           text        not null default '',
  points          integer     not null check (points > 0 and points <= 1000),
  day             date        not null,
  time_of_day     time        not null,
  needs_license   boolean     not null default false,
  -- NULL = la tache profite a tout le monde. Un tableau vide serait ambigu.
  beneficiary_ids uuid[] check (beneficiary_ids is null or array_length(beneficiary_ids, 1) > 0),
  assigned_to     uuid        references profiles (id) on delete set null,
  status          task_status not null default 'todo',
  -- restrict, pas cascade : la base refuse de supprimer une personne qui porte
  -- des ecritures. Un compte inutilise se desactive (profiles.deactivated_at).
  created_by      uuid        not null references profiles (id) on delete restrict,
  recurring       boolean     not null default false,
  is_closing      boolean     not null default false,
  created_at      timestamptz not null default now()
);

create index tasks_by_group_day on tasks (group_id, day, time_of_day);

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
  group_id        uuid        not null references groups (id) on delete cascade,
  -- Une tache porte au plus une ligne. Rouvrir la supprime, revalider la remplace.
  task_id         uuid        not null unique references tasks (id) on delete cascade,
  kind            entry_kind  not null,
  doer_ids        uuid[]      not null,
  beneficiary_ids uuid[]      not null,
  -- { "<profile_id>": <centiemes> }, positif = credit, negatif = debit.
  amounts         jsonb       not null check (ledger_is_balanced(amounts)),
  validated_by    uuid        not null references profiles (id) on delete restrict,
  at              timestamptz not null default now(),
  check (kind = 'penalty' or array_length(doer_ids, 1) > 0)
);

create index entries_by_group on entries (group_id);
