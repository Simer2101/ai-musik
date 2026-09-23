-- Storage buckets and policies for generated audio and covers.
-- Run after schema.sql in the Supabase SQL editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'tracks',
    'tracks',
    true,
    52428800,
    array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'application/octet-stream']
  ),
  (
    'covers',
    'covers',
    true,
    2097152,
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read track audio" on storage.objects;
create policy "public read track audio"
on storage.objects for select
using (bucket_id = 'tracks');

drop policy if exists "service write track audio" on storage.objects;
create policy "service write track audio"
on storage.objects for insert
with check (
  bucket_id = 'tracks'
  and auth.role() = 'service_role'
);

drop policy if exists "service update track audio" on storage.objects;
create policy "service update track audio"
on storage.objects for update
using (bucket_id = 'tracks' and auth.role() = 'service_role');

drop policy if exists "service delete track audio" on storage.objects;
create policy "service delete track audio"
on storage.objects for delete
using (bucket_id = 'tracks' and auth.role() = 'service_role');

drop policy if exists "public read covers" on storage.objects;
create policy "public read covers"
on storage.objects for select
using (bucket_id = 'covers');

drop policy if exists "service write covers" on storage.objects;
create policy "service write covers"
on storage.objects for insert
with check (
  bucket_id = 'covers'
  and auth.role() = 'service_role'
);

drop policy if exists "service update covers" on storage.objects;
create policy "service update covers"
on storage.objects for update
using (bucket_id = 'covers' and auth.role() = 'service_role');

drop policy if exists "service delete covers" on storage.objects;
create policy "service delete covers"
on storage.objects for delete
using (bucket_id = 'covers' and auth.role() = 'service_role');
