import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { requireCreator } from '@/lib/auth/guards';
import CreateTierForm from './CreateTierForm';

export const dynamic = 'force-dynamic';

function formatPrice(priceCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency}`;
  }
}

export default async function TiersPage() {
  const { user, supabase } = await requireCreator();

  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('id, name, description, price_cents, currency, perks, active, sort_order, created_at')
    .eq('creator_id', user.id)
    .order('sort_order', { ascending: true });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm text-text-secondary">
          Set the prices fans pay to subscribe to your content. You can have up to
          5 active tiers at a time. Existing subscribers stay subscribed at the
          price they signed up at.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-text-secondary">
          Your tiers ({tiers?.length ?? 0})
        </h2>
        {(!tiers || tiers.length === 0) ? (
          <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-10 text-center text-text-secondary">
            No tiers yet. Create your first one below.
          </div>
        ) : (
          <ul className="space-y-3">
            {tiers.map((tier) => {
              const perks = Array.isArray(tier.perks) ? (tier.perks as string[]) : [];
              return (
                <li
                  key={tier.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-border-color bg-card p-5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-text-main">{tier.name}</h3>
                      <span className="text-xl font-black text-primary">
                        {formatPrice(tier.price_cents, tier.currency)}
                      </span>
                      <span className="text-sm text-text-secondary">/ month</span>
                      {!tier.active && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                          Archived
                        </span>
                      )}
                    </div>
                    {tier.description && (
                      <p className="mt-1 text-sm text-text-secondary">{tier.description}</p>
                    )}
                    {perks.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                        {perks.map((perk, i) => (
                          <li key={i}>· {perk}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link
                    href={`/app/dashboard/tiers/${tier.id}`}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-border-color px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-text-secondary">
          Create a new tier
        </h2>
        <div className="rounded-2xl border border-border-color bg-card p-6">
          <CreateTierForm />
        </div>
      </section>
    </main>
  );
}
