'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireCreator } from '@/lib/auth/guards';

export type PostState = {
  ok?: boolean;
  error?: string;
  values?: { body?: string; tier_required_id?: string };
};

export async function createPost(_prev: PostState, formData: FormData): Promise<PostState> {
  const body = String(formData.get('body') ?? '').trim();
  const tierRaw = String(formData.get('tier_required_id') ?? '').trim();
  const action = String(formData.get('action') ?? 'draft');

  const values = { body, tier_required_id: tierRaw };

  if (body.length < 1 || body.length > 5000) {
    return { error: 'Post body must be 1-5000 characters.', values };
  }

  const { user, supabase } = await requireCreator();

  // If a tier was selected, confirm it belongs to this creator (defense in
  // depth — RLS already enforces this via the FK + posts insert policy).
  let tier_required_id: string | null = null;
  if (tierRaw && tierRaw !== 'public') {
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('id', tierRaw)
      .eq('creator_id', user.id)
      .maybeSingle();
    if (!tier) return { error: 'That tier no longer exists or is not yours.', values };
    tier_required_id = tier.id;
  }

  const publishNow = action === 'publish';

  const { error } = await supabase.from('posts').insert({
    creator_id: user.id,
    kind: 'text',
    body,
    tier_required_id,
    published_at: publishNow ? new Date().toISOString() : null,
  });

  if (error) {
    return { error: error.message, values };
  }

  // Revalidate the dashboard list AND the public profile (if published).
  revalidatePath('/app/dashboard/posts');
  if (publishNow) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', user.id)
      .single();
    if (profile?.handle) revalidatePath(`/c/${profile.handle}`);
  }

  redirect('/app/dashboard/posts');
}

export async function publishDraft(postId: string): Promise<void> {
  const { user, supabase } = await requireCreator();
  await supabase
    .from('posts')
    .update({ published_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('creator_id', user.id)
    .is('published_at', null);

  const { data: profile } = await supabase
    .from('profiles')
    .select('handle')
    .eq('id', user.id)
    .single();
  revalidatePath('/app/dashboard/posts');
  if (profile?.handle) revalidatePath(`/c/${profile.handle}`);
}

export async function deletePost(postId: string): Promise<void> {
  const { user, supabase } = await requireCreator();
  await supabase.from('posts').delete().eq('id', postId).eq('creator_id', user.id);
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle')
    .eq('id', user.id)
    .single();
  revalidatePath('/app/dashboard/posts');
  if (profile?.handle) revalidatePath(`/c/${profile.handle}`);
  redirect('/app/dashboard/posts');
}
