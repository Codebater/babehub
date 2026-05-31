-- Migration 0022: add gender to profiles
-- Values: 'man' | 'woman' | 'non_binary' | null (not disclosed)
alter table public.profiles
  add column if not exists gender text
    check (gender in ('man', 'woman', 'non_binary'));
