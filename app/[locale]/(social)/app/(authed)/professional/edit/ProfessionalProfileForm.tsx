'use client';

import { useState, useTransition } from 'react';
import { Loader2, Save, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { saveProfessionalProfile } from './actions';

/**
 * Client form for the professional profile editor. Renders every
 * field in a single column, posts to the `saveProfessionalProfile`
 * server action via a FormData payload.
 *
 * Skills / categories / languages are entered as comma-separated
 * strings for v1 (the server action handles trimming + deduping). A
 * chip-picker is a Phase-2-polish nice-to-have.
 *
 * Portfolio CRUD is intentionally read-only here for the v1 cut — we
 * surface the existing items + a "manage portfolio" link to a future
 * dedicated /app/professional/portfolio screen. That keeps the editor
 * focused; we'll wire portfolio uploads when the dedicated screen ships.
 */
type Defaults = {
  headline: string;
  about: string;
  hourly_rate_cents: number | null;
  currency: string;
  region: string;
  languages: string[];
  skills: string[];
  categories: string[];
  collaboration_status: 'open' | 'selective' | 'closed';
  availability: 'available' | 'busy' | 'unavailable';
  visibility: 'public' | 'recruiters_only' | 'private';
  links: Record<string, string>;
};

type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  external_url: string | null;
  media_id: string | null;
  sort_order: number;
  created_at: string;
};

type Status =
  | { kind: 'idle' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

export default function ProfessionalProfileForm({
  currentHandle,
  defaults,
  portfolio,
}: {
  currentHandle: string;
  defaults: Defaults;
  portfolio: PortfolioItem[];
}) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setStatus({ kind: 'idle' });
    startTransition(async () => {
      const res = await saveProfessionalProfile(formData);
      setStatus(
        res.ok
          ? { kind: 'saved' }
          : { kind: 'error', message: res.error ?? 'Could not save.' },
      );
    });
  };

  const linkRows: Array<{ key: string; label: string }> = [
    { key: 'website', label: 'Website' },
    { key: 'twitter', label: 'X / Twitter' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'youtube', label: 'YouTube' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'linkedin', label: 'LinkedIn' },
  ];

  return (
    <form action={onSubmit} className="space-y-10">
      {/* ── Identity ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
          Identity
        </h2>

        <Field label="Headline" hint="One line — 'Lifestyle creator, EU-based, available'.">
          <input
            name="headline"
            type="text"
            maxLength={140}
            defaultValue={defaults.headline}
            placeholder="What you do, in one line"
            className={inputClass}
          />
        </Field>

        <Field label="About" hint="2-3 paragraphs. What you offer, who you work with.">
          <textarea
            name="about"
            rows={5}
            maxLength={2000}
            defaultValue={defaults.about}
            className={`${inputClass} resize-y`}
          />
        </Field>
      </section>

      {/* ── Categories & skills ───────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
          What you do
        </h2>

        <Field
          label="Categories"
          hint="Up to 8, comma-separated. e.g. casting, livecam, ugc"
        >
          <input
            name="categories"
            type="text"
            defaultValue={defaults.categories.join(', ')}
            placeholder="casting, livecam, luxury, ugc"
            className={inputClass}
          />
        </Field>

        <Field
          label="Skills"
          hint="Up to 20, comma-separated. Picked up by recruiter search."
        >
          <input
            name="skills"
            type="text"
            defaultValue={defaults.skills.join(', ')}
            placeholder="dancing, modeling, scripting"
            className={inputClass}
          />
        </Field>

        <Field label="Languages" hint="Comma-separated.">
          <input
            name="languages"
            type="text"
            defaultValue={defaults.languages.join(', ')}
            placeholder="english, german, spanish"
            className={inputClass}
          />
        </Field>
      </section>

      {/* ── Rates & availability ──────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
          Rates &amp; availability
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="Hourly rate (cents)" hint="Optional. Set to 0 for 'negotiable'.">
            <input
              name="hourly_rate_cents"
              type="number"
              min={0}
              step={100}
              defaultValue={defaults.hourly_rate_cents ?? ''}
              placeholder="e.g. 10000 = $100/hr"
              className={inputClass}
            />
          </Field>
          <Field label="Currency">
            <input
              name="currency"
              type="text"
              maxLength={3}
              defaultValue={defaults.currency}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Region" hint="City, country, or 'Remote'.">
          <input
            name="region"
            type="text"
            defaultValue={defaults.region}
            placeholder="Berlin · Germany"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Collaboration">
            <select
              name="collaboration_status"
              defaultValue={defaults.collaboration_status}
              className={inputClass}
            >
              <option value="open">Open — accepting work</option>
              <option value="selective">Selective — case by case</option>
              <option value="closed">Closed — not accepting</option>
            </select>
          </Field>
          <Field label="Availability">
            <select
              name="availability"
              defaultValue={defaults.availability}
              className={inputClass}
            >
              <option value="available">Available now</option>
              <option value="busy">Busy — limited capacity</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </Field>
        </div>
      </section>

      {/* ── Links ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
          Links
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {linkRows.map(({ key, label }) => (
            <Field key={key} label={label}>
              <input
                name={`link_${key}`}
                type="url"
                defaultValue={defaults.links[key] ?? ''}
                placeholder="https://…"
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      </section>

      {/* ── Visibility ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
          Visibility
        </h2>
        <Field label="Who can see this profile?">
          <select
            name="visibility"
            defaultValue={defaults.visibility}
            className={inputClass}
          >
            <option value="public">Public — anyone can see</option>
            <option value="recruiters_only">Recruiters only (signed-in users)</option>
            <option value="private">Private — only you</option>
          </select>
        </Field>
      </section>

      {/* ── Portfolio (read-only stub for v1) ─────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
            Portfolio ({portfolio.length})
          </h2>
        </div>
        {portfolio.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-6 text-center text-sm text-text-secondary">
            No portfolio items yet. The dedicated portfolio editor is shipping next
            — for now, drop work references in the &quot;About&quot; field above.
          </p>
        ) : (
          <ul className="space-y-2">
            {portfolio.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-border-color bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-main">
                    {item.title || 'Untitled'}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
                      {item.description}
                    </p>
                  )}
                  {item.external_url && (
                    <a
                      href={item.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {new URL(item.external_url).hostname}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Status + submit ───────────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-6 border-t border-border-color/40 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {pending ? 'Saving…' : 'Save professional profile'}
          </button>

          <Link
            href={`/c/${currentHandle}` as '/c/[handle]'}
            className="text-sm text-text-secondary transition-colors hover:text-primary"
          >
            View public profile →
          </Link>

          {status.kind === 'saved' && (
            <span className="inline-flex items-center gap-1 text-xs text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
          {status.kind === 'error' && (
            <span className="inline-flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-4 w-4" />
              {status.message}
            </span>
          )}
        </div>
      </div>
    </form>
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
