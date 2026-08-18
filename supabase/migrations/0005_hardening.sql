-- Durcissement, apres verification contre la base reelle.
--
-- Trois corrections, dont une faille avéree : un simple membre pouvait se
-- promouvoir lui-meme et prendre les reglages du groupe.

-- ---------------------------------------------------------------------------
-- 1. Un membre ne change plus son propre role
-- ---------------------------------------------------------------------------
--
-- `memberships_update_self` existait pour une seule chose : cocher « j'ai le
-- permis ». Mais elle autorisait la modification de toute la ligne, y compris
-- `role`. Verifie : un membre passait `role` a 'host' puis 'chef' par un simple
-- PATCH, et renommait ensuite le groupe -- `is_chef()` le croyait sur parole.
--
-- Une politique ne peut pas comparer l'ancienne et la nouvelle valeur d'une
-- colonne. On retire donc l'ecriture directe, et on expose le seul geste
-- legitime par une fonction qui, elle, ne touche qu'a `has_license`.
drop policy if exists memberships_update_self on memberships;

create or replace function set_my_license(target_group uuid, value boolean) returns void
  language plpgsql
  volatile
  security definer
  set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  update memberships
     set has_license = value
   where group_id = target_group and profile_id = auth.uid();
  if not found then
    raise exception 'Vous n''etes pas membre de ce groupe';
  end if;
end;
$$;

revoke all on function set_my_license(uuid, boolean) from public;
grant execute on function set_my_license(uuid, boolean) to authenticated;

-- Il reste `memberships_update_by_chef`, qui refuse deja d'atteindre 'host' :
-- la succession passe uniquement par leave_group().

-- ---------------------------------------------------------------------------
-- 2. Desactiver son compte
-- ---------------------------------------------------------------------------
--
-- Un compte ne se supprime pas : ses ecritures comptables font partie des
-- soldes de tous les autres, et les effacer fausserait le classement
-- retroactivement. On marque donc la fiche, on n'efface rien.
--
-- Refus si la personne est encore hote d'un groupe habite : partir en laissant
-- un groupe sans responsable est exactement ce que leave_group() empeche.
create or replace function deactivate_account() returns void
  language plpgsql
  volatile
  security definer
  set search_path = public
as $$
declare
  blocking integer;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select count(*) into blocking
    from memberships mine
   where mine.profile_id = auth.uid()
     and mine.role = 'host'
     and exists (
       select 1 from memberships others
        where others.group_id = mine.group_id
          and others.profile_id <> auth.uid()
     );

  if blocking > 0 then
    raise exception 'Quittez vos groupes ou designez un successeur avant de desactiver le compte'
      using errcode = 'invalid_parameter_value';
  end if;

  update profiles set deactivated_at = now() where id = auth.uid();
end;
$$;

revoke all on function deactivate_account() from public;
grant execute on function deactivate_account() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Supprimer reste au chef
-- ---------------------------------------------------------------------------
--
-- Proposer, prendre et corriger une tache restent ouverts a tous : c'est un
-- groupe d'amis. Mais supprimer une tache ou annuler une validation efface le
-- travail de quelqu'un d'autre, et l'interface reserve deja ces deux gestes au
-- chef. La base disait l'inverse : la restriction n'etait que decorative.
drop policy if exists tasks_delete on tasks;
create policy tasks_delete on tasks for delete using (is_chef(group_id));

drop policy if exists entries_delete on entries;
create policy entries_delete on entries for delete using (is_chef(group_id));
