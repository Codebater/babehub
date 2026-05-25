import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireCreator } from '@/lib/auth/guards';
import EditTierForm from './EditTierForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string; locale: string }> };

export default async function EditTierPage({ params }: Props) {
  const { id } = await params;
  const { user, supabase } = await requireCreator();

  const { data: tier } = await supabase
    .from('subscription_tiers')
    .select('id, name, description, price_cents, currency, perks, active')
    .eq('id', id)
    .eq('creator_id', user.id)
    .maybeSingle();

  if (!tier) notFound();

  const perks = Array.isArray(tier.perks) ? (tier.perks as string[]) : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8">
        <Link
          href="/app/dashboard/tiers"
          className="text-sm text-text-secondary transition-colors hover:text-primary"
        >
          ← All tiers
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-text-main md:text-4xl">
          Edit tier
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Changes apply to new subscriptions only. Existing subscribers stay on the
          price they originally signed up at.
        </p>
      </header>

      <div className="rounded-2xl border border-border-color bg-card p-6">
        <EditTierForm
          tierId={tier.id}
          defaults={{
            name: tier.name,
            description: tier.description,
            price_dollars: (tier.price_cents / 100).toString(),
            currency: tier.currency,
            perks: perks.join('\n'),
            active: tier.active,
          }}
        />
      </div>
    </main>
  );
}
