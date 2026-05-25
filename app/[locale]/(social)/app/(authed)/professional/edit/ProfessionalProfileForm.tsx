'use client';

import { useState, useTransition } from 'react';
import {
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  MapPin,
  Clock,
  Eye,
  Link2,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { saveProfessionalProfile } from './actions';
import ChipPicker from '../../../../_components/ChipPicker';
import { PRESET_CATEGORIES, PRESET_LANGUAGES } from './chips-data';

/**
 * Slim, opinionated Profile editor. Trimmed in Sprint 2g from 8
 * sections down to 4 because most of the original fields were dead
 * weight for a casting / job marketplace:
 *
 *   - Identity (cover, avatar, handle, display name, bio) lives in
 *     the parent page above this form, powered by SettingsForm.
 *   - "What you do"     — Categories chip picker (drives matching).
 *   - "Where you are"   — Location + Languages.
 *   - "Working with me" — Hourly rate + "Open for work" + visibility.
 *   - "Links"           — Website + Instagram. The other 4 link rows
 *                         (twitter / youtube / tiktok / linkedin) were
 *                         pulled — Instagram is the canonical creator
 *                         platform, a personal site is the canonical
 *                         "real biography" link, the rest were noise.
 *
 * Dropped from the UI but preserved in the DB via hidden inputs so
 * existing data isn't wiped on save: headline, about, skills,
 * collaboration_status, and the unused link rows. New profiles get
 * sensible empty defaults for those columns.
 *
 * The hidden ChipPicker for skills is gone too — categories alone are
 * the platform's match signal; an unbounded skill cloud added cognitive
 * load with no payoff in recruiter search.
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
}: {
  currentHandle: string;
  defaults: Defaults;
  /** Kept on the prop signature for forward-compat — the portfolio UI
   *  itself is hidden until Phase 2 polish. */
  portfolio?: PortfolioItem[];
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

  return (
    <form action={onSubmit} className="space-y-8">
      {/* Legacy fields preserved invisibly so an upsert doesn't wipe
          existing data from the editor's pre-2g shape. */}
      <input type="hidden" name="headline" value={defaults.headline} />
      <input type="hidden" name="about" value={defaults.about} />
      <input type="hidden" name="skills" value={defaults.skills.join(',')} />
      <input
        type="hidden"
        name="collaboration_status"
        value={defaults.collaboration_status}
      />
      {/* Carry through the link rows we no longer expose so existing
          twitter / youtube / tiktok / linkedin URLs survive a save. */}
      {(['twitter', 'youtube', 'tiktok', 'linkedin'] as const).map((k) => (
        <input
          key={k}
          type="hidden"
          name={`link_${k}`}
          value={defaults.links[k] ?? ''}
        />
      ))}

      {/* ── What you do ───────────────────────────────────────────────── */}
      <Section icon={Briefcase} title="What you do">
        <ChipPicker
          name="categories"
          label="Categories"
          hint="Pick up to 3 buckets that describe you best. Drives matching + the platform sidebar filters."
          presets={PRESET_CATEGORIES}
          initial={defaults.categories}
          limit={3}
        />
      </Section>

      {/* ── Where you are ─────────────────────────────────────────────── */}
      <Section icon={MapPin} title="Where you are">
        <div className="space-y-4">
          <Field label="Location">
            <input
              name="region"
              type="text"
              defaultValue={defaults.region}
              placeholder="Berlin · Germany"
              className={inputClass}
            />
          </Field>
          <ChipPicker
            name="languages"
            label="Languages you speak"
            presets={PRESET_LANGUAGES}
            initial={defaults.languages}
            limit={5}
          />
        </div>
      </Section>

      {/* ── Working with me ───────────────────────────────────────────── */}
      <Section icon={Clock} title="Working with me">
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_120px] gap-4">
            <Field label="Hourly rate" hint="Whole EUR — leave blank if you prefer to discuss.">
              <input
                name="hourly_rate"
                type="number"
                min={0}
                step={1}
                defaultValue={
                  defaults.hourly_rate_cents != null
                    ? Math.round(defaults.hourly_rate_cents / 100)
                    : ''
                }
                placeholder="100"
                className={inputClass}
              />
            </Field>
            <Field label="Currency">
              <input
                name="currency"
                type="text"
                maxLength={3}
                defaultValue={defaults.currency || 'EUR'}
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-color bg-card/40 p-3">
            <input
              type="checkbox"
              name="availability_open"
              value="1"
              defaultChecked={defaults.availability === 'available'}
              className="mt-0.5 h-4 w-4 rounded border-border-color text-primary focus:ring-primary"
            />
            <span className="flex-1">
              <span className="block text-sm font-bold text-text-main">
                Open for work
              </span>
              <span className="block text-xs text-text-secondary">
                Show recruiters you&apos;re actively taking on projects right now.
              </span>
            </span>
          </label>
        </div>
      </Section>

      {/* ── Links ─────────────────────────────────────────────────────── */}
      <Section icon={Link2} title="Links">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Website">
            <input
              name="link_website"
              type="url"
              defaultValue={defaults.links.website ?? ''}
              placeholder="https://your-site.com"
              className={inputClass}
            />
          </Field>
          <Field label="Instagram">
            <input
              name="link_instagram"
              type="url"
              defaultValue={defaults.links.instagram ?? ''}
              placeholder="https://instagram.com/you"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* ── Visibility ────────────────────────────────────────────────── */}
      <Section icon={Eye} title="Visibility">
        <Field label="Who can see this profile?">
          <select name="visibility" defaultValue={defaults.visibility} className={inputClass}>
            <option value="public">Public — anyone can see</option>
            <option value="recruiters_only">Recruiters only (signed-in users)</option>
            <option value="private">Private — only you</option>
          </select>
        </Field>
      </Section>

      {/* ── Sticky save bar ───────────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-6 border-t border-border-color/40 bg-background/85 px-6 py-4 backdrop-blur">
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
            {pending ? 'Saving…' : 'Save profile'}
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

// ── Tiny presentational helpers ──────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Briefcase;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-color bg-card/40 p-5 sm:p-6">
      <h2 className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-text-secondary">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

const inputClass =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none [color-scheme:dark]';

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
