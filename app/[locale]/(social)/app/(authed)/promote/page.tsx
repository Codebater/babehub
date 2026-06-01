import { Megaphone, Sparkles, TrendingUp, Link2 } from 'lucide-react';
import { requireOnboarded } from '@/lib/auth/guards';
import EmbedSnippets from './EmbedSnippets';

export const dynamic = 'force-dynamic';

const DOMAIN = 'https://babehub.net';

export default async function PromotePage() {
  const { profile } = await requireOnboarded();
  const handle = profile.handle;
  const profileUrl = `${DOMAIN}/c/${handle}`;
  const badgeUrl = `${DOMAIN}/api/badge/${handle}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
      <header className="mb-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <Megaphone className="h-3 w-3" />
          Promote
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Get your creator badge
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Paste this badge anywhere you have a presence — your OnlyFans bio, Twitter/X,
          linktree, personal site, or a webmaster-forum signature. Each one links fans
          back to your BabeHub profile and helps the whole platform rank higher.
        </p>
      </header>

      {/* Live preview */}
      <section className="mb-6 rounded-2xl border border-border-color bg-secondary/30 p-6 text-center">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary/60">
          Your badge
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href={profileUrl} target="_blank" rel="noopener" className="inline-block transition-transform hover:scale-[1.03]">
          <img src={badgeUrl} alt={`${handle} on BabeHub`} width={300} height={60} />
        </a>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-text-secondary">
          <Link2 className="h-3 w-3" />
          Links to <span className="font-mono text-text-main">{profileUrl}</span>
        </p>
      </section>

      {/* Why bother */}
      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Perk icon={<TrendingUp className="h-4 w-4" />} title="Grow your reach" text="Fans on other platforms find your full BabeHub profile." />
        <Perk icon={<Sparkles className="h-4 w-4" />} title="Look verified" text="A clean, professional badge that signals you're the real deal." />
        <Perk icon={<Link2 className="h-4 w-4" />} title="Boost rankings" text="More links = the platform ranks higher = more discovery for you." />
      </section>

      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary/70">
        Copy a snippet
      </h2>
      <EmbedSnippets handle={handle} badgeUrl={badgeUrl} profileUrl={profileUrl} />

      <p className="mt-6 text-center text-[11px] text-text-secondary/60">
        Tip: the BBCode version is perfect for adult webmaster forums (GFY, XBIZ) where
        signature links are allowed — one of the best places to be seen by the industry.
      </p>
    </main>
  );
}

function Perk({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border-color bg-card p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
        {icon}
      </span>
      <p className="mt-2 text-sm font-bold text-text-main">{title}</p>
      <p className="mt-0.5 text-xs text-text-secondary">{text}</p>
    </div>
  );
}
