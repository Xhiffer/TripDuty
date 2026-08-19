-- Les depenses du groupe, separees des taches.
--
-- Les points repartissent l'effort, les euros repartissent l'argent : les
-- deux comptes ne se melangent jamais. Une depense a un seul payeur et se
-- partage a parts egales entre les participants coches.
--
-- Les montants sont en centimes d'euro, pour que la division tombe juste et
-- qu'aucun arrondi ne se perde.

alter table groups add column if not exists photo_url text;

create table if not exists expenses (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid        not null references groups (id) on delete cascade,
  title           text        not null check (length(trim(title)) between 1 and 80),
  emoji           text        not null default '🧾',
  -- Centimes : 75,00 euros vaut 7500.
  amount_cents    integer     not null check (amount_cents > 0 and amount_cents <= 100000000),
  payer_id        uuid        not null references profiles (id) on delete cascade,
  participant_ids uuid[]      not null check (array_length(participant_ids, 1) >= 1),
  date            date        not null,
  receipt_url     text,
  created_by      uuid        references profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists expenses_by_group on expenses (group_id);

alter table expenses enable row level security;

-- On ne voit et on ne touche que les depenses des groupes dont on est membre.
-- Tout le monde peut corriger une depense : le groupe fonctionne a la
-- confiance, et une erreur de saisie doit pouvoir etre reparee par celui qui
-- la remarque, pas seulement par celui qui l'a faite.
drop policy if exists expenses_read on expenses;
create policy expenses_read on expenses
  for select using (
    exists (
      select 1 from memberships m
      where m.group_id = expenses.group_id and m.account_id = auth.uid()
    )
  );

drop policy if exists expenses_write on expenses;
create policy expenses_write on expenses
  for all using (
    exists (
      select 1 from memberships m
      where m.group_id = expenses.group_id and m.account_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from memberships m
      where m.group_id = expenses.group_id and m.account_id = auth.uid()
    )
  );
