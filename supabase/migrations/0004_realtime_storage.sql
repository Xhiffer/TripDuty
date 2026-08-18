-- Synchronisation temps reel.
-- Sans cela, le telephone de Lola n'apprend la validation d'Ismael qu'au
-- prochain rechargement. Les politiques RLS s'appliquent aussi aux messages
-- temps reel : on ne recoit que les changements des sejours dont on est membre.
alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table members;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table entries;

-- Photos de profil.
-- Elles sont aujourd'hui stockees en base64 dans l'etat de l'application
-- (src/screens/Join.tsx). Une photo de 256x256 pese ~20 ko, soit ~27 ko une
-- fois encodee en base64 : a dix personnes, cela alourdit chaque lecture de
-- l'etat pour rien. Elles vont dans un bucket, seule l'URL reste en base.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select
  using (bucket_id = 'avatars');

-- Chaque telephone n'ecrit que dans son propre dossier : avatars/<auth.uid()>/...
create policy avatars_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_replace on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
