import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { requireUser } from '@/lib/auth/guards';
import PollingRefresh from './PollingRefresh';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string; locale: string }> };

// NOWPayments payment_status grouping.
const PENDING_STATUSES = new Set([
  'pending',
  'waiting',
  'confirming',
  'confirmed',
  'sending',
  'partially_paid',
]);
const SUCCESS_STATUSES = new Set(['finished']);
const FAILURE_STATUSES = new Set(['failed', 'expired', 'refunded']);

export default async function SubscriptionLandingPage({ params }: Props) {
  const { id } = await params;
  const { user, supabase } = await requireUser();

  const { data: invoice } = await supabase
    .from('payment_invoices')
    .select(
      'id, status, amount_cents, currency, subscription_id, purpose, metadata, subscriber_id, creator:profiles!payment_invoices_creator_id_fkey(handle, display_name)',
    )
    .eq('id', id)
    .maybeSingle();

  // Tight access control: only the subscriber that started the invoice can
  // see this page. RLS already enforces it, but double-check before any UI.
  if (!invoice || invoice.subscriber_id !== user.id) notFound();

  const creator = Array.isArray(invoice.creator) ? invoice.creator[0] : invoice.creator;
  const creatorHandle = creator?.handle ?? '';
  const creatorName = creator?.display_name || creatorHandle;
  const isPremium = invoice.purpose === 'premium';

  const isPending = PENDING_STATUSES.has(invoice.status);
  // Premium success doesn't write a subscriptions row — only check the
  // status for premium invoices. Tier subscriptions need both the status
  // AND the subscription_id (proof the IPN created the row).
  const isSuccess = SUCCESS_STATUSES.has(invoice.status) && (isPremium || invoice.subscription_id);
  const isFailure = FAILURE_STATUSES.has(invoice.status);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-3xl border border-border-color bg-card p-8 text-center">
        {isSuccess && isPremium && (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-amber-400" />
            <h1 className="mt-4 text-3xl font-black text-text-main">You&apos;re Premium!</h1>
            <p className="mt-2 text-text-secondary">
              The full Casting catalog + every creator&apos;s otherwise-blurred
              posts are unlocked. Premium runs for 30 days; come back any time
              to extend.
            </p>
            <Link
              href="/explore"
              className="mt-8 inline-block rounded-full bg-amber-400 px-6 py-3 font-black text-black shadow-lg shadow-amber-400/30 transition-all hover:bg-amber-300 hover:scale-[1.02]"
            >
              Explore the unlocked catalog →
            </Link>
          </>
        )}
        {isSuccess && !isPremium && (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-400" />
            <h1 className="mt-4 text-3xl font-black text-text-main">You&apos;re subscribed!</h1>
            <p className="mt-2 text-text-secondary">
              Welcome to {creatorName}&apos;s subscriber circle. Your access is
              active for 30 days.
            </p>
            <Link
              href={`/c/${creatorHandle}`}
              className="mt-8 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-pink-400 hover:scale-[1.02]"
            >
              View {creatorName}&apos;s profile →
            </Link>
          </>
        )}

        {isPending && (
          <>
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
            <h1 className="mt-4 text-3xl font-black text-text-main">
              Waiting for payment confirmation
            </h1>
            <p className="mt-2 text-text-secondary">
              We&apos;re watching the blockchain for your transaction. This page
              will refresh automatically — most payments confirm within a few
              minutes. You can safely close this tab and come back later; we&apos;ll
              email you once it&apos;s live.
            </p>
            <p className="mt-6 text-xs text-text-secondary/70">
              Current status: <span className="font-mono">{invoice.status}</span>
            </p>
            <PollingRefresh />
          </>
        )}

        {isFailure && (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-400" />
            <h1 className="mt-4 text-3xl font-black text-text-main">
              Payment didn&apos;t complete
            </h1>
            <p className="mt-2 text-text-secondary">
              {invoice.status === 'expired'
                ? "Looks like the invoice timed out before payment was received."
                : invoice.status === 'refunded'
                  ? 'This payment was refunded.'
                  : "We couldn't confirm a successful payment for this invoice."}
              {' '}
              No charge was made. You can try again any time.
            </p>
            <Link
              href={isPremium ? '/app/premium' : `/c/${creatorHandle}`}
              className="mt-8 inline-block rounded-full border border-primary px-6 py-3 font-bold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              {isPremium ? 'Try Premium again' : `Back to ${creatorName}'s profile`}
            </Link>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-text-secondary">
        Invoice <span className="font-mono">{invoice.id.slice(0, 8)}</span> · Amount{' '}
        {(invoice.amount_cents / 100).toFixed(2)} {invoice.currency.toUpperCase()}
      </p>
    </main>
  );
}
