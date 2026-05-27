-- Premium top-ups reuse the payment_invoices table but have no
-- creator_id / tier_id — drop the NOT NULL and add a purpose column
-- so the IPN webhook can branch on it.
alter table public.payment_invoices alter column creator_id drop not null;
alter table public.payment_invoices alter column tier_id drop not null;

alter table public.payment_invoices
  add column purpose text not null default 'tier_subscription'
  check (purpose in ('tier_subscription', 'premium'));

create index payment_invoices_purpose_idx on public.payment_invoices(purpose);
