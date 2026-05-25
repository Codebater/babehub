'use server';

import { revalidatePath } from 'next/cache';
import { requireOnboarded } from '@/lib/auth/guards';
import type { Database } from '@/types/supabase';

/**
 * Server actions for the professional profile editor at
 * `/app/professional/edit`.
 *
 * The flow upserts the `professional_profiles` row keyed by user_id
 * (1:1 with `profiles`). Validation is intentionally light at the
 * server-action layer because the DB enforces every constraint via
 * CHECKs (visibility, collaboration_status, availability) and types
 * (numeric ranges, array shapes).
 *
 * On success we revalidate three caches:
 *   - /app/professional/edit (the editor itself)
 *   - /c/{handle}             (the public surface where the Professional tab renders)
 *   - /talent                 (the future directory; safe no-op for now)
 */

type ProfessionalProfileInput = {
  headline: string;
  about: string;
  hourly_rate_cents: number | null;
  currency: string;
  region: string | null;
  languages: string[];
  skills: string[];
  categories: string[];
  collaboration_status: 'open' | 'selective' | 'closed';
  availability: 'available' | 'busy' | 'unavailable';
  visibility: 'public' | 'recruiters_only' | 'private';
  links: Record<string, string>;
};

export type SaveProfessionalProfileResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Trim, dedupe and lower-cap a comma-separated input that the client
 * forwards as a plain string. Used for skills / categories / languages
 * so server logic doesn't have to repeat the parsing.
 */
function csvToArray(raw: string, opts?: { limit?: number; lower?: boolean }): string[] {
  const limit = opts?.limit ?? 30;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of raw.split(/[,\n]/)) {
    let v = piece.trim();
    if (!v) continue;
    if (opts?.lower) v = v.toLowerCase();
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= limit) break;
  }
  return out;
}

export async function saveProfessionalProfile(
  formData: FormData,
): Promise<SaveProfessionalProfileResult> {
  const { user, profile, supabase } = await requireOnboarded();

  // Editor now sends `hourly_rate` in whole currency units (1 = 1 EUR);
  // multiply by 100 before persisting in professional_profiles
  // .hourly_rate_cents. The legacy `hourly_rate_cents` field name is
  // kept as a fallback so any in-flight draft doesn't lose its value.
  const rawWhole = (formData.get('hourly_rate') as string | null)?.trim() ?? '';
  const rawCents = (formData.get('hourly_rate_cents') as string | null)?.trim() ?? '';
  let rate: number | null = null;
  if (rawWhole) {
    const n = Number(rawWhole);
    if (Number.isFinite(n) && n >= 0) rate = Math.round(n * 100);
  } else if (rawCents) {
    const n = Number(rawCents);
    if (Number.isFinite(n) && n >= 0) rate = Math.round(n);
  }

  const visibility = (formData.get('visibility') as string) || 'public';
  const collaboration_status = (formData.get('collaboration_status') as string) || 'open';
  const availability = (formData.get('availability') as string) || 'available';

  const input: ProfessionalProfileInput = {
    headline: ((formData.get('headline') as string) || '').trim().slice(0, 140),
    about: ((formData.get('about') as string) || '').trim().slice(0, 2000),
    hourly_rate_cents: rate,
    currency: ((formData.get('currency') as string) || 'EUR').toUpperCase().slice(0, 3),
    region: ((formData.get('region') as string) || '').trim() || null,
    languages: csvToArray((formData.get('languages') as string) || '', { lower: true }),
    skills: csvToArray((formData.get('skills') as string) || '', { lower: true, limit: 20 }),
    categories: csvToArray((formData.get('categories') as string) || '', {
      lower: true,
      limit: 8,
    }),
    collaboration_status:
      collaboration_status === 'open' ||
      collaboration_status === 'selective' ||
      collaboration_status === 'closed'
        ? collaboration_status
        : 'open',
    availability:
      availability === 'available' ||
      availability === 'busy' ||
      availability === 'unavailable'
        ? availability
        : 'available',
    visibility:
      visibility === 'public' ||
      visibility === 'recruiters_only' ||
      visibility === 'private'
        ? visibility
        : 'public',
    links: parseLinks(formData),
  };

  // Upsert against the primary key user_id so we either INSERT a new
  // row or UPDATE the existing one in a single round-trip. Triggers in
  // the DB refresh search_doc + touch updated_at automatically.
  const { error } = await supabase
    .from('professional_profiles')
    .upsert({ user_id: user.id, ...input }, { onConflict: 'user_id' });

  if (error) return { ok: false, error: error.message };

  // Adding 'recruiter' to roles[] makes the recruiter dashboard show up
  // in the ProfileMenu without forcing the user through a separate
  // toggle. Keeping it idempotent (array_append-style dedupe).
  // Skipped on first save — the editor is for everyone who wants a
  // professional identity, not only recruiters.

  revalidatePath('/app/professional/edit');
  revalidatePath(`/c/${profile.handle}`);
  revalidatePath('/talent');
  return { ok: true };
}

/**
 * Helper: pull `link_<name>=<url>` rows out of the form data into a
 * single jsonb-friendly object. Empty values are dropped.
 */
function parseLinks(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') continue;
    if (!key.startsWith('link_')) continue;
    const name = key.slice('link_'.length);
    const v = value.trim();
    if (v && name) out[name] = v;
  }
  return out;
}

/**
 * Add or remove a single role on `profiles.roles[]`. Called from the
 * ProfileMenu "Recruiter mode" toggle so the user can flip themselves
 * into the recruiter UI without leaving the popover.
 */
export async function toggleRole(
  role: 'recruiter' | 'agency' | 'brand' | 'service_provider',
  action: 'add' | 'remove',
): Promise<SaveProfessionalProfileResult> {
  const { user, supabase } = await requireOnboarded();

  // Fetch fresh array so we don't trample concurrent edits.
  const { data: existing } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single();
  const current = new Set<string>(existing?.roles ?? []);
  if (action === 'add') current.add(role);
  else current.delete(role);

  const { error } = await supabase
    .from('profiles')
    .update({ roles: Array.from(current) as Database['public']['Enums']['user_role'][] })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/app/dashboard');
  return { ok: true };
}
