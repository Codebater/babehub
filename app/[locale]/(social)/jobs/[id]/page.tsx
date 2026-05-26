import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { Briefcase, MapPin, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ApplyToJobForm from './ApplyToJobForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string; locale: string }> };

async function loadJob(id: string) {
  const supabase = await createClient();
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!job) return null;

  const { data: poster } = await supabase
    .from('profiles')
    .select('handle, display_name, avatar_url, is_verified')
    .eq('id', job.poster_id)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Has the viewer already applied?
  let alreadyApplied: { id: string; status: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from('job_applications')
      .select('id, status')
      .eq('job_id', job.id)
      .eq('applicant_id', user.id)
      .maybeSingle();
    if (data) alreadyApplied = { id: data.id, status: data.status };
  }

  return { job, poster, viewer: user, alreadyApplied };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await loadJob(id);
  if (!result) return { title: 'Job not found' };
  const desc =
    result.job.description.slice(0, 160) ||
    `Apply on Babe Hub — ${result.job.location_kind} · paid creator work.`;
  return {
    title: `${result.job.title} — Babe Hub jobs`,
    description: desc,
    keywords: [
      'adult creator job',
      'creator hiring',
      'casting',
      ...(result.job.categories ?? []),
      ...(result.job.tags ?? []),
    ],
    alternates: { canonical: `/jobs/${id}` },
    openGraph: {
      type: 'article',
      title: result.job.title,
      description: desc,
      url: `https://babehub.net/jobs/${id}`,
    },
  };
}

/**
 * Build a schema.org JobPosting object for this row. Google's "Jobs
 * search experience" (Google For Jobs) crawls pages carrying this
 * schema and surfaces them in the dedicated jobs vertical of SERPs —
 * the highest-value SEO move a job listing page can make.
 *
 * Spec: https://developers.google.com/search/docs/appearance/structured-data/job-posting
 *
 * Required fields covered: title, description, datePosted,
 * hiringOrganization, jobLocation/jobLocationType, employmentType.
 * baseSalary is included when at least one budget bound is set.
 * validThrough comes from `expires_at` (set by the recruiter's
 * deadline picker, 1 week to 6 months out).
 */
function buildJobPostingLd(job: {
  id: string;
  title: string;
  description: string;
  budget_min_cents: number | null;
  budget_max_cents: number | null;
  currency: string;
  location_kind: string;
  location_text: string | null;
  categories: string[];
  published_at: string | null;
  expires_at: string | null;
}) {
  const description =
    job.description.trim() ||
    `Open job on Babe Hub. Apply directly from the platform.`;
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description,
    identifier: {
      '@type': 'PropertyValue',
      name: 'Babe Hub',
      value: job.id,
    },
    datePosted: job.published_at ?? new Date().toISOString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Babe Hub',
      sameAs: 'https://babehub.net',
    },
    employmentType: 'CONTRACTOR',
    url: `https://babehub.net/jobs/${job.id}`,
    directApply: true,
    industry: 'Adult content creation',
  };

  if (job.expires_at) ld.validThrough = job.expires_at;

  // Google For Jobs requires `jobLocationType: 'TELECOMMUTE'` for
  // remote-only roles; on-site / hybrid need a real jobLocation block.
  if (job.location_kind === 'remote') {
    ld.jobLocationType = 'TELECOMMUTE';
    ld.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'Anywhere',
    };
  } else {
    ld.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location_text ?? job.location_kind,
      },
    };
    if (job.location_kind === 'hybrid') {
      ld.jobLocationType = 'TELECOMMUTE';
    }
  }

  // baseSalary block — only emit when at least one bound is set.
  // Google accepts both a single value and MonetaryAmount with
  // min/max via QuantitativeValue.
  if (job.budget_min_cents || job.budget_max_cents) {
    const min = (job.budget_min_cents ?? job.budget_max_cents)! / 100;
    const max = (job.budget_max_cents ?? job.budget_min_cents)! / 100;
    ld.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: (job.currency || 'EUR').toUpperCase(),
      value: {
        '@type': 'QuantitativeValue',
        minValue: min,
        maxValue: max,
        unitText: 'PROJECT',
      },
    };
  }

  if (job.categories?.length) ld.occupationalCategory = job.categories.join(', ');

  return ld;
}

function formatBudget(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    (n / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase(),
      maximumFractionDigits: 0,
    });
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `from ${fmt(min)}`;
  return `up to ${fmt(max!)}`;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await loadJob(id);
  if (!result) notFound();
  const { job, poster, viewer, alreadyApplied } = result;
  const isOwnJob = viewer?.id === job.poster_id;
  const budget = formatBudget(job.budget_min_cents, job.budget_max_cents, job.currency);

  const jobPostingLd = buildJobPostingLd({
    id: job.id,
    title: job.title,
    description: job.description,
    budget_min_cents: job.budget_min_cents,
    budget_max_cents: job.budget_max_cents,
    currency: job.currency,
    location_kind: job.location_kind,
    location_text: job.location_text,
    categories: job.categories,
    published_at: job.published_at,
    expires_at: job.expires_at,
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Google For Jobs / generic JobPosting structured data. Inline
          so the crawler doesn't need to follow another request. */}
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }}
      />
      <Link
        href="/jobs"
        className="text-sm text-text-secondary transition-colors hover:text-primary"
      >
        ← All jobs
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-border-color bg-card">
        <header className="border-b border-border-color/40 p-6">
          {job.featured_until && new Date(job.featured_until) > new Date() && (
            <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
              <Sparkles className="h-3 w-3" />
              Featured
            </p>
          )}
          <h1 className="text-2xl font-black tracking-tight text-text-main sm:text-3xl">
            {job.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
            {budget && (
              <span className="font-bold text-text-main">{budget}</span>
            )}
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location_kind === 'remote'
                ? 'Remote'
                : job.location_text || job.location_kind}
            </span>
            {job.requires_verification && (
              <span className="inline-flex items-center gap-1 text-primary">
                <ShieldCheck className="h-4 w-4" />
                Verified creators only
              </span>
            )}
            {job.published_at && (
              <span className="inline-flex items-center gap-1 text-text-secondary">
                <Clock className="h-4 w-4" />
                Posted {new Date(job.published_at).toLocaleDateString()}
              </span>
            )}
            {job.expires_at && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300"
                title={`Deadline · ${new Date(job.expires_at).toLocaleString()}`}
              >
                Closes {new Date(job.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {(job.categories.length > 0 || job.tags.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.categories.map((c) => (
                <span
                  key={`cat-${c}`}
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
                >
                  {c}
                </span>
              ))}
              {job.tags.map((t) => (
                <span
                  key={`tag-${t}`}
                  className="rounded-full border border-border-color px-2.5 py-1 text-[11px] text-text-secondary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Body */}
        {job.description && (
          <div className="p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-main sm:text-base">
              {job.description}
            </p>
          </div>
        )}

        {/* Poster */}
        {poster && (
          <div className="flex items-center gap-3 border-t border-border-color/40 px-6 py-4">
            <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-secondary">
              {poster.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poster.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-xs font-black text-white">
                  {(poster.display_name || poster.handle).slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-widest text-text-secondary">
                Posted by
              </p>
              <Link
                href={`/c/${poster.handle}` as '/c/[handle]'}
                className="inline-flex items-center gap-1 text-sm font-bold text-text-main hover:text-primary"
              >
                {poster.display_name || poster.handle}
                {poster.is_verified && (
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                )}
              </Link>
            </div>
          </div>
        )}
      </article>

      {/* Apply card */}
      <section className="mt-6">
        {isOwnJob ? (
          <div className="rounded-2xl border border-border-color bg-card p-5 text-sm text-text-secondary">
            <p>
              This is your job. Manage applicants from{' '}
              <Link
                href={`/app/recruiter/jobs/${job.id}/applications` as '/app/recruiter/jobs/[id]/applications'}
                className="text-primary hover:underline"
              >
                the inbox
              </Link>
              .
            </p>
          </div>
        ) : alreadyApplied ? (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
            <p className="flex items-center gap-2 text-sm text-text-main">
              <Briefcase className="h-4 w-4 text-green-400" />
              <span className="font-bold">You applied.</span> Status:{' '}
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-text-main">
                {alreadyApplied.status}
              </span>
            </p>
            <Link
              href="/app/creator/applications"
              className="mt-2 inline-block text-xs text-text-secondary hover:text-primary"
            >
              See all your applications →
            </Link>
          </div>
        ) : !viewer ? (
          <Link
            href={`/app/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}
            className="inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Sign in to apply
          </Link>
        ) : (
          <ApplyToJobForm jobId={job.id} jobTitle={job.title} />
        )}
      </section>
    </main>
  );
}
