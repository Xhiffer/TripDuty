-- Regles d'acces.
--
-- Le modele tient en une phrase : on voit et on modifie un sejour si, et
-- seulement si, on en est membre. On devient membre uniquement en presentant
-- le code de partage, via join_trip().
--
-- La cle "anon" du client est publique : elle est lisible dans le bundle du
-- navigateur. Toute la securite repose donc sur ce fichier, jamais sur le
-- fait de cacher la cle.

-- ---------------------------------------------------------------------------
-- Fonctions d'appartenance
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER est indispensable : sans lui, la politique de `members`
-- interrogerait `members`, qui redeclencherait la politique, a l'infini.
create or replace function is_member(target_trip uuid) returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from members
    where trip_id = target_trip and auth_user_id = auth.uid()
  );
$$;

create or replace function is_chef(target_trip uuid) returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from members
    where trip_id = target_trip
      and auth_user_id = auth.uid()
      and role in ('owner', 'chef')
  );
$$;

-- Identifie la ligne `members` du telephone courant, pour verifier qu'on
-- n'agit pas au nom de quelqu'un d'autre.
create or replace function my_member_id(target_trip uuid) returns uuid
  language sql
  stable
  security definer
  set search_path = public
as $$
  select id from members where trip_id = target_trip and auth_user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Politiques
-- ---------------------------------------------------------------------------

alter table trips   enable row level security;
alter table members enable row level security;
alter table tasks   enable row level security;
alter table entries enable row level security;

-- Sejours : lecture pour les membres, reglages reserves au chef.
-- Aucune politique INSERT : un sejour se cree uniquement via create_trip().
create policy trips_read   on trips for select using (is_member(id));
create policy trips_update on trips for update using (is_chef(id)) with check (is_chef(id));

-- Participants : on voit ses co-equipiers, on ne modifie que sa propre fiche.
-- Le chef peut en plus changer les roles. Aucune politique INSERT : on entre
-- uniquement via join_trip(), qui exige le code de partage.
create policy members_read on members for select using (is_member(trip_id));

create policy members_update_self on members for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy members_update_by_chef on members for update
  using (is_chef(trip_id) and role <> 'owner')
  with check (is_chef(trip_id) and role <> 'owner');

-- Taches : tout le monde peut proposer, prendre et corriger. C'est un sejour
-- entre amis, pas une organisation hierarchique.
create policy tasks_read on tasks for select using (is_member(trip_id));

create policy tasks_insert on tasks for insert
  with check (is_member(trip_id) and created_by = my_member_id(trip_id));

create policy tasks_update on tasks for update
  using (is_member(trip_id))
  with check (is_member(trip_id));

create policy tasks_delete on tasks for delete using (is_member(trip_id));

-- Lignes de compte : n'importe qui valide une tache faite, mais toujours en
-- son propre nom. On ne valide jamais a la place d'un autre.
create policy entries_read on entries for select using (is_member(trip_id));

create policy entries_insert on entries for insert
  with check (is_member(trip_id) and validated_by = my_member_id(trip_id));

-- Pas d'UPDATE : une ligne de compte est un fait. Rouvrir une tache la
-- supprime, la revalider en ecrit une nouvelle.
create policy entries_delete on entries for delete using (is_member(trip_id));
