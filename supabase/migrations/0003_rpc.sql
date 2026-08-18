-- Les deux seules portes d'entree d'un sejour.
--
-- Creer un sejour et le rejoindre sont les deux moments ou l'on ecrit dans une
-- table dont on n'est pas encore membre. Les politiques RLS ne peuvent donc pas
-- s'appliquer : ces operations passent par des fonctions SECURITY DEFINER, qui
-- verifient elles-memes ce qu'il faut verifier.

-- Code de partage : alphabet sans ambiguite visuelle et sans voyelle, pour ne
-- pas former de mot par hasard et pour se dicter au telephone sans confondre.
create or replace function generate_join_code() returns text
  language plpgsql
  volatile
as $$
declare
  alphabet constant text := '23456789bcdfghjkmnpqrstvwxz';
  candidate text;
begin
  loop
    candidate := '';
    for _ in 1..10 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from trips where join_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function create_trip(
  trip_name    text,
  start_date   date,
  end_date     date,
  owner_name   text,
  owner_photo  text default null,
  owner_licence boolean default false,
  penalty      integer default 30
) returns trips
  language plpgsql
  volatile
  security definer
  set search_path = public
as $$
declare
  new_trip trips;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  insert into trips (name, start_date, end_date, penalty, join_code)
  values (trip_name, start_date, end_date, penalty, generate_join_code())
  returning * into new_trip;

  insert into members (trip_id, auth_user_id, name, photo_url, has_license, role)
  values (new_trip.id, auth.uid(), owner_name, owner_photo, owner_licence, 'owner');

  return new_trip;
end;
$$;

create or replace function join_trip(
  code         text,
  member_name  text,
  member_photo text default null,
  has_licence  boolean default false
) returns members
  language plpgsql
  volatile
  security definer
  set search_path = public
as $$
declare
  target   trips;
  existing members;
  created  members;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select * into target from trips where join_code = lower(trim(code));
  if not found then
    raise exception 'Code de sejour inconnu' using errcode = 'no_data_found';
  end if;

  -- Revenir sur le meme sejour depuis le meme telephone n'est pas une erreur :
  -- on retrouve simplement sa place.
  select * into existing from members
   where trip_id = target.id and auth_user_id = auth.uid();
  if found then
    return existing;
  end if;

  insert into members (trip_id, auth_user_id, name, photo_url, has_license, role)
  values (target.id, auth.uid(), member_name, member_photo, has_licence, 'member')
  returning * into created;

  return created;
exception
  when unique_violation then
    raise exception 'Ce prenom est deja pris dans ce sejour' using errcode = 'unique_violation';
end;
$$;

-- Le code de partage suffit a entrer : c'est le seul appel autorise sans etre
-- deja membre. Tout le reste passe par les politiques RLS.
revoke all on function create_trip(text, date, date, text, text, boolean, integer) from public;
revoke all on function join_trip(text, text, text, boolean) from public;
grant execute on function create_trip(text, date, date, text, text, boolean, integer) to authenticated;
grant execute on function join_trip(text, text, text, boolean) to authenticated;
