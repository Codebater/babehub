import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { requireOnboarded } from '@/lib/auth/guards';
import { updateJobAndRedirect } from '@/lib/jobs/actions';
import ChipPicker from '../../../../../../_components/ChipPicker';

const JOB_CATEGORIES = [
  'casting', 'live cams', 'luxury shoots', 'ugc', 'modeling', 'photography',
  'videography', 'brand deals', 'content creation', 'streaming', 'fashion',
  'fitness', 'beauty', 'lifestyle',
] as const;

const JOB_TAGS = [
  'one-off', 'weekly', 'monthly', 'long-term', 'long-form', 'short-form',
  'in-person', 'remote', 'no nudity', 'soft nudity', 'explicit', 'paid travel',
  'recurring', 'urgent', 'flexible hours', 'evenings', 'weekends',
] as const;

const inputClass =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none [color-scheme:dark]';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditJobPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const { user, supabase } = await requireOnboarded();

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('poster_id', user.id)
    .maybeSingle();

  if (!job) notFound();

  const action = updateJobAndRedirect.bind(null, id);

  const expiresDate = job.expires_at
    ? new Date(job.expires_at).toISOString().slice(0, 10)
    : '';

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={`/app/recruiter/jobs/${id}/applications` as never}
        className="text-sm text-text-secondary transition-colors hover:text-primary"
      >
        ← Back to applicants
      </Link>

      <h1 className="mt-4 text-2xl font-black tracking-tight text-text-main">Edit job</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Changes are live immediately on the public jobs board.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={action} className="mt-6 space-y-6">
        <Field label="Title" hint="One concise line.">
          <input
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={job.title}
            className={inputClass}
          />
        </Field>

        <Field label="Description" hint="2-3 paragraphs. Scope, deliverables, timeline.">
          <textarea
            name="description"
            rows={6}
            maxLength={5000}
            defaultValue={job.description ?? ''}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Budget min" hint="Whole EUR">
            <input
              name="budget_min"
              type="number"
              min={0}
              step={1}
              defaultValue={job.budget_min_cents ? job.budget_min_cents / 100 : ''}
              className={inputClass}
            />
          </Field>
          <Field label="Budget max" hint="Whole EUR">
            <input
              name="budget_max"
              type="number"
              min={0}
              step={1}
              defaultValue={job.budget_max_cents ? job.budget_max_cents / 100 : ''}
              className={inputClass}
            />
          </Field>
          <Field label="Currency">
            <input
              name="currency"
              type="text"
              maxLength={3}
              defaultValue={job.currency ?? 'EUR'}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Location kind">
            <select name="location_kind" defaultValue={job.location_kind} className={inputClass}>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
          <Field label="Location">
            <input
              name="location_text"
              type="text"
              defaultValue={job.location_text ?? ''}
              className={inputClass}
            />
          </Field>
        </div>

        <ChipPicker
          name="categories"
          label="Categories"
          presets={JOB_CATEGORIES}
          initial={job.categories ?? []}
          limit={8}
        />

        <ChipPicker
          name="tags"
          label="Tags"
          presets={JOB_TAGS}
          initial={job.tags ?? []}
          limit={12}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Visibility">
            <select name="visibility" defaultValue={job.visibility} className={inputClass}>
              <option value="public">Public</option>
              <option value="verified_only">Verified creators only</option>
              <option value="invite">Invite only</option>
            </select>
          </Field>
          <label className="mt-7 inline-flex items-start gap-2 text-sm text-text-main">
            <input
              type="checkbox"
              name="requires_verification"
              value="1"
              defaultChecked={job.requires_verification}
              className="mt-1 h-4 w-4 rounded border-border-color text-primary focus:ring-primary"
            />
            <span>
              Require <strong>verified</strong> creators
            </span>
          </label>
        </div>

        <Field label="Application deadline" hint="Leave blank to keep the existing deadline.">
          <input
            name="expires_at"
            type="date"
            defaultValue={expiresDate}
            className={inputClass}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-color/40 pt-6">
          <button
            type="submit"
            name="publish"
            value="1"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400"
          >
            Save &amp; publish →
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-text-main">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-text-secondary">{hint}</span>}
    </label>
  );
}
