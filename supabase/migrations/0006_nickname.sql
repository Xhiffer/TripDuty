-- Le pseudo affiché dans les groupes.
--
-- Le prénom et le nom restent l'identité du compte ; le pseudo est ce que
-- les autres voient dans un groupe quand il est renseigné. Facultatif :
-- vide, on retombe sur le prénom.

alter table profiles add column if not exists nickname text default '';

alter table profiles drop constraint if exists profiles_nickname_length;
alter table profiles add constraint profiles_nickname_length check (length(nickname) <= 24);
