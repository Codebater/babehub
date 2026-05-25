import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';

/**
 * Privacy policy. Mirrors the platform's actual data flow:
 *   - Supabase Auth (email / OAuth identifiers, optional Google)
 *   - Supabase Postgres (profile, posts, tiers, subscriptions, invoices)
 *   - Supabase Storage (avatars, covers, post media)
 *   - NOWPayments (crypto payment processing, no card data ever touches us)
 *   - CCBill (future — card / SEPA payment processing)
 *   - Airtable (application form submissions; deletable via the
 *     /legal/delete-my-application self-service link)
 *   - eporner (third-party catalog playback; we don't get viewing logs back)
 *   - Vercel Analytics (anonymous page-view counts; no PII)
 *
 * Standalone page like Terms — readable text first, navigation second.
 * Not legal advice. Replace with a lawyer-reviewed document before
 * non-test traffic.
 */
export const metadata: Metadata = {
  title: 'Privacy Policy — Babe Hub',
  description:
    'What Babe Hub collects, how it&apos;s stored, who it&apos;s shared with.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/legal/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-text-main">
      <Link
        href="/explore"
        className="text-sm text-text-secondary transition-colors hover:text-primary"
      >
        ← Back to Babe Hub
      </Link>

      <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-8 leading-relaxed">
        <section>
          <h2 className="mb-2 text-xl font-bold">1. What we collect</h2>
          <ul className="list-disc space-y-2 pl-6 text-text-main/90">
            <li>
              <strong>Account data:</strong> email address (required for sign-in),
              optional Google OAuth identifier if you sign in with Google.
            </li>
            <li>
              <strong>Profile data you provide:</strong> handle, display name,
              bio, avatar image, cover image.
            </li>
            <li>
              <strong>Creator data:</strong> subscription tiers you set up,
              posts you publish, media you upload.
            </li>
            <li>
              <strong>Engagement data:</strong> which videos you liked,
              favorited, or commented on; the text of comments you posted.
            </li>
            <li>
              <strong>Payment metadata:</strong> the amount, currency, and
              status of crypto invoices you initiated through our payment
              processor. We never see your card details. Crypto wallet
              addresses live on the blockchain, not in our database. (When
              we enable CCBill for card / SEPA payments, billing details
              are handled by CCBill directly — we only receive the
              processor&apos;s transaction reference and status.)
            </li>
            <li>
              <strong>Application data:</strong> if you fill out the
              marketing Apply form, your answers (name, email, social
              handles, country, content type, etc.) are stored in our
              applicant tracking system (Airtable) and used to review your
              application. You can wipe every record matching your email
              at any time via the{' '}
              <Link
                href="/legal/delete-my-application"
                className="text-primary hover:underline"
              >
                Delete my application
              </Link>{' '}
              page.
            </li>
            <li>
              <strong>Anonymous usage data:</strong> page-view counts via
              Vercel Analytics — no IPs, no identifiers, no cross-site tracking.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">2. Who we share data with</h2>
          <p className="text-text-main/90">
            We use a small number of subprocessors to run the platform.
            They process data only as needed to deliver the service:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-text-main/90">
            <li>
              <strong>Supabase</strong> — hosts our database, auth, and file
              storage. Account data, profiles, posts, comments, media live
              here, protected by row-level security.
            </li>
            <li>
              <strong>NOWPayments</strong> — processes crypto subscription
              invoices. They receive the invoice amount, currency, and your
              email when you initiate a payment.
            </li>
            <li>
              <strong>CCBill</strong> <em>(future)</em> — when card / SEPA
              payments are enabled, CCBill will process card transactions
              directly. They will see the billing details you enter on
              their hosted form; we will only receive a transaction
              reference + status. Until enabled, no data is sent to CCBill.
            </li>
            <li>
              <strong>Airtable</strong> — stores application form
              submissions (the marketing Apply survey). Each row contains
              the answers you entered on the form. Self-service deletion
              is available via the{' '}
              <Link
                href="/legal/delete-my-application"
                className="text-primary hover:underline"
              >
                Delete my application
              </Link>{' '}
              link.
            </li>
            <li>
              <strong>Vercel</strong> — hosts and serves the application;
              receives anonymous request metadata standard for any web host.
            </li>
            <li>
              <strong>Eporner</strong> — third-party adult video catalog
              whose player we embed on /explore. We never send them your
              account info; their iframe may set its own cookies in your
              browser if you play one of their videos.
            </li>
            <li>
              <strong>Google</strong> — only if you choose to sign in with
              Google. They receive a confirmation that you authorized the
              login; we receive your email + a Google user ID.
            </li>
          </ul>
          <p className="mt-3 text-text-main/90">
            We do <strong>not</strong> sell your data, run third-party ad
            trackers, or share data with marketers.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">3. Cookies</h2>
          <p className="text-text-main/90">
            We use one essential cookie set — Supabase&apos;s auth session
            cookie — so you stay signed in across page navigations. That&apos;s
            it for first-party cookies. Embedded video iframes from third
            parties may set their own cookies when you play them.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">4. Retention</h2>
          <p className="text-text-main/90">
            We keep your account data for as long as your account is active.
            Payment invoice records are kept for accounting / tax compliance
            purposes (typically 7 years). When you delete your account, your
            profile, posts, comments, and uploaded media are removed; payment
            invoice metadata is retained for the period above with personal
            identifiers minimized.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">5. Your rights</h2>
          <p className="text-text-main/90">
            Depending on where you live, you have the right to access,
            correct, delete, or export your personal data, and to object
            to certain processing.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-text-main/90">
            <li>
              Edit most of your account data directly in{' '}
              <Link
                href="/app/settings"
                className="text-primary hover:underline"
              >
                Settings
              </Link>
              .
            </li>
            <li>
              Delete every application-form record matching your email at{' '}
              <Link
                href="/legal/delete-my-application"
                className="text-primary hover:underline"
              >
                Delete my application
              </Link>{' '}
              — instant, no questions asked.
            </li>
            <li>
              For anything else (full account deletion, data export, etc.),
              contact us through the marketing site and we&apos;ll respond.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">6. Security</h2>
          <p className="text-text-main/90">
            We use row-level security on the database so a logged-in user
            can only read their own private rows. Media is served from
            short-lived signed URLs so locked content isn&apos;t scrape-able
            without an active subscription. We don&apos;t store payment card
            numbers (we don&apos;t take cards) and we don&apos;t store
            cryptographic wallet keys (those live in the user&apos;s wallet).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">7. Children</h2>
          <p className="text-text-main/90">
            Babe Hub is strictly for users 18 and older. We do not knowingly
            collect any data from anyone under 18. If you believe a minor
            has created an account, contact us immediately so we can remove it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">8. Changes</h2>
          <p className="text-text-main/90">
            We may update this Privacy Policy over time. The &quot;last
            updated&quot; date at the top reflects when it was last
            meaningfully revised. Material changes will be surfaced in-app.
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t border-border-color/40 pt-6 text-xs text-text-secondary">
        See also our{' '}
        <Link href="/legal/terms" className="text-primary hover:underline">
          Terms of Use
        </Link>
        .
      </footer>
    </main>
  );
}
