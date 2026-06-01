-- Migration 0026: optional applicant photos on the apply form.
alter table public.survey_submissions
  add column if not exists image_paths text[] not null default '{}';

-- Private bucket for apply-form photos (uploaded server-side via service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('applications', 'applications', false, 5242880,
        array['image/jpeg','image/jpg','image/png','image/webp'])
on conflict (id) do nothing;
