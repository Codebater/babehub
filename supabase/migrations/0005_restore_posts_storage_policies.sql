-- The 4 storage.objects RLS policies for the `posts` bucket were declared
-- in 0001_phase1_init.sql but never landed in the database — the matching
-- policies for `avatars` and `covers` from the same migration are present,
-- so this was an isolated failure (cause unclear: possibly a per-statement
-- error swallowed by the MCP apply_migration call). The user hit it when
-- the post composer tried to upload an image and got a permission error
-- from Supabase Storage.
--
-- Also drops two single-file policies left over from manually clicking
-- "Generate policy" in the Supabase dashboard for one specific file path —
-- those don't help us and clutter the policy list.

drop policy if exists "Give access to a file to user 1rma4z_0" on storage.objects;
drop policy if exists "Give access to a file to user 1rma4z_1" on storage.objects;

drop policy if exists "owner read post storage" on storage.objects;
drop policy if exists "owner write post storage" on storage.objects;
drop policy if exists "owner update post storage" on storage.objects;
drop policy if exists "owner delete post storage" on storage.objects;

create policy "owner read post storage"
  on storage.objects for select
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner write post storage"
  on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner update post storage"
  on storage.objects for update
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner delete post storage"
  on storage.objects for delete
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
