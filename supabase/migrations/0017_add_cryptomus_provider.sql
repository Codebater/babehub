-- Cryptomus replaces NOWPayments as the active crypto payment provider.
-- Keep the 'nowpayments' enum value so historical payment_invoices /
-- subscriptions rows remain queryable. New invoices use 'cryptomus'.
alter type public.payment_provider add value if not exists 'cryptomus';
