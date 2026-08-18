-- Regles d'acces.
--
-- Le modele tient en une phrase : on voit et on modifie un groupe si, et
-- seulement si, on en est membre. On devient membre en presentant le code
-- d'invitation, via join_group().
--
-- La cle "anon" du client est publique : elle est lisible dans le bundle du
-- navigateur. Toute la securite repose donc sur ce fichier, jamais sur le fait
-- de cacher la cle.

-- SECURITY DEFINER est indispensable : sans lui, la politique de `memberships`
-- interrogerait `memberships`, qui redeclencherait la politique, a l'infini.
create or replace function is_member(target_group uuid) returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from memberships
    where group_id = target_group and profile_id = auth.uid()
  );
$$;

create or replace function is_chef(target_group uuid) returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from memberships
    where group_id = target_group
      and profile_id = auth.uid()
      and role in ('host', 'chef')
  );
$$;

alter table profiles    enable row level security;
alter table groups      enable row level security;
alter table memberships enable row level security;
alter table tasks       enable row level security;
alter table entries     enable row level security;

-- Profils : on se voit soi-meme, et on voit ceux avec qui on partage un groupe.
-- Aucune politique INSERT : la fiche est creee par le declencheur a l'inscription.
create policy profiles_read_self on profiles for select using (id = auth.uid());

create policy profiles_read_teammates on profiles for select using (
  exists (
    select 1
    from memberships mine
    join memberships theirs on theirs.group_id = mine.group_id
    where mine.profile_id = auth.uid() and theirs.profile_id = profiles.id
  )
);

create policy profiles_update_self on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Groupes : lecture pour les membres, reglages reserves au chef.
-- Aucune politique INSERT : un groupe se cree uniquement via create_group().
create policy groups_read on groups for select using (is_member(id));

create policy groups_update on groups for update
  using (is_chef(id))
  with check (is_chef(id));

-- Appartenances : on voit ses co-equipiers, on ne modifie que sa propre fiche.
-- Le chef peut changer les roles, sauf celui de l'hote. Aucune politique
-- INSERT : on entre uniquement via join_group(), qui exige le code.
create policy memberships_read on memberships for select using (is_member(group_id));

create policy memberships_update_self on memberships for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy memberships_update_by_chef on memberships for update
  using (is_chef(group_id) and role <> 'host')
  with check (is_chef(group_id) and role <> 'host');

-- Aucune politique DELETE : quitter un groupe passe par leave_group(), qui
-- garantit qu'un groupe ne reste jamais sans chef. Une politique de suppression
-- directe permettrait a l'hote de contourner cette regle.

-- Taches : tout le monde propose, prend et corrige. C'est un groupe d'amis,
-- pas une organisation hierarchique.
create policy tasks_read on tasks for select using (is_member(group_id));

create policy tasks_insert on tasks for insert
  with check (is_member(group_id) and created_by = auth.uid());

create policy tasks_update on tasks for update
  using (is_member(group_id))
  with check (is_member(group_id));

create policy tasks_delete on tasks for delete using (is_member(group_id));

-- Lignes de compte : n'importe qui valide une tache faite, mais toujours en son
-- propre nom. On ne valide jamais a la place d'un autre.
create policy entries_read on entries for select using (is_member(group_id));

create policy entries_insert on entries for insert
  with check (is_member(group_id) and validated_by = auth.uid());

-- Pas d'UPDATE : une ligne de compte est un fait. Rouvrir une tache la
-- supprime, la revalider en ecrit une nouvelle.
create policy entries_delete on entries for delete using (is_member(group_id));
