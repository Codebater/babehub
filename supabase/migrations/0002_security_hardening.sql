-- Phase 1 security hardening — addresses Supabase database-linter warnings
-- raised after applying 0001_phase1_init.sql.
--
-- 1. Pin `touch_updated_at`'s search_path so a hostile schema in `search_path`
--    can't shadow the built-in operators the trigger uses.
-- 2. Revoke EXECUTE on `handle_new_user` from anyone other than the trigger
--    machinery — it's only invoked by the `on_auth_user_created` trigger and
--    must never be callable via PostgREST's /rpc/ endpoint.
--
-- `has_active_subscription` keeps its current grants intentionally: it returns
-- a boolean (no data leak risk) and is invoked from every `posts` RLS policy
-- evaluation, which needs `authenticated` + `anon` execute.

alter function public.touch_updated_at() set search_path = '';

revoke execute on function public.handle_new_user() from public, anon, authenticated;
