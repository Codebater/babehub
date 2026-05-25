import { Link } from '@/i18n/navigation';
import { requireRecruiter } from '@/lib/auth/guards';
import { createJobAndRedirect } from '@/lib/jobs/actions';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ error?: string }>;
};

/**
 * `/app/recruiter/jobs/new` — job composer. Server component with a
 * native HTML form that hands the FormData to the createJobAndRedirect
 * server action; the action persists, then redirects to the new
 * applications inbox.
 *
 * Two submit buttons: "Save draft" and "Publish now". The action
 * inspects `publish=1` in the body to decide.
 */
export default async function NewJobPage({ searchParams }: Props) {
  await requireRecruiter();
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/app/recruiter/dashboard"
        className="text-sm text-text-secondary transition-colors hover:text-primary"
      >
        ← Back to dashboard
      </Link>

      <p className="mt-2 text-sm text-text-secondary">
        Post a job creators can apply to. Keep it specific — title, scope, budget
        range, what success looks like. You can edit or pause it any time.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={createJobAndRedirect} className="mt-6 space-y-6">
        <Field label="Title" hint="One concise line. e.g. 'Casting: lifestyle creator, Berlin'">
          <input
            name="title"
            type="text"
            required
            maxLength={200}
            className={inputClass}
            placeholder="What kind of creator are you looking for?"
          />
        </Field>

        <Field label="Description" hint="2-3 paragraphs. Scope, deliverables, timeline.">
          <textarea
            name="description"
            rows={6}
            maxLength={5000}
            className={`${inputClass} resize-y`}
            placeholder="What does success look like? What's the project?"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Budget min (cents)">
            <input
              name="budget_min_cents"
              type="number"
              min={0}
              step={100}
              className={inputClass}
              placeholder="50000"
            />
          </Field>
          <Field label="Budget max (cents)">
            <input
              name="budget_max_cents"
              type="number"
              min={0}
              step={100}
              className={inputClass}
              placeholder="200000"
            />
          </Field>
          <Field label="Currency">
            <input
              name="currency"
              type="text"
              maxLength={3}
              defaultValue="USD"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Location kind">
            <select name="location_kind" defaultValue="remote" className={inputClass}>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
          <Field label="Location">
            <input
              name="location_text"
              type="text"
              className={inputClass}
              placeholder="Berlin · Germany (or blank for remote)"
            />
          </Field>
        </div>

        <Field label="Categories" hint="Up to 8, comma-separated.">
          <input
            name="categories"
            type="text"
            className={inputClass}
            placeholder="casting, ugc, modeling"
          />
        </Field>

        <Field label="Tags" hint="Up to 12, comma-separated. Helps search find you.">
          <input
            name="tags"
            type="text"
            className={inputClass}
            placeholder="long-form, weekly, in-person"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Visibility">
            <select name="visibility" defaultValue="public" className={inputClass}>
              <option value="public">Public — anyone can see</option>
              <option value="verified_only">Verified creators only</option>
              <option value="invite">Invite only (you share the link)</option>
            </select>
          </Field>
          <label className="mt-7 inline-flex items-start gap-2 text-sm text-text-main">
            <input
              type="checkbox"
              name="requires_verification"
              value="1"
              className="mt-1 h-4 w-4 rounded border-border-color text-primary focus:ring-primary"
            />
            <span>
              Require <strong>verified</strong> creators
              <span className="block text-xs text-text-secondary">
                Applicants must have a verified badge.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-color/40 pt-6">
          <button
            type="submit"
            name="publish"
            value="1"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400"
          >
            Publish now →
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-border-color px-5 py-2.5 text-sm font-bold text-text-main transition-colors hover:border-primary hover:text-primary"
          >
            Save draft
          </button>
        </div>
      </form>
    </main>
  );
}

const inputClass =
  'w-full rounded-xl border border-border-color bg-card/60 px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:border-primary focus:outline-none';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-text-main">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-text-secondary">{hint}</span>}
    </label>
  );
}
