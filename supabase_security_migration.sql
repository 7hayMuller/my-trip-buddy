-- Troca o modelo de acesso aberto por device_id (supabase_migration.sql e
-- supabase_storage_migration.sql) por dados ligados ao usuário logado.
-- Rodar uma vez no SQL Editor do Supabase.

/* ── tabela por usuário ─────────────────────────────────────────── */

-- Uma linha por usuário. O on delete cascade apaga os dados junto com a
-- conta (delete_user em supabase_delete_user_migration.sql).
create table if not exists public.user_data (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  trips jsonb not null default '[]'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  looks jsonb not null default '[]'::jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.user_data enable row level security;

create policy "Users read own data"
on public.user_data for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users insert own data"
on public.user_data for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users update own data"
on public.user_data for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users delete own data"
on public.user_data for delete
to authenticated
using ((select auth.uid()) = user_id);

/* ── tabela antiga: fecha o acesso ─────────────────────────────── */

-- Com RLS ligado e sem policies, ninguém acessa pelo client. Os dados locais
-- de cada aparelho sobem para user_data no próximo login; depois de conferir
-- que está tudo certo, dá pra apagar a tabela com: drop table public.app_data;
drop policy if exists "Allow insert and update for all" on public.app_data;
drop policy if exists "Allow select for all" on public.app_data;

/* ── storage: cada usuário só mexe na própria pasta ─────────────── */

-- Novos uploads vão para trip-images/<user_id>/covers/... e
-- trip-images/<user_id>/looks/.... O bucket continua público para leitura
-- pela URL (é assim que as imagens aparecem no app), mas listar, enviar,
-- alterar e apagar ficam restritos à pasta do próprio usuário.
drop policy if exists "Allow public read for trip-images" on storage.objects;
drop policy if exists "Allow insert for trip-images" on storage.objects;
drop policy if exists "Allow update for trip-images" on storage.objects;
drop policy if exists "Allow delete for trip-images" on storage.objects;

create policy "Users list own trip-images"
on storage.objects for select
to authenticated
using (bucket_id = 'trip-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload own trip-images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'trip-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users update own trip-images"
on storage.objects for update
to authenticated
using (bucket_id = 'trip-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'trip-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete own trip-images"
on storage.objects for delete
to authenticated
using (bucket_id = 'trip-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
