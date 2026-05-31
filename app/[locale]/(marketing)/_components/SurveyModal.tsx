'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, ArrowRight, ArrowLeft, Loader2, Check, Clapperboard, Radio, Gem, Star, Lock, Shield } from 'lucide-react';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Shared input styles ───────────────────────────────────────────────────
const input =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all [color-scheme:dark]';

const select =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-white focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none [color-scheme:dark]';

// ── Section tiles (step 1) ────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'casting',
    icon: Clapperboard,
    label: 'Casting',
    desc: 'Auditions, paid shoots, brand campaigns',
    color: 'group-hover:text-primary data-[active=true]:text-primary',
    border: 'data-[active=true]:border-primary/60 data-[active=true]:bg-primary/8',
  },
  {
    id: 'live-cams',
    icon: Radio,
    label: 'Live Cams',
    desc: 'Chaturbate, Stripchat, cam studios',
    color: 'group-hover:text-red-400 data-[active=true]:text-red-400',
    border: 'data-[active=true]:border-red-400/50 data-[active=true]:bg-red-400/6',
  },
  {
    id: 'luxury',
    icon: Gem,
    label: 'Luxury',
    desc: 'High-end editorial, brand deals',
    color: 'group-hover:text-amber-300 data-[active=true]:text-amber-300',
    border: 'data-[active=true]:border-amber-300/50 data-[active=true]:bg-amber-300/6',
  },
  {
    id: 'onlyfans',
    icon: Star,
    label: 'OnlyFans / Content',
    desc: 'Subscriptions, PPV, fan engagement',
    color: 'group-hover:text-sky-300 data-[active=true]:text-sky-300',
    border: 'data-[active=true]:border-sky-300/50 data-[active=true]:bg-sky-300/6',
  },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

// ── Step indicator ─────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                done
                  ? 'border-primary bg-primary text-white'
                  : active
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-500'
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            {i < total - 1 && (
              <div className={`h-px w-8 sm:w-12 transition-colors ${n < current ? 'bg-primary/50' : 'bg-zinc-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Yes / No choice card ───────────────────────────────────────────────────
function YesNo({
  label,
  name,
  value,
  selected,
  onSelect,
}: {
  label: string;
  name: string;
  value: string;
  selected: string;
  onSelect: (n: string, v: string) => void;
}) {
  const active = selected === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(name, value)}
      className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all ${
        active
          ? 'border-primary bg-primary/12 text-primary'
          : 'border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

// ── Checkbox ───────────────────────────────────────────────────────────────
function Checkbox({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label htmlFor={name} className="flex cursor-pointer items-start gap-3 group">
      <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-600 transition-all checked:border-primary checked:bg-primary"
        />
        <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" />
      </div>
      <span className="text-xs leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors">{label}</span>
    </label>
  );
}

// ── Initial form state ─────────────────────────────────────────────────────
const BLANK = {
  sections: [] as SectionId[],
  isOver18: '',
  isActiveCreator: '',
  isGeneratingRevenue: '',
  monthlyEarnings: '',
  country: '',
  socialPlatform: '',
  socialHandle: '',
  contentType: '',
  goals: '',
  interestedInCampaigns: false,
  agreesToProfitShare: false,
  name: '',
  email: '',
  whatsapp: '',
};

// ── Modal ──────────────────────────────────────────────────────────────────
export default function SurveyModal({ isOpen, onClose }: SurveyModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const TOTAL = 3;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) { setStep(1); setForm(BLANK); setDone(false); setErr(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (name: string, value: unknown) =>
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === 'isGeneratingRevenue' && value === 'no') next.monthlyEarnings = '';
      return next;
    });

  const toggleSection = (id: SectionId) =>
    setForm((p) => ({
      ...p,
      sections: p.sections.includes(id)
        ? p.sections.filter((s) => s !== id)
        : [...p.sections, id],
    }));

  const ok = () => {
    switch (step) {
      case 1: {
        const revenueOk = form.isGeneratingRevenue === 'yes' ? form.monthlyEarnings !== '' : true;
        return (
          form.sections.length > 0 &&
          form.isOver18 === 'yes' &&
          form.isActiveCreator !== '' &&
          form.isGeneratingRevenue !== '' &&
          revenueOk &&
          form.country !== ''
        );
      }
      case 2:
        return form.socialPlatform.trim() !== '' && form.contentType.trim() !== '';
      case 3:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      default:
        return false;
    }
  };

  const next = () => step < TOTAL && setStep((s) => s + 1);
  const back = () => step > 1 && setStep((s) => s - 1);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (step !== TOTAL || !ok()) return;
    setBusy(true);
    setErr(null);

    // Prepend section interest to goals so it's captured in the DB
    const sectionLabel = form.sections
      .map((s) => SECTIONS.find((x) => x.id === s)?.label)
      .filter(Boolean)
      .join(', ');
    const goals = `[Interest: ${sectionLabel}] ${form.goals}`.trim();

    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, goals }),
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-2xl shadow-primary/10"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient rule */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-all hover:border-zinc-500 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto px-6 py-7 sm:px-8">
          {done ? (
            /* ── Success ── */
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-400/80">Application received</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">You&apos;re in the queue.</h2>
              <p className="mt-3 max-w-xs text-sm text-zinc-400">
                We review every application personally. If you&apos;re a strong fit you&apos;ll hear from us within 48 hours — check your inbox and{' '}
                <strong className="text-white">your BabeHub chat</strong>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Confidential</span>
                <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" />No obligation</span>
              </div>
              <button
                onClick={onClose}
                className="mt-7 rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80">Apply to BabeHub</p>
                <h2 className="mt-1.5 text-xl font-black tracking-tight text-white">
                  {step === 1 && 'Tell us about yourself'}
                  {step === 2 && 'Your platform & niche'}
                  {step === 3 && 'How to reach you'}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {step === 1 && 'Confidential · takes under 3 minutes'}
                  {step === 2 && 'Help us understand your content and goals'}
                  {step === 3 && 'Reviewed personally · reply within 48 hours'}
                </p>
              </div>

              <StepDots current={step} total={TOTAL} />

              <form onSubmit={submit} className="space-y-5">

                {/* ── Step 1 ── */}
                {step === 1 && (
                  <>
                    {/* Section tiles */}
                    <fieldset>
                      <legend className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Which section of BabeHub fits you? <span className="text-primary">*</span>
                      </legend>
                      <div className="grid grid-cols-2 gap-2">
                        {SECTIONS.map(({ id, icon: Icon, label, desc, color, border }) => {
                          const active = form.sections.includes(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              data-active={active}
                              onClick={() => toggleSection(id)}
                              className={`group rounded-xl border border-zinc-700 bg-zinc-900/60 p-3 text-left transition-all hover:border-zinc-600 ${border}`}
                            >
                              <Icon className={`mb-1.5 h-4 w-4 text-zinc-500 transition-colors ${color}`} />
                              <p className={`text-xs font-bold text-zinc-300 transition-colors ${color}`}>{label}</p>
                              <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">{desc}</p>
                            </button>
                          );
                        })}
                      </div>
                      {form.sections.length === 0 && (
                        <p className="mt-1.5 text-[11px] text-zinc-600">Select at least one</p>
                      )}
                    </fieldset>

                    {/* 18+ */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Are you 18 or over? <span className="text-primary">*</span>
                      </p>
                      <div className="flex gap-3">
                        <YesNo name="isOver18" value="yes" label="Yes" selected={form.isOver18} onSelect={set} />
                        <YesNo name="isOver18" value="no" label="No" selected={form.isOver18} onSelect={set} />
                      </div>
                      {form.isOver18 === 'no' && (
                        <p className="mt-1.5 text-[11px] text-red-400">You must be 18+ to apply.</p>
                      )}
                    </div>

                    {/* Active creator */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Currently active as a creator or performer? <span className="text-primary">*</span>
                      </p>
                      <div className="flex gap-3">
                        <YesNo name="isActiveCreator" value="yes" label="Yes" selected={form.isActiveCreator} onSelect={set} />
                        <YesNo name="isActiveCreator" value="no" label="No — just starting" selected={form.isActiveCreator} onSelect={set} />
                      </div>
                    </div>

                    {/* Revenue */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Currently generating revenue? <span className="text-primary">*</span>
                      </p>
                      <div className="flex gap-3">
                        <YesNo name="isGeneratingRevenue" value="yes" label="Yes" selected={form.isGeneratingRevenue} onSelect={set} />
                        <YesNo name="isGeneratingRevenue" value="no" label="Not yet" selected={form.isGeneratingRevenue} onSelect={set} />
                      </div>
                    </div>

                    {form.isGeneratingRevenue === 'yes' && (
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                          Monthly earnings (USD) <span className="text-primary">*</span>
                        </label>
                        <select
                          name="monthlyEarnings"
                          value={form.monthlyEarnings}
                          onChange={(e) => set('monthlyEarnings', e.target.value)}
                          className={select}
                          required
                        >
                          <option value="" disabled>Select range…</option>
                          <option value="&lt;1k">Less than $1,000</option>
                          <option value="1k-5k">$1,000 – $5,000</option>
                          <option value="5k-10k">$5,000 – $10,000</option>
                          <option value="10k-20k">$10,000 – $20,000</option>
                          <option value="&gt;20k">More than $20,000</option>
                        </select>
                      </div>
                    )}

                    {/* Country */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Country <span className="text-primary">*</span>
                      </label>
                      <select
                        name="country"
                        value={form.country}
                        onChange={(e) => set('country', e.target.value)}
                        className={select}
                        required
                      >
                        <option value="" disabled>Select your country…</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="NL">Netherlands</option>
                        <option value="FR">France</option>
                        <option value="ES">Spain</option>
                        <option value="IT">Italy</option>
                        <option value="BR">Brazil</option>
                        <option value="CO">Colombia</option>
                        <option value="MX">Mexico</option>
                        <option value="TH">Thailand</option>
                        <option value="PH">Philippines</option>
                        <option value="RO">Romania</option>
                        <option value="CZ">Czech Republic</option>
                        <option value="HU">Hungary</option>
                        <option value="JP">Japan</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ── Step 2 ── */}
                {step === 2 && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                          Main platform <span className="text-primary">*</span>
                        </label>
                        <select
                          name="socialPlatform"
                          value={form.socialPlatform}
                          onChange={(e) => set('socialPlatform', e.target.value)}
                          className={select}
                          required
                        >
                          <option value="" disabled>Select platform…</option>
                          <option value="OnlyFans">OnlyFans</option>
                          <option value="Fansly">Fansly</option>
                          <option value="Chaturbate">Chaturbate</option>
                          <option value="Stripchat">Stripchat</option>
                          <option value="BongaCams">BongaCams</option>
                          <option value="Instagram">Instagram</option>
                          <option value="TikTok">TikTok</option>
                          <option value="Twitter/X">Twitter / X</option>
                          <option value="Loyalfans / Fanvue">Loyalfans / Fanvue</option>
                          <option value="Other">Other / Multiple</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                          Handle / username{' '}
                          <span className="font-normal normal-case text-zinc-600">(optional)</span>
                        </label>
                        <input
                          type="text"
                          name="socialHandle"
                          value={form.socialHandle}
                          onChange={(e) => set('socialHandle', e.target.value)}
                          placeholder="@username — leave blank to stay anon"
                          className={input}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Content type <span className="text-primary">*</span>
                      </label>
                      <select
                        name="contentType"
                        value={form.contentType}
                        onChange={(e) => set('contentType', e.target.value)}
                        className={select}
                        required
                      >
                        <option value="" disabled>Select category…</option>
                        <option value="fully-explicit">Fully explicit (no restrictions)</option>
                        <option value="some-explicit">Some explicit (personal limits apply)</option>
                        <option value="non-explicit">Non-explicit / mainstream crossover</option>
                      </select>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                          Goals{' '}
                          <span className="font-normal normal-case text-zinc-600">(optional)</span>
                        </label>
                        <span className="text-[10px] text-zinc-600">{form.goals.length}/300</span>
                      </div>
                      <textarea
                        name="goals"
                        value={form.goals}
                        onChange={(e) => set('goals', e.target.value.slice(0, 300))}
                        rows={3}
                        placeholder="e.g. Grow my cam audience, break into casting, build a luxury brand, increase OnlyFans revenue…"
                        className={`${input} resize-none`}
                      />
                    </div>

                    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <Checkbox
                        name="interestedInCampaigns"
                        checked={form.interestedInCampaigns}
                        onChange={(e) => set('interestedInCampaigns', e.target.checked)}
                        label={
                          <span>
                            Yes — I&apos;m interested in optional{' '}
                            <strong className="text-white">paid campaigns</strong> and agree to work
                            under <strong className="text-white">NDAs</strong> where required.
                          </span>
                        }
                      />
                      <Checkbox
                        name="agreesToProfitShare"
                        checked={form.agreesToProfitShare}
                        onChange={(e) => set('agreesToProfitShare', e.target.checked)}
                        label={
                          <span>
                            I acknowledge BabeHub&apos;s{' '}
                            <strong className="text-white">30–40% revenue share</strong>. The exact split
                            will be confirmed during the discovery call.
                          </span>
                        }
                      />
                    </div>
                  </>
                )}

                {/* ── Step 3 ── */}
                {step === 3 && (
                  <>
                    <div className="mb-1 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                      <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1.5"><Lock className="h-3 w-3 text-zinc-600" />Confidential</span>
                        <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-zinc-600" />No obligation</span>
                        <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-zinc-600" />No upfront cost</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Name{' '}
                        <span className="font-normal normal-case text-zinc-600">(optional)</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="Jane Doe or your stage name"
                        className={input}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Email address <span className="text-primary">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="you@example.com"
                        className={input}
                        required
                      />
                      <p className="mt-1.5 text-[11px] text-zinc-600">
                        We&apos;ll only use this to reply to your application.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        WhatsApp{' '}
                        <span className="font-normal normal-case text-zinc-600">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={form.whatsapp}
                        onChange={(e) => set('whatsapp', e.target.value)}
                        placeholder="+1 123 456 7890"
                        className={input}
                      />
                    </div>

                    <p className="text-center text-[11px] text-zinc-600">
                      By applying you confirm you are 18+ and that adult content is legal in your
                      jurisdiction.
                    </p>
                  </>
                )}

                {/* Error */}
                {err && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">
                    {err}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
                  <button
                    type="button"
                    onClick={back}
                    className={`flex items-center gap-1.5 rounded-full border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-400 transition-all hover:border-zinc-500 hover:text-white ${
                      step === 1 ? 'pointer-events-none opacity-0' : ''
                    }`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>

                  {step < TOTAL ? (
                    <button
                      type="button"
                      onClick={next}
                      disabled={!ok()}
                      className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={busy || !ok()}
                      className="flex min-w-[140px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                    >
                      {busy ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                      ) : (
                        <>Submit Application <ArrowRight className="h-4 w-4" /></>
                      )}
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
