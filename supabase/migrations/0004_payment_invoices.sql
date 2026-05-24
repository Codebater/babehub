-- Phase 1: payment_invoices — durable record of every payment intent we
-- create with a provider (NOWPayments first, Stripe later). Lets the IPN /
-- webhook handler resolve an incoming payment back to a subscriber + tier,
-- and gives the post-checkout landing page a row to poll while the IPN
-- async-confirms in the background.
--
-- Service-role only for INSERT/UPDATE — payment intents are created by the
-- /api/nowpayments/create-invoice route (which has the user session) and
-- updated by the /api/nowpayments/ipn webhook (which doesn't). The cookie-
-- aware Supabase client can't see these rows except for SELECT by their
-- subscriber.

create table public.payment_invoices (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  tier_id uuid not null references public.subscription_tiers(id) on delete restrict,

  provider public.payment_provider not null,
  -- The invoice id returned when we create the invoice.
  provider_invoice_id text not null,
  -- The payment id, set later by the IPN when the user actually pays.
  provider_payment_id text,

  -- Mirrors NOWPayments' payment_status values plus our own "pending" for
  -- the moment after invoice creation but before any IPN has arrived.
  -- Values seen in the wild: pending | waiting | confirming | confirmed |
  -- sending | partially_paid | finished | failed | refunded | expired
  status text not null default 'pending',

  amount_cents integer not null check (amount_cents >= 0),
  currency text not null,

  -- Filled in by the IPN handler when status flips to a terminal success.
  -- One subscription per successful invoice; multiple invoices may end up
  -- linking to the same subscription if a fan renews via a fresh invoice
  -- (the unique constraint on (provider, provider_subscription_id) on
  -- public.subscriptions handles that side).
  subscription_id uuid references public.subscriptions(id) on delete set null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payment_invoices_provider_invoice_unique
    unique (provider, provider_invoice_id)
);

create index payment_invoices_subscriber_idx
  on public.payment_invoices (subscriber_id, created_at desc);

create index payment_invoices_status_idx
  on public.payment_invoices (status)
  where status in ('pending', 'waiting', 'confirming');

create trigger payment_invoices_updated_at
  before update on public.payment_invoices
  for each row execute function public.touch_updated_at();

alter table public.payment_invoices enable row level security;

-- Subscribers can read their own invoices (used by the success-page polling
-- query). Service role bypasses RLS — used by both the create-invoice route
-- (insert) and the IPN webhook (update + insert subscriptions).
create policy "subscriber reads own invoices"
  on public.payment_invoices for select
  using (auth.uid() = subscriber_id);

-- No client INSERT/UPDATE/DELETE — server routes only.
