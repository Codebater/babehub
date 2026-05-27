import Link from 'next/link';
import type { BlogPost } from './types';

/**
 * Blog post registry. Add a new post by appending it to `ALL_POSTS`
 * below — that's the only place posts are declared. The /blog index
 * + /blog/[slug] detail page + sitemap all derive from here.
 *
 * Why all-in-one-file: 3-10 posts comfortably fit. When the catalog
 * grows past ~20, split into `content/blog/<slug>.tsx` modules and
 * import them into this file. The BlogPost shape doesn't change.
 *
 * SEO posture: every post pitches BabeHub as the destination — title
 * targets a search term ("how to launch as an adult creator",
 * "anonymous payments for creators"), body links into /explore,
 * /jobs, /c/{handle} and the Apply modal triggers. Internal linking
 * is the whole point of having a blog at this stage.
 */

// Helper for body links to keep visual consistent across posts.
const A = (props: React.ComponentProps<'a'>) => (
  <a {...props} className="text-primary underline-offset-2 hover:underline" />
);

// Internal-link helper — uses next/link so navigation is client-side.
const I = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link href={href} className="text-primary underline-offset-2 hover:underline">
    {children}
  </Link>
);

export const ALL_POSTS: BlogPost[] = [
  {
    slug: 'how-to-launch-as-an-adult-creator-in-2026',
    title: 'How to launch as an adult creator in 2026',
    description:
      'A 7-step playbook for setting up a creator profile, picking a niche, pricing your tiers, and getting your first paying subscriber within 30 days.',
    date: '2026-05-20',
    author: 'BabeHub Team',
    tags: ['creators', 'guide', 'onboarding'],
    readingMinutes: 7,
    body: (
      <>
        <p>
          Launching as an adult creator in 2026 is less about luck and more about
          the first month of compounding small wins — a clean profile, a
          tight niche, two or three subscription tiers, and a content
          rhythm you can actually keep. Below is the 7-step playbook we
          recommend to every new creator on{' '}
          <I href="/explore">BabeHub</I>.
        </p>

        <h2>1. Claim a handle you can live with</h2>
        <p>
          Your <code>/c/&#123;handle&#125;</code> URL is the single most
          shared link in your career — on Reddit, X, Telegram, link-in-bio
          pages. Pick something short, easy to spell, and brand-able.
          Lowercase letters, numbers, underscores only. You can change
          your display name freely; the handle is harder to swap once
          you&apos;ve built backlinks to it.
        </p>

        <h2>2. Pick a niche before you pick a price</h2>
        <p>
          Generalist accounts burn out faster than niche accounts. The
          creators with the highest 12-month retention on BabeHub all
          picked a lane in week 1: <em>casting tapes</em>,{' '}
          <em>live cams</em>, <em>luxury shoots</em>, <em>amateur
          couples</em>, <em>kink-specific</em>, etc. Browse{' '}
          <I href="/explore?q=casting">the Casting feed</I> or{' '}
          <I href="/explore?q=live%20cams">Live Cams</I> to see what the
          category looks like before committing.
        </p>

        <h2>3. Three tiers, not five</h2>
        <p>
          Fans pick from a menu. A two-tier menu under-monetises whales; a
          five-tier menu paralyses everyone. Three tiers — a low entry
          (<strong>$5</strong>), a mid-bundle (<strong>$15</strong>), a
          premium (<strong>$40</strong>) — converts best across every
          niche we&apos;ve studied. Configure tiers from the dashboard
          once your profile is up.
        </p>

        <h2>4. Post 5 free items before any paywall</h2>
        <p>
          The <code>/explore</code> feed surfaces public posts to anyone,
          including search engines. Five strong free posts gives the
          algorithm enough signal to start sending you discovery traffic.
          Paywalled posts are invisible to fans who haven&apos;t paid
          yet — they convert subscribers, they don&apos;t recruit them.
        </p>

        <h2>5. Verify before you take your first DM</h2>
        <p>
          Verified creators get a blue check next to their handle and
          rank higher in <I href="/explore">discovery</I>. Verification
          also unlocks access to the <I href="/jobs">Jobs board</I> —
          casting calls, branded shoots, paid collabs.
        </p>

        <h2>6. Set up crypto payouts day one</h2>
        <p>
          BabeHub processes subscription payments via crypto (NOWPayments)
          with CCBill card processing landing in Q3. Crypto payouts hit
          your wallet in under an hour, never get reversed, and don&apos;t
          require sharing a bank account. Read our deeper write-up on{' '}
          <I href="/blog/why-crypto-payments-for-adult-creators">why
          crypto-first matters for adult creators</I>.
        </p>

        <h2>7. Apply for your first collab in week 3</h2>
        <p>
          By week 3 you should have 3-5 subscribers and a content rhythm.
          That&apos;s the right moment to apply for branded jobs from the{' '}
          <I href="/jobs">Jobs board</I> — agencies, casting houses, and
          brands hire from BabeHub specifically because the platform
          tracks engagement metrics they can&apos;t see anywhere else.
        </p>

        <h2>What about the marketing side?</h2>
        <p>
          When you&apos;re ready to sponsor a placement, pitch a casting
          call, or run a brand collab campaign, the brand-side flow lives
          one click away — see{' '}
          <I href="/blog/how-to-sponsor-a-banner-on-babehub">how to
          sponsor a banner</I>. For now: profile first, posts second,
          tiers third.
        </p>

        <p>
          Ready? <I href="/app/login">Sign up</I>, claim your handle, and
          publish your first 5 posts. We&apos;ll see you on the feed.
        </p>
      </>
    ),
  },

  {
    slug: 'why-crypto-payments-for-adult-creators',
    title: 'Why crypto payments matter for adult creators in 2026',
    description:
      'Card processors have been deplatforming adult creators for a decade. Crypto rails fix the chargeback problem, the de-banking problem, and the global-payouts problem in one stack.',
    date: '2026-05-12',
    author: 'BabeHub Team',
    tags: ['payments', 'creators', 'crypto'],
    readingMinutes: 5,
    body: (
      <>
        <p>
          If you&apos;ve been a creator for more than a year, you already
          know the pattern: a card processor approves your account, you
          earn for 3-6 months, then one day the payouts stop because some
          underwriter flagged your category. Stripe, PayPal, Square — the
          list of platforms that have deplatformed adult creators is
          longer than the list of platforms that haven&apos;t.
        </p>
        <p>
          Crypto payment rails fix this — not because crypto is magic,
          but because the failure modes are different.
        </p>

        <h2>1. No chargebacks</h2>
        <p>
          Card payments are reversible up to 180 days after the
          transaction. Adult creators see chargeback rates of 2-5% on
          card platforms — a single bad month can wipe out a quarter of
          earnings. Crypto transactions are final once they confirm. No
          chargeback, no fraud reserve, no rolling 90-day hold.
        </p>

        <h2>2. No category rejection</h2>
        <p>
          NOWPayments — the rail BabeHub uses today — doesn&apos;t care
          what category your business falls into. The protocol is content-
          neutral. You can&apos;t get deplatformed for what you sell;
          you can only get deplatformed for fraud, sanctions, or money
          laundering — same as every other business.
        </p>

        <h2>3. Global payouts day one</h2>
        <p>
          A creator in Manila and a creator in Berlin both see the same
          payout schedule, the same fees, the same currencies. No wire
          transfer delays, no IBAN-only restrictions, no &quot;your
          country isn&apos;t supported&quot;. Crypto is the only payment
          rail that works the same in every country.
        </p>

        <h2>The honest tradeoffs</h2>
        <p>
          Crypto isn&apos;t free of friction. Subscribers have to hold
          a wallet (Trust Wallet, MetaMask, the Binance app). Some are
          familiar; many aren&apos;t. BabeHub&apos;s checkout walks them
          through it, but the conversion rate on a brand-new wallet user
          is lower than on a brand-new card user.
        </p>
        <p>
          That&apos;s why CCBill (card) lands in Q3 2026 as a parallel
          rail. Card users keep paying with cards, crypto-native users
          keep paying with crypto, creators don&apos;t have to pick.
        </p>

        <h2>Try the flow</h2>
        <p>
          Find a creator you like on the{' '}
          <I href="/explore">discovery feed</I>, click Subscribe, and pay
          with the crypto of your choice. The unlock is instant. Once
          you&apos;re a creator yourself, read our{' '}
          <I href="/blog/how-to-launch-as-an-adult-creator-in-2026">
            launch playbook
          </I>{' '}
          to set up your first tier in under 10 minutes.
        </p>
      </>
    ),
  },

  {
    slug: 'how-to-sponsor-a-banner-on-babehub',
    title: 'How to sponsor a banner, featured job, or creator collab on BabeHub',
    description:
      'Brand-side pitch guide: what placements are available, how the inquiry process works, and what numbers to bring to the table for the highest hit rate.',
    date: '2026-05-04',
    author: 'BabeHub Team',
    tags: ['brands', 'advertising', 'guide'],
    readingMinutes: 4,
    body: (
      <>
        <p>
          BabeHub&apos;s traffic is creator-discovery traffic: people
          actively browsing for content, subscriptions, casting calls,
          and collabs. That&apos;s a different audience than generic adult
          tube traffic — higher intent, more time on site, more direct
          conversion to revenue.
        </p>
        <p>
          Three placements are available to brands and agencies today,
          all sold through a single inquiry form so you don&apos;t have
          to chase multiple sales contacts.
        </p>

        <h2>1. Sponsored banner</h2>
        <p>
          The big-format rail above the &quot;Load more&quot; button on{' '}
          <I href="/explore">/explore</I>. Every visitor scrolling the
          feed hits it on the way to the next batch of videos. One slot
          per category (casting / live cams / luxury). Sold per week or
          per month.
        </p>

        <h2>2. Featured job</h2>
        <p>
          The first card on the{' '}
          <I href="/jobs">Jobs board</I>, with a primary-pink &quot;
          Featured&quot; chip. Used by casting houses, agencies, and
          brand campaigns to surface specific opportunities to thousands
          of creators in their first 24 hours on the board. Sold per
          listing, with a 30-day default ceiling.
        </p>

        <h2>3. Creator collab</h2>
        <p>
          Direct introduction to creators matching your brief — niche,
          location, follower band, content style. We surface a shortlist
          within 48h and you talk to the creator directly. No middleman
          fees on the collab itself; BabeHub charges a flat introduction
          fee.
        </p>

        <h2>The inquiry flow</h2>
        <p>
          Click any &quot;<strong>Pitch a slot</strong>&quot; CTA on the
          site (the rotating ad strips on{' '}
          <I href="/explore">/explore</I> and <I href="/jobs">/jobs</I>,
          or the brand card at the bottom of the{' '}
          <I href="/marketing">marketing home</I>). The form is 2 steps,
          anonymous-friendly — only your email is required, everything
          else (company, website, budget, timeline) is optional. Brands
          often combine placements, so the form is multi-select.
        </p>

        <h2>What to bring to get a fast yes</h2>
        <p>
          The fastest inquiries to convert come with: a budget band, a
          rough timeline, and one sentence about the audience you&apos;re
          trying to reach. We don&apos;t need a brief at this stage —
          we&apos;ll write that with you over email — but knowing whether
          you&apos;re thinking $500 or $50,000 lets us send back a
          relevant options sheet instead of generic rate cards.
        </p>

        <p>
          We reply to brand inquiries within 48 hours, every time. If you
          haven&apos;t heard back, your inquiry got eaten by a spam
          filter — DM <A href="mailto:hello@babehub.net">hello@babehub.net</A> and
          we&apos;ll resend.
        </p>
      </>
    ),
  },
];

/** Sort newest first — exposed as a derived getter so we don't mutate ALL_POSTS. */
export function getAllPostsByDate(): BlogPost[] {
  return [...ALL_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Lookup by slug. Returns undefined on miss → page calls notFound(). */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return ALL_POSTS.find((p) => p.slug === slug);
}
