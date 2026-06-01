import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { Bitcoin, ShieldCheck, Zap, Lock, ArrowRight, Wallet } from 'lucide-react';

export const dynamic = 'force-dynamic';

const DOMAIN = 'https://babehub.net';

export const metadata: Metadata = {
  title: 'Adult Platform That Accepts Crypto — Bitcoin, USDT & Non-KYC Payments',
  description:
    'BabeHub accepts Bitcoin, Ethereum, USDT and 50+ cryptocurrencies. Buy premium and subscribe to adult creators with crypto — private, non-KYC, no card data shared. Creators get paid in crypto.',
  keywords: [
    'adult site that accepts crypto',
    'adult platform accepts bitcoin',
    'buy onlyfans with crypto',
    'subscribe to creators with crypto',
    'non-kyc adult payments',
    'pay creators in bitcoin',
    'crypto adult platform',
    'USDT adult subscription',
    'anonymous adult payments',
    'BabeHub crypto',
  ],
  alternates: { canonical: '/accept-crypto' },
  openGraph: {
    type: 'website',
    url: `${DOMAIN}/accept-crypto`,
    title: 'Adult Platform That Accepts Crypto — BabeHub',
    description:
      'Pay for premium and subscribe to adult creators with Bitcoin, USDT and 50+ cryptocurrencies. Private, non-KYC. Creators paid in crypto.',
  },
};

const COINS = ['Bitcoin (BTC)', 'Ethereum (ETH)', 'USDT (TRC-20)', 'USDC', 'Litecoin (LTC)', 'Monero (XMR)', 'BNB', 'TRON (TRX)', 'Dogecoin', '+ 50 more'];

const FAQ = [
  {
    q: 'Does BabeHub accept cryptocurrency?',
    a: 'Yes. BabeHub accepts Bitcoin, Ethereum, USDT, USDC and over 50 cryptocurrencies for premium access and creator subscriptions, processed via NOWPayments.',
  },
  {
    q: 'Can I pay anonymously with crypto?',
    a: 'Yes. Crypto payments require no card details and no banking information. We never see or store your card or bank data — you pay from your own wallet.',
  },
  {
    q: 'Do creators get paid in crypto?',
    a: 'Yes. Creators on BabeHub can receive their earnings in cryptocurrency, giving fast, borderless, private payouts wherever they are in the world.',
  },
  {
    q: 'Is there KYC to pay with crypto?',
    a: 'Paying with crypto on BabeHub does not require traditional KYC banking verification — you transact directly from your wallet.',
  },
];

export default function AcceptCryptoPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-zinc-950 via-black to-amber-950/20 px-6 py-8 md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" aria-hidden />
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
          <Bitcoin className="h-3 w-3" />
          Crypto accepted
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
          The adult platform that accepts crypto
        </h1>
        <p className="mt-3 max-w-xl text-sm text-white/70 md:text-base">
          Pay for premium and subscribe to adult creators with{' '}
          <strong className="text-white">Bitcoin, Ethereum, USDT and 50+ cryptocurrencies</strong>.
          Private, non-KYC, no card or bank data ever shared. Creators get paid in crypto too.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/premium" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300">
            Unlock Premium with crypto
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/explore" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:border-amber-400/50">
            Browse creators
          </Link>
        </div>
      </div>

      {/* Coins */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-main">
          <Wallet className="h-4 w-4 text-amber-300" />
          Cryptocurrencies we accept
        </h2>
        <div className="flex flex-wrap gap-2">
          {COINS.map((c) => (
            <span key={c} className="rounded-full border border-border-color bg-card px-3 py-1.5 text-xs font-medium text-text-secondary">
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Benefit icon={<Lock className="h-4 w-4" />} title="Private by default" text="No card details, no bank info. Pay straight from your wallet." />
        <Benefit icon={<Zap className="h-4 w-4" />} title="Instant & global" text="Borderless payments and fast creator payouts, anywhere." />
        <Benefit icon={<ShieldCheck className="h-4 w-4" />} title="Non-KYC" text="Transact directly from your wallet — no banking verification." />
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-text-main">Crypto payments — FAQ</h2>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border-color bg-card p-4">
              <h3 className="text-sm font-bold text-text-main">{f.q}</h3>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEO footer copy */}
      <section className="mt-10 border-t border-border-color/40 pt-6">
        <p className="max-w-3xl text-xs leading-relaxed text-text-secondary/80">
          BabeHub is an adult creator platform that accepts cryptocurrency for premium access and
          creator subscriptions. Buy OnlyFans-style content, subscribe to live cam models, and
          support adult creators with Bitcoin, USDT, Ethereum and 50+ coins — privately, without
          sharing card or bank details. Creators on BabeHub can also be paid out in crypto. All
          performers are 18+. Payments are processed by NOWPayments.
        </p>
      </section>
    </main>
  );
}

function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border-color bg-card p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300">
        {icon}
      </span>
      <p className="mt-2 text-sm font-bold text-text-main">{title}</p>
      <p className="mt-0.5 text-xs text-text-secondary">{text}</p>
    </div>
  );
}
