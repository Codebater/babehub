import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import DeleteForm from './DeleteForm';

/**
 * Self-service "delete my application data" page. Linked from the
 * Privacy Policy. Users who submitted the marketing-site Apply survey
 * can wipe their record from our Airtable here in one click.
 */
export const metadata: Metadata = {
  title: 'Delete my application — Babe Hub',
  description:
    'Self-service deletion of application data submitted through the Babe Hub Apply form.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/legal/delete-my-application' },
};

export default function DeleteMyApplicationPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12 text-text-main">
      <Link
        href="/legal/privacy"
        className="text-sm text-text-secondary transition-colors hover:text-primary"
      >
        ← Back to Privacy Policy
      </Link>

      <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
        Delete my application
      </h1>
      <p className="mt-3 text-sm text-text-secondary">
        Enter the email address you applied with. We will permanently delete
        every Babe Hub application record matching that email — name, social
        handles, country, and any other fields you submitted on the marketing
        Apply form.
      </p>

      <p className="mt-3 rounded-md border border-border-color bg-secondary/40 p-3 text-xs text-text-secondary">
        This only affects application data stored in our applicant tracking
        system. If you also have a platform account, you can manage that
        separately in{' '}
        <Link href="/app/settings" className="text-primary hover:underline">
          Settings
        </Link>
        .
      </p>

      <div className="mt-6">
        <DeleteForm />
      </div>

      <footer className="mt-10 border-t border-border-color/40 pt-6 text-xs text-text-secondary">
        Questions? See our{' '}
        <Link href="/legal/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>{' '}
        or{' '}
        <Link href={'/#apply' as '/'} className="text-primary hover:underline">
          contact us
        </Link>
        .
      </footer>
    </main>
  );
}
