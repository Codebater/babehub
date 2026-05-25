'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type OnboardingState = {
  ok?: boolean;
  error?: string;
  values?: { role?: string; handle?: string; display_name?: string; bio?: string };
};

const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

const RESERVED_HANDLES = new Set([
  // Top-level URL segments we control — block them as handles to prevent collisions
  // with /app, /api, /auth, /c, /admin, the existing SEO slugs, and locales.
  'admin', 'api', 'app', 'auth', 'c', 'dashboard', 'login', 'logout',
  'onboarding', 'settings', 'sitemap.xml', 'robots.txt',
  'en', 'de', 'es', 'fr', 'ja', 'pt', 'th',
  'support', 'help', 'contact', 'about', 'terms', 'privacy',
]);

export async function saveOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const role = String(formData.get('role') ?? '').trim();
  const handle = String(formData.get('handle') ?? '').trim().toLowerCase();
  const display_name = String(formData.get('display_name') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();

  const values = { role, handle, display_name, bio };

  if (role !== 'fan' && role !== 'creator') {
    return { error: 'Please pick whether you want to be a fan or a creator.', values };
  }
  if (!HANDLE_RE.test(handle)) {
    return {
      error:
        'Handle must be 3-30 characters: lowercase letters, numbers, and underscores only.',
      values,
    };
  }
  if (RESERVED_HANDLES.has(handle)) {
    return { error: 'That handle is reserved. Please pick a different one.', values };
  }
  if (display_name.length < 2 || display_name.length > 50) {
    return { error: 'Display name must be 2-50 characters.', values };
  }
  if (bio.length > 500) {
    return { error: 'Bio must be 500 characters or fewer.', values };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/app/login');

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      handle,
      display_name,
      bio,
      role,
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileError) {
    // 23505 = unique_violation on the handle citext index
    if (profileError.code === '23505') {
      return { error: 'That handle is already taken. Please pick another.', values };
    }
    return { error: profileError.message, values };
  }

  // Creators get a default creator_settings row so the dashboard, payouts,
  // and tier-management screens have a row to read/update on first visit.
  if (role === 'creator') {
    const { error: settingsError } = await supabase
      .from('creator_settings')
      .upsert({ creator_id: user.id }, { onConflict: 'creator_id' });
    if (settingsError) {
      return { error: settingsError.message, values };
    }
  }

  revalidatePath('/app/dashboard');
  revalidatePath(`/c/${handle}`);
  redirect('/app/dashboard');
}
