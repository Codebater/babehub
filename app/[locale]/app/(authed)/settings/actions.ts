'use server';

import { revalidatePath } from 'next/cache';
import { requireOnboarded } from '@/lib/auth/guards';

export type SettingsState = {
  ok?: boolean;
  error?: string;
  values?: { handle?: string; display_name?: string; bio?: string };
};

const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

// Same reserved set as onboarding — kept in sync so settings can't sneak past it.
const RESERVED_HANDLES = new Set([
  'admin', 'api', 'app', 'auth', 'c', 'dashboard', 'login', 'logout',
  'onboarding', 'settings', 'subscriptions', 'sitemap.xml', 'robots.txt',
  'en', 'de', 'es', 'fr', 'ja', 'pt', 'th',
  'support', 'help', 'contact', 'about', 'terms', 'privacy',
]);

export async function updateProfileText(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const handle = String(formData.get('handle') ?? '').trim().toLowerCase();
  const display_name = String(formData.get('display_name') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();

  const values = { handle, display_name, bio };

  if (!HANDLE_RE.test(handle)) {
    return {
      error: 'Handle must be 3-30 chars: lowercase letters / numbers / underscores.',
      values,
    };
  }
  if (RESERVED_HANDLES.has(handle)) {
    return { error: 'That handle is reserved. Please pick another.', values };
  }
  if (display_name.length < 2 || display_name.length > 50) {
    return { error: 'Display name must be 2-50 characters.', values };
  }
  if (bio.length > 500) {
    return { error: 'Bio must be 500 characters or fewer.', values };
  }

  const { user, profile, supabase } = await requireOnboarded();
  const previousHandle = profile.handle;

  const { error } = await supabase
    .from('profiles')
    .update({ handle, display_name, bio })
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
      return { error: 'That handle is already taken. Please pick another.', values };
    }
    return { error: error.message, values };
  }

  // Refresh anything that depends on the profile so the new handle / name /
  // bio show up immediately on next render.
  revalidatePath('/app/dashboard');
  revalidatePath('/app/settings');
  revalidatePath(`/c/${handle}`);
  if (previousHandle !== handle) {
    revalidatePath(`/c/${previousHandle}`);
  }

  return { ok: true, values };
}

/**
 * Promote a fan to a creator. One-way upgrade — there's no "downgrade to
 * fan" path on purpose: creators have tiers / posts / subscriptions which
 * would need a teardown flow we don't have yet.
 */
export async function switchToCreator(): Promise<SettingsState> {
  const { user, profile, supabase } = await requireOnboarded();

  if (profile.role === 'creator') {
    return { ok: true };
  }

  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'creator' })
    .eq('id', user.id);
  if (roleError) return { error: roleError.message };

  // Ensure creator_settings exists so tier-management / payouts screens
  // have a row to read on first visit.
  const { error: settingsError } = await supabase
    .from('creator_settings')
    .upsert({ creator_id: user.id }, { onConflict: 'creator_id' });
  if (settingsError) return { error: settingsError.message };

  revalidatePath('/app/dashboard');
  revalidatePath('/app/settings');
  revalidatePath(`/c/${profile.handle}`);
  return { ok: true };
}
