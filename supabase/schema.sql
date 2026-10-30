-- Fluide : une ligne par compte, toutes les données de l'app en JSON.
-- À coller dans Supabase › SQL Editor › New query, puis Run.

create table if not exists public.fluide_state (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Chaque compte ne voit et ne modifie que sa propre ligne : la clé publique peut rester dans le dépôt.
alter table public.fluide_state enable row level security;

create policy "Lire ses données" on public.fluide_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Créer ses données" on public.fluide_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Mettre à jour ses données" on public.fluide_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
