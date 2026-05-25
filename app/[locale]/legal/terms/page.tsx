import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';

/**
 * Plain-language terms of use. Tailored to the platform's specifics:
 * adult video catalog + crypto-only payments + creator-uploaded content.
 * Standalone page (no social sidebar) — when someone is reading T&C
 * they don't need navigation, they need the text.
 *
 * Not a substitute for actual legal advice. Replace with a lawyer-
 * reviewed document before any non-test traffic.
 */
export const metadata: Metadata = {
  title: 'Terms of Use — Babe Hub',
  description:
    'Terms of use for Babe Hub. Adult content. Crypto-only payments, no refunds, creators paid in crypto.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/legal/terms' },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-text-main">
      <Link
        href="/explore"
        className="text-sm text-text-secondary transition-colors hover:text-primary"
      >
        ← Back to Babe Hub
      </Link>

      <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
        Terms of Use
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-8 leading-relaxed">
        <section>
          <h2 className="mb-2 text-xl font-bold">1. Who can use Babe Hub</h2>
          <p className="text-text-main/90">
            Babe Hub is an adult-content video platform. You must be{' '}
            <strong>18 years of age or older</strong> (or the age of majority
            in your jurisdiction, whichever is higher) and accessing the
            platform from a jurisdiction where adult content is legal. By
            using the service you confirm that both are true.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">2. Account & content</h2>
          <p className="text-text-main/90">
            You are responsible for the security of your account credentials
            and for everything that happens under your account. Creators retain
            ownership of the content they upload; by uploading, creators grant
            Babe Hub a non-exclusive license to host, display, and stream
            that content to viewers consistent with the access controls the
            creator has set (free, tier-locked, etc.).
          </p>
          <p className="mt-3 text-text-main/90">
            Catalog videos surfaced via third-party APIs (e.g. eporner) are
            played from the third party&apos;s embedded player; Babe Hub does
            not host that content.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">3. Payments</h2>
          <p className="text-text-main/90">
            All subscriptions, tips, and other paid transactions on Babe Hub
            are settled in <strong>cryptocurrency</strong> via our payment
            processor (NOWPayments). By initiating a payment you accept that:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-text-main/90">
            <li>
              Crypto transactions are <strong>irreversible</strong> on the
              blockchain. <strong>No refunds</strong> are issued, except where
              a refund is required by applicable law and we determine in our
              sole discretion that it is warranted.
            </li>
            <li>
              You are responsible for picking the correct chain / asset and
              sending the exact requested amount within the invoice window;
              underpayments and wrong-network sends may be unrecoverable.
            </li>
            <li>
              Exchange-rate volatility between invoice and confirmation is
              not Babe Hub&apos;s responsibility.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">4. Creator payouts</h2>
          <p className="text-text-main/90">
            Creators are <strong>paid in cryptocurrency</strong> on the
            payout schedule and net of the platform fee disclosed in your
            dashboard. Creators are solely responsible for their own tax
            reporting in their jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">5. No warranty, no liability</h2>
          <p className="text-text-main/90">
            The service is provided <strong>&quot;as is&quot;</strong>, without
            warranties of any kind. We do not guarantee uninterrupted access,
            error-free playback, the legality of any third-party content
            embedded into the platform, or the suitability of any particular
            video for any particular purpose.
          </p>
          <p className="mt-3 text-text-main/90">
            To the maximum extent permitted by law, <strong>Babe Hub is not
            liable for any direct, indirect, incidental, consequential, or
            punitive damages</strong> arising out of your use of the platform
            — including but not limited to lost crypto due to user error,
            content unavailability, account suspension, or platform downtime.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">6. Acceptable use</h2>
          <p className="text-text-main/90">
            You will not upload, share, or solicit content that involves
            minors, non-consenting persons, or anything that violates
            applicable law in your jurisdiction or ours. Accounts that
            violate this clause are terminated without notice and reported
            where required.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">7. Termination</h2>
          <p className="text-text-main/90">
            We may suspend or terminate any account, with or without notice,
            for any reason — including without limitation a violation of
            these Terms. Active subscription periods that have already been
            paid for will continue to render the same way they would for any
            unsubscribed user (i.e. no refund of past payments).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">8. Changes</h2>
          <p className="text-text-main/90">
            We may update these Terms from time to time. Continued use of the
            platform after a change is effective constitutes acceptance of the
            updated Terms. The &quot;last updated&quot; date at the top
            reflects when this document was last meaningfully revised.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-bold">9. Contact</h2>
          <p className="text-text-main/90">
            Questions about these Terms can be sent via the contact form on
            the{' '}
            <Link href={'/#apply' as '/'} className="text-primary hover:underline">
              marketing site
            </Link>
            .
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t border-border-color/40 pt-6 text-xs text-text-secondary">
        See also our{' '}
        <Link href="/legal/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </footer>
    </main>
  );
}
