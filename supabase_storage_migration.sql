-- Bucket público para armazenar imagens do app (capa de viagem, looks da galeria)
insert into storage.buckets (id, name, public)
values ('trip-images', 'trip-images', true)
on conflict (id) do nothing;

-- Segue o mesmo modelo de acesso aberto (por device_id, sem auth) já usado
-- na tabela app_data em supabase_migration.sql.
create policy "Allow public read for trip-images"
on storage.objects for select
using (bucket_id = 'trip-images');

create policy "Allow insert for trip-images"
on storage.objects for insert
with check (bucket_id = 'trip-images');

create policy "Allow update for trip-images"
on storage.objects for update
using (bucket_id = 'trip-images')
with check (bucket_id = 'trip-images');

create policy "Allow delete for trip-images"
on storage.objects for delete
using (bucket_id = 'trip-images');
