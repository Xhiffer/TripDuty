-- Les deux seules portes d'entree d'un groupe.
--
-- Creer un groupe et le rejoindre sont les deux moments ou l'on ecrit dans une
-- table dont on n'est pas encore membre. Les politiques RLS ne peuvent donc pas
-- s'appliquer : ces operations passent par des fonctions SECURITY DEFINER, qui
-- verifient elles-memes ce qu'il faut verifier.

-- Meme alphabet que makeInviteCode() dans src/lib/identity.ts : ni O/0 ni I/1,
-- pour qu'un code se dicte au telephone sans confusion.
create or replace function generate_invite_code() returns text
  language plpgsql
  volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for _ in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from groups where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function create_group(
  group_name  text,
  kind        group_kind,
  emoji       text,
  color       text,
  start_date  date,
  end_date    date,
  has_licence boolean default false,
  penalty     integer default 30
) returns groups
  language plpgsql
  volatile
  security definer
  set search_path = public
as $$
declare
  created groups;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  insert into groups (kind, name, emoji, color, start_date, end_date, host_id, invite_code, penalty)
  values (kind, group_name, emoji, color, start_date, end_date, auth.uid(), generate_invite_code(), penalty)
  returning * into created;

  -- Celui qui cree le groupe en est l'hote, et cela ne se retire pas.
  insert into memberships (group_id, profile_id, role, has_license)
  values (created.id, auth.uid(), 'host', has_licence);

  return created;
end;
$$;

create or replace function join_group(
  code        text,
  has_licence boolean default false
) returns memberships
  language plpgsql
  volatile
  security definer
  set search_path = public
as $$
declare
  target   groups;
  existing memberships;
  created  memberships;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select * into target from groups where invite_code = upper(trim(code));
  if not found then
    raise exception 'Code de groupe inconnu' using errcode = 'no_data_found';
  end if;

  -- Revenir sur un groupe deja rejoint n'est pas une erreur : on retrouve
  -- simplement sa place.
  select * into existing from memberships
   where group_id = target.id and profile_id = auth.uid();
  if found then
    return existing;
  end if;

  insert into memberships (group_id, profile_id, role, has_license)
  values (target.id, auth.uid(), 'member', has_licence)
  returning * into created;

  return created;
end;
$$;

-- Le code d'invitation suffit a entrer : ce sont les deux seuls appels autorises
-- sans etre deja membre. Tout le reste passe par les politiques RLS.
revoke all on function create_group(text, group_kind, text, text, date, date, boolean, integer) from public;
revoke all on function join_group(text, boolean) from public;
grant execute on function create_group(text, group_kind, text, text, date, date, boolean, integer) to authenticated;
grant execute on function join_group(text, boolean) to authenticated;

-- Quitter un groupe.
--
-- Un groupe ne doit jamais se retrouver sans responsable. Trois cas :
--   * un simple membre part sans ceremonie ;
--   * l'hote part et il reste une seule personne : c'est elle, inutile de
--     le lui demander ;
--   * l'hote part et il reste plusieurs personnes : il doit designer son
--     successeur.
-- Si plus personne ne reste, le groupe disparait : un groupe vide n'a pas de
-- sens, et le garder laisserait un code d'invitation actif dans la nature.
--
-- Cette fonction est le seul chemin possible : `memberships` n'a pas de
-- politique DELETE, sinon l'hote contournerait la regle par une suppression
-- directe.
create or replace function leave_group(
  target_group uuid,
  new_host     uuid default null
) returns void
  language plpgsql
  volatile
  security definer
  set search_path = public
as $$
declare
  my_role member_role;
  others  integer;
  heir    uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select role into my_role from memberships
   where group_id = target_group and profile_id = auth.uid();
  if not found then
    raise exception 'Vous n''etes pas membre de ce groupe';
  end if;

  if my_role <> 'host' then
    delete from memberships where group_id = target_group and profile_id = auth.uid();
    return;
  end if;

  select count(*) into others from memberships
   where group_id = target_group and profile_id <> auth.uid();

  if others = 0 then
    -- Le dernier ferme la porte. Taches et ecritures partent en cascade.
    delete from groups where id = target_group;
    return;
  end if;

  if others = 1 then
    select profile_id into heir from memberships
     where group_id = target_group and profile_id <> auth.uid();
  else
    if new_host is null then
      raise exception 'Choisissez un nouveau chef avant de quitter le groupe'
        using errcode = 'invalid_parameter_value';
    end if;
    select profile_id into heir from memberships
     where group_id = target_group and profile_id = new_host and profile_id <> auth.uid();
    if not found then
      raise exception 'Le nouveau chef doit etre un autre membre du groupe'
        using errcode = 'invalid_parameter_value';
    end if;
  end if;

  update memberships set role = 'host' where group_id = target_group and profile_id = heir;
  update groups set host_id = heir where id = target_group;
  delete from memberships where group_id = target_group and profile_id = auth.uid();
end;
$$;

revoke all on function leave_group(uuid, uuid) from public;
grant execute on function leave_group(uuid, uuid) to authenticated;
