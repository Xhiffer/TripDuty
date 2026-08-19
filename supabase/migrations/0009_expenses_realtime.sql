-- Les depenses en temps reel, et leurs photos hors de la base.
--
-- Sans cela, une depense saisie par Lola n'apparait sur le telephone d'Ismael
-- qu'au prochain rechargement : les taches se synchronisent, pas l'argent.

do $$
begin
  alter publication supabase_realtime add table expenses;
exception
  when duplicate_object then null;
end
$$;

-- Photos de groupe et tickets de caisse.
-- Meme raison que les avatars : une photo en base64 dans une colonne texte
-- repart dans chaque lecture de l'etat, pour tout le monde, a chaque
-- changement. Un ticket de 300 ko lu vingt fois par jour par neuf personnes,
-- c'est 54 Mo de trafic pour une seule depense. Le bucket sert les fichiers
-- une fois, puis le cache du navigateur fait le reste.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists photos_read on storage.objects;
create policy photos_read on storage.objects for select
  using (bucket_id = 'photos');

-- On ecrit dans le dossier d'un groupe dont on est membre.
drop policy if exists photos_write on storage.objects;
create policy photos_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and exists (
      select 1 from memberships m
      where m.account_id = auth.uid()
        and m.group_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists photos_replace on storage.objects;
create policy photos_replace on storage.objects for update to authenticated
  using (
    bucket_id = 'photos'
    and exists (
      select 1 from memberships m
      where m.account_id = auth.uid()
        and m.group_id::text = (storage.foldername(name))[1]
    )
  );
