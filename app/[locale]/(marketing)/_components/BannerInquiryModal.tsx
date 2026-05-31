'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, ArrowRight, ArrowLeft, Loader2, Check, BarChart2, Briefcase, Users, TrendingUp } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type InquiryKind = 'banner' | 'featured_job' | 'collab';

// ── Input styles ──────────────────────────────────────────────────────────
const input =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all [color-scheme:dark]';
const select =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all appearance-none [color-scheme:dark]';

// ── Stat strip ────────────────────────────────────────────────────────────
const STATS = [
  { value: '150+', label: 'Vetted Creators' },
  { value: '95M+', label: 'Monthly Impressions' },
  { value: '48h', label: 'Reply Time' },
  { value: '100%', label: 'Brand-Safe' },
];

function StatStrip() {
  return (
    <div className="border-y border-zinc-800/60 bg-zinc-950/60 px-6 py-3 sm:px-8">
      <div className="flex items-center justify-between gap-2">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-sm font-black text-amber-300">{s.value}</p>
            <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-600">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Placement tiles ───────────────────────────────────────────────────────
const PLACEMENTS = [
  {
    value: 'banner' as InquiryKind,
    icon: BarChart2,
    label: 'Sponsored Banner',
    hint: 'High-traffic placement above the grid on /explore',
  },
  {
    value: 'featured_job' as InquiryKind,
    icon: Briefcase,
    label: 'Featured Job',
    hint: 'Promote a casting call or paid shoot at the top of /jobs',
  },
  {
    value: 'collab' as InquiryKind,
    icon: Users,
    label: 'Creator Collab',
    hint: 'Brand × creator campaign matched to your audience',
  },
] as const;

// ── Step indicator ────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6 flex items-center gap-0">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${done ? 'border-amber-400 bg-amber-400 text-black' : active ? 'border-amber-400 bg-amber-400/15 text-amber-300' : 'border-zinc-700 bg-zinc-900 text-zinc-500'}`}>
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            {i < total - 1 && <div className={`h-px w-12 transition-colors ${n < current ? 'bg-amber-400/40' : 'bg-zinc-800'}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────
const BLANK = {
  kinds: [] as InquiryKind[],
  company: '',
  website: '',
  budget: '',
  timeline: '',
  message: '',
  name: '',
  email: '',
  telegram: '',
};

export default function BannerInquiryModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const TOTAL = 2;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) { setStep(1); setForm(BLANK); setDone(false); setErr(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (name: string, value: unknown) => setForm((p) => ({ ...p, [name]: value }));

  const toggleKind = (v: InquiryKind) =>
    setForm((p) => ({ ...p, kinds: p.kinds.includes(v) ? p.kinds.filter((k) => k !== v) : [...p.kinds, v] }));

  const ok = () => {
    if (step === 1) return form.kinds.length > 0;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (step !== TOTAL || !ok()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/banner-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || `Request failed (${res.status})`);
      }
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-2xl shadow-amber-400/8"
        style={{ maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>

        {/* Gold top line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Stats strip */}
        <StatStrip />

        {/* Close */}
        <button onClick={onClose} aria-label="Close"
          className="absolute right-4 top-14 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-all hover:border-zinc-500 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          {done ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
                <TrendingUp className="h-8 w-8 text-amber-400" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400/80">Inquiry received</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">We&apos;ll be in touch.</h2>
              <p className="mt-3 max-w-xs text-sm text-zinc-400">
                Our partnerships team replies within <strong className="text-white">48 hours</strong>. We&apos;ll send you a media kit and discuss your campaign.
              </p>
              <button onClick={onClose} className="mt-7 rounded-full bg-amber-400 px-8 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400/80">Brand & Agency Partnerships</p>
                <h2 className="mt-1.5 text-xl font-black tracking-tight text-white">
                  {step === 1 && 'What would you like to do?'}
                  {step === 2 && 'How do we reach you?'}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {step === 1 && 'Pick one or more — most brands combine placements. All fields optional.'}
                  {step === 2 && 'Anonymous-friendly. Only an email is required.'}
                </p>
              </div>

              <StepDots current={step} total={TOTAL} />

              <form onSubmit={submit} className="space-y-5">

                {/* ── Step 1 ── */}
                {step === 1 && (
                  <>
                    {/* Placement tiles */}
                    <div className="space-y-2">
                      {PLACEMENTS.map(({ value, icon: Icon, label, hint }) => {
                        const active = form.kinds.includes(value);
                        return (
                          <button key={value} type="button" onClick={() => toggleKind(value)}
                            className={`group relative w-full rounded-xl border p-4 text-left transition-all ${active ? 'border-amber-400/50 bg-amber-400/8' : 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-600'}`}>
                            {active && (
                              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400">
                                <Check className="h-3 w-3 text-black" />
                              </span>
                            )}
                            <div className="flex items-start gap-3">
                              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-amber-400' : 'text-zinc-500'}`} />
                              <div>
                                <p className={`text-sm font-bold ${active ? 'text-amber-300' : 'text-zinc-300'}`}>{label}</p>
                                <p className="mt-0.5 text-xs text-zinc-600">{hint}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {form.kinds.length === 0 && <p className="text-[11px] text-zinc-600">Select at least one placement type</p>}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Brand / Company <span className="font-normal normal-case text-zinc-600">(optional)</span></label>
                        <input type="text" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Anonymous if blank" className={input} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Website <span className="font-normal normal-case text-zinc-600">(optional)</span></label>
                        <input type="text" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="example.com" className={input} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Budget <span className="font-normal normal-case text-zinc-600">(optional)</span></label>
                        <select value={form.budget} onChange={(e) => set('budget', e.target.value)} className={select}>
                          <option value="">Not sure yet</option>
                          <option value="&lt;500">Under $500</option>
                          <option value="500-2k">$500 – $2,000</option>
                          <option value="2k-5k">$2,000 – $5,000</option>
                          <option value="5k-20k">$5,000 – $20,000</option>
                          <option value="&gt;20k">$20,000+</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Timeline <span className="font-normal normal-case text-zinc-600">(optional)</span></label>
                        <select value={form.timeline} onChange={(e) => set('timeline', e.target.value)} className={select}>
                          <option value="">Flexible</option>
                          <option value="asap">ASAP</option>
                          <option value="&lt;1m">Within 1 month</option>
                          <option value="1-3m">1–3 months</option>
                          <option value="&gt;3m">3+ months</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Anything else? <span className="font-normal normal-case text-zinc-600">(optional)</span></label>
                        <span className="text-[10px] text-zinc-600">{form.message.length}/300</span>
                      </div>
                      <textarea value={form.message} onChange={(e) => set('message', e.target.value.slice(0, 300))} rows={3}
                        placeholder="Creator type, campaign brief, target niche — anything that helps us reply faster."
                        className={`${input} resize-none`} />
                    </div>
                  </>
                )}

                {/* ── Step 2 ── */}
                {step === 2 && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Email <span className="text-amber-400">*</span></label>
                      <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                        placeholder="you@brand.com" className={input} required />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Your name <span className="font-normal normal-case text-zinc-600">(optional)</span></label>
                        <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                          placeholder="Anonymous if blank" className={input} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Telegram / WhatsApp <span className="font-normal normal-case text-zinc-600">(optional)</span></label>
                        <input type="text" value={form.telegram} onChange={(e) => set('telegram', e.target.value)}
                          placeholder="@handle or +1 555…" className={input} />
                      </div>
                    </div>

                    {/* Credibility note */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-500 leading-relaxed">
                      We represent <strong className="text-zinc-300">150+ verified creators</strong> across casting, live cams, luxury, and OnlyFans niches.
                      Campaigns typically run 4–12 weeks with full reporting.
                      Our team will send you a media kit within 48 hours.
                    </div>
                  </>
                )}

                {err && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">{err}</div>
                )}

                <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
                  <button type="button" onClick={() => step > 1 && setStep((s) => s - 1)}
                    className={`flex items-center gap-1.5 rounded-full border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-400 transition-all hover:border-zinc-500 hover:text-white ${step === 1 ? 'pointer-events-none opacity-0' : ''}`}>
                    <ArrowLeft className="h-3.5 w-3.5" />Back
                  </button>

                  {step < TOTAL ? (
                    <button type="button" onClick={() => ok() && setStep((s) => s + 1)} disabled={!ok()}
                      className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100">
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button type="submit" disabled={busy || !ok()}
                      className="flex min-w-[140px] items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100">
                      {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : <>Send inquiry <ArrowRight className="h-4 w-4" /></>}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
