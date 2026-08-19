-- Un groupe sans date de fin.
--
-- Des vacances ont un debut et une fin, une coloc ou un couple n'en ont pas.
-- `end_date` devient facultative : vide, le groupe court indefiniment et le
-- planning affiche une fenetre glissante a partir d'aujourd'hui.

alter table groups alter column end_date drop not null;

-- La contrainte doit accepter le vide sans cesser de refuser une fin
-- anterieure au debut.
alter table groups drop constraint if exists groups_check;
alter table groups drop constraint if exists groups_dates_order;
alter table groups add constraint groups_dates_order
  check (end_date is null or end_date >= start_date);
