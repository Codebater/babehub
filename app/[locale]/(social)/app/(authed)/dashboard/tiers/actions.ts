'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireCreator } from '@/lib/auth/guards';

export type TierState = {
  ok?: boolean;
  error?: string;
  values?: {
    name?: string;
    description?: string;
    price_dollars?: string;
    currency?: string;
    perks?: string;
    active?: string;
  };
};

const SUPPORTED_CURRENCIES = new Set(['USD', 'EUR']);

function parsePerks(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.length <= 120)
    .slice(0, 10);
}

function parseAndValidate(formData: FormData): { values: NonNullable<TierState['values']>; parsed?: { name: string; description: string; price_cents: number; currency: string; perks: string[]; active: boolean }; error?: string } {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price_dollars = String(formData.get('price_dollars') ?? '').trim();
  const currency = String(formData.get('currency') ?? 'USD').trim().toUpperCase();
  const perks = String(formData.get('perks') ?? '');
  const active = formData.get('active') === 'on';

  const values = { name, description, price_dollars, currency, perks, active: active ? 'on' : '' };

  if (name.length < 1 || name.length > 50) {
    return { values, error: 'Tier name must be 1-50 characters.' };
  }
  if (description.length > 200) {
    return { values, error: 'Description must be 200 characters or fewer.' };
  }
  if (!SUPPORTED_CURRENCIES.has(currency)) {
    return { values, error: `Currency must be one of: ${[...SUPPORTED_CURRENCIES].join(', ')}` };
  }
  const priceNumber = Number(price_dollars);
  if (!Number.isFinite(priceNumber) || priceNumber < 0 || priceNumber > 10_000) {
    return { values, error: 'Price must be between 0 and 10000.' };
  }
  // Convert dollars/euros to cents, rounded to nearest cent.
  const price_cents = Math.round(priceNumber * 100);

  return {
    values,
    parsed: {
      name,
      description,
      price_cents,
      currency,
      perks: parsePerks(perks),
      active,
    },
  };
}

export async function createTier(_prev: TierState, formData: FormData): Promise<TierState> {
  const { values, parsed, error } = parseAndValidate(formData);
  if (error || !parsed) return { error: error ?? 'Invalid input.', values };

  const { user, supabase } = await requireCreator();

  // Append to the end of the sort order so newer tiers show after existing ones.
  const { data: existing } = await supabase
    .from('subscription_tiers')
    .select('sort_order')
    .eq('creator_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error: insertError } = await supabase.from('subscription_tiers').insert({
    creator_id: user.id,
    name: parsed.name,
    description: parsed.description,
    price_cents: parsed.price_cents,
    currency: parsed.currency,
    perks: parsed.perks,
    active: parsed.active,
    sort_order: nextSortOrder,
  });

  if (insertError) {
    return { error: insertError.message, values };
  }

  revalidatePath('/app/dashboard/tiers');
  return { ok: true };
}

export async function updateTier(tierId: string, _prev: TierState, formData: FormData): Promise<TierState> {
  const { values, parsed, error } = parseAndValidate(formData);
  if (error || !parsed) return { error: error ?? 'Invalid input.', values };

  const { user, supabase } = await requireCreator();

  const { error: updateError } = await supabase
    .from('subscription_tiers')
    .update({
      name: parsed.name,
      description: parsed.description,
      price_cents: parsed.price_cents,
      currency: parsed.currency,
      perks: parsed.perks,
      active: parsed.active,
    })
    .eq('id', tierId)
    .eq('creator_id', user.id); // defense in depth — RLS already enforces this

  if (updateError) {
    return { error: updateError.message, values };
  }

  revalidatePath('/app/dashboard/tiers');
  revalidatePath(`/app/dashboard/tiers/${tierId}`);
  return { ok: true };
}

/**
 * Soft-delete: existing subscriptions reference subscription_tiers via FK
 * with `on delete restrict`. Archive (active=false) hides the tier from
 * the creator profile and from new-subscriber flows without breaking
 * existing subs. Use this for "delete" UX.
 */
export async function archiveTier(tierId: string): Promise<void> {
  const { user, supabase } = await requireCreator();
  await supabase
    .from('subscription_tiers')
    .update({ active: false })
    .eq('id', tierId)
    .eq('creator_id', user.id);
  revalidatePath('/app/dashboard/tiers');
  revalidatePath(`/c/${user.user_metadata?.handle ?? ''}`);
  redirect('/app/dashboard/tiers');
}
