-- Fluide : une ligne par compte, toutes les données de l'app en JSON.
-- À coller dans Supabase › SQL Editor › New query, puis Run.

create table if not exists public.fluide_state (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Projet créé sans « Automatically expose new tables » : seule cette table est ouverte, aux comptes connectés seulement.
grant select, insert, update on public.fluide_state to authenticated;

-- Chaque compte ne voit et ne modifie que sa propre ligne : la clé publique peut rester dans le dépôt.
alter table public.fluide_state enable row level security;

create policy "Lire ses données" on public.fluide_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Créer ses données" on public.fluide_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Mettre à jour ses données" on public.fluide_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ——— Pas du jour envoyés par le Raccourci iOS « Pas du jour » (livrables/fluide/raccourci-pas.md)
-- Le Raccourci ne peut pas garder la session (elle expire en une heure) ni le mot de passe : il envoie une clé
-- Raccourci, propre au compte, qui ne sert qu'à écrire les pas. On n'en garde que l'empreinte SHA-256.

create table if not exists public.fluide_raccourci (
  user_id uuid primary key references auth.users on delete cascade,
  key_hash text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.fluide_pas (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  steps integer not null check (steps between 0 and 60000),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Le compte connecté lit ses pas et voit (ou supprime) sa clé ; personne n'y écrit directement.
grant select on public.fluide_pas to authenticated;
grant select, delete on public.fluide_raccourci to authenticated;
alter table public.fluide_pas enable row level security;
alter table public.fluide_raccourci enable row level security;
create policy "Lire ses pas" on public.fluide_pas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Voir sa clé Raccourci" on public.fluide_raccourci
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Supprimer sa clé Raccourci" on public.fluide_raccourci
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Nouvelle clé pour le compte connecté (remplace l'ancienne). Elle n'est rendue qu'une fois.
create or replace function public.fluide_nouvelle_cle()
returns text language plpgsql security definer set search_path = '' as $$
declare
  cle text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null then raise exception 'Connexion requise' using errcode = '28000'; end if;
  insert into public.fluide_raccourci (user_id, key_hash, created_at)
  values (auth.uid(), encode(sha256(convert_to(cle, 'UTF8')), 'hex'), now())
  on conflict (user_id) do update set key_hash = excluded.key_hash, created_at = now();
  return cle;
end $$;

-- Appelée par le Raccourci, sans connexion : la clé désigne le compte. Jour par défaut : aujourd'hui à Paris.
create or replace function public.fluide_envoyer_pas(cle text, pas integer, jour date default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
  d date := coalesce(jour, (now() at time zone 'Europe/Paris')::date);
begin
  select user_id into uid from public.fluide_raccourci
  where key_hash = encode(sha256(convert_to(coalesce(cle, ''), 'UTF8')), 'hex');
  if uid is null then raise exception 'Clé Raccourci inconnue : recrée-la dans Fluide' using errcode = '28000'; end if;
  if pas is null or pas < 0 or pas > 60000 then raise exception 'Nombre de pas invalide' using errcode = '22023'; end if;
  if d < (now() at time zone 'Europe/Paris')::date - 7 or d > (now() at time zone 'Europe/Paris')::date + 1 then
    raise exception 'Jour hors de la dernière semaine' using errcode = '22023';
  end if;
  insert into public.fluide_pas (user_id, day, steps, updated_at) values (uid, d, pas, now())
  on conflict (user_id, day) do update set steps = excluded.steps, updated_at = now();
  return pas;
end $$;

revoke all on function public.fluide_nouvelle_cle() from public, anon;
revoke all on function public.fluide_envoyer_pas(text, integer, date) from public;
grant execute on function public.fluide_nouvelle_cle() to authenticated;
grant execute on function public.fluide_envoyer_pas(text, integer, date) to anon, authenticated;
