import { createClient } from '@/lib/supabase/server';

/**
 * Minimal creator identity used to attribute external catalog videos
 * (eporner cards) to a platform creator. Same shape passed to
 * `VideoCard` so its avatar pill can render server-side.
 */
export type PrimaryCreator = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Resolve the platform's "primary creator" — the user that authored
 * catalog videos for attribution purposes. Order of resolution:
 *
 *   1. `NEXT_PUBLIC_PRIMARY_CREATOR_HANDLE` env var, when set
 *   2. First profile with role='creator', sorted by created_at asc
 *   3. null, falls back to no attribution
 *
 * Cached per-render (no extra round-trip if called multiple times in
 * the same request) by relying on the cookie-aware Supabase client's
 * built-in request memo. Safe to import from any server component.
 */
export async function loadPrimaryCreator(): Promise<PrimaryCreator | null> {
  const supabase = await createClient();
  const envHandle = process.env.NEXT_PUBLIC_PRIMARY_CREATOR_HANDLE?.trim();

  let query = supabase
    .from('profiles')
    .select('handle, display_name, avatar_url')
    .order('created_at', { ascending: true })
    .limit(1);

  if (envHandle) {
    query = supabase
      .from('profiles')
      .select('handle, display_name, avatar_url')
      .eq('handle', envHandle)
      .limit(1);
  } else {
    query = supabase
      .from('profiles')
      .select('handle, display_name, avatar_url')
      .eq('role', 'creator')
      .order('created_at', { ascending: true })
      .limit(1);
  }

  const { data } = await query.maybeSingle();
  if (!data) return null;
  return {
    handle: data.handle,
    displayName: data.display_name || data.handle,
    avatarUrl: data.avatar_url,
  };
}
