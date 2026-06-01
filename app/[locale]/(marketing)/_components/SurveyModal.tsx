'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { X, ArrowRight, ArrowLeft, Loader2, Check, Clapperboard, Radio, Gem, Star, Lock, Shield, MessageCircle, ImagePlus } from 'lucide-react';
import { track } from '@/lib/analytics/track';

type UploadedImage = { preview: string; path?: string; uploading: boolean };

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Input styles ──────────────────────────────────────────────────────────
const input =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all [color-scheme:dark]';
const select =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-white focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none [color-scheme:dark]';

// ── Industry trust strip ──────────────────────────────────────────────────
const TRUST_BRANDS = [
  { label: 'OnlyFans', cls: 'text-sky-400' },
  { label: 'Chaturbate', cls: 'text-amber-400' },
  { label: 'Stripchat', cls: 'text-primary' },
  { label: 'Fansly', cls: 'text-purple-400' },
  { label: 'BRAZZERS', cls: 'text-white font-black tracking-tight' },
  { label: 'Czech Casting', cls: 'text-primary italic' },
  { label: 'BangBros', cls: 'text-white' },
  { label: 'xHamster', cls: 'text-primary' },
  { label: 'Luxury Brands', cls: 'text-amber-300' },
];

function TrustStrip() {
  return (
    <div className="relative overflow-hidden border-y border-zinc-800/60 py-2.5">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-zinc-950 to-transparent" />
      <div className="flex animate-marquee gap-8 whitespace-nowrap">
        {[...TRUST_BRANDS, ...TRUST_BRANDS].map((b, i) => (
          <span key={i} className={`shrink-0 text-xs font-bold opacity-40 ${b.cls}`}>
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Section tiles ─────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'casting', icon: Clapperboard, label: 'Casting', desc: 'Auditions · paid shoots · campaigns', activeCls: 'border-primary/60 bg-primary/8 text-primary' },
  { id: 'live-cams', icon: Radio, label: 'Live Cams', desc: 'Chaturbate · Stripchat · studios', activeCls: 'border-red-400/50 bg-red-400/6 text-red-400' },
  { id: 'luxury', icon: Gem, label: 'Luxury', desc: 'High-end editorial · brand deals', activeCls: 'border-amber-300/50 bg-amber-300/6 text-amber-300' },
  { id: 'onlyfans', icon: Star, label: 'OnlyFans / Content', desc: 'Subscriptions · PPV · fans', activeCls: 'border-sky-300/50 bg-sky-300/6 text-sky-300' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

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
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${done ? 'border-primary bg-primary text-white' : active ? 'border-primary bg-primary/15 text-primary' : 'border-zinc-700 bg-zinc-900 text-zinc-500'}`}>
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            {i < total - 1 && <div className={`h-px w-8 sm:w-12 transition-colors ${n < current ? 'bg-primary/50' : 'bg-zinc-800'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function YesNo({ name, value, label, selected, onSelect }: { name: string; value: string; label: string; selected: string; onSelect: (n: string, v: string) => void }) {
  return (
    <button type="button" onClick={() => onSelect(name, value)}
      className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all ${selected === value ? 'border-primary bg-primary/12 text-primary' : 'border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-white'}`}>
      {label}
    </button>
  );
}

function Checkbox({ name, label, checked, onChange }: { name: string; label: React.ReactNode; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label htmlFor={name} className="flex cursor-pointer items-start gap-3 group">
      <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input id={name} name={name} type="checkbox" checked={checked} onChange={onChange}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-600 transition-all checked:border-primary checked:bg-primary" />
        <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" />
      </div>
      <span className="text-xs leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors">{label}</span>
    </label>
  );
}

// ── Form state ────────────────────────────────────────────────────────────
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
  whatsapp: '',
  telegram: '',
  email: '',
  name: '',
  gender: '',
};

export default function SurveyModal({ isOpen, onClose }: SurveyModalProps) {
  // 'quick' = one-screen apply (niche + contact); 'full' = the detailed
  // 3-step survey. Quick is the default conversion path.
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const TOTAL = 3;
  const MAX_PHOTOS = 4;

  const addPhotos = async (files: FileList) => {
    const room = MAX_PHOTOS - images.length;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    for (const file of picked) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) continue;
      const preview = URL.createObjectURL(file);
      setImages((p) => [...p, { preview, uploading: true }]);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/apply-upload', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.path) {
          setImages((p) => p.map((im) => (im.preview === preview ? { ...im, path: data.path, uploading: false } : im)));
        } else {
          setImages((p) => p.filter((im) => im.preview !== preview));
        }
      } catch {
        setImages((p) => p.filter((im) => im.preview !== preview));
      }
    }
  };

  const removePhoto = (preview: string) => {
    setImages((p) => p.filter((im) => im.preview !== preview));
    URL.revokeObjectURL(preview);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setMode('quick'); setStep(1); setForm(BLANK); setDone(false); setErr(null); setImages([]);
      track('apply_open');
    }
  }, [isOpen]);

  // Funnel step tracking — fires when the user advances past step 1.
  useEffect(() => {
    if (!isOpen) return;
    if (step === 2) track('apply_step2');
    else if (step === 3) track('apply_step3');
  }, [step, isOpen]);

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
      sections: p.sections.includes(id) ? p.sections.filter((s) => s !== id) : [...p.sections, id],
    }));

  const hasContact = () =>
    !!(form.whatsapp.trim() || form.telegram.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email));

  const ok = () => {
    if (mode === 'quick') {
      // Name, gender, experience, niche, a contact, and 18+ confirmed.
      return (
        form.name.trim().length >= 2 &&
        form.gender !== '' &&
        form.isActiveCreator !== '' &&
        form.sections.length > 0 &&
        hasContact() &&
        form.isOver18 === 'yes'
      );
    }
    switch (step) {
      case 1: {
        const revenueOk = form.isGeneratingRevenue === 'yes' ? form.monthlyEarnings !== '' : true;
        return form.sections.length > 0 && form.isOver18 === 'yes' && form.isActiveCreator !== '' && form.isGeneratingRevenue !== '' && revenueOk && form.country !== '';
      }
      case 2:
        return form.socialPlatform.trim() !== '' && form.contentType.trim() !== '';
      case 3:
        return hasContact();
      default:
        return false;
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok()) return;
    if (mode === 'full' && step !== TOTAL) return;
    setBusy(true);
    setErr(null);
    track(mode === 'quick' ? 'quick_apply_submit' : 'apply_submit');
    const sectionLabel = form.sections.map((s) => SECTIONS.find((x) => x.id === s)?.label).filter(Boolean).join(', ');
    const goals = `[Interest: ${sectionLabel}] ${form.goals}`.trim();
    const image_paths = images.filter((i) => i.path).map((i) => i.path as string);
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, goals, image_paths }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || `Request failed (${res.status})`);
      }
      setDone(true);
      track(mode === 'quick' ? 'quick_apply_success' : 'apply_success');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      track('apply_error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-2xl shadow-primary/10"
        style={{ maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>

        {/* Top glow line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Brand marquee trust strip */}
        <TrustStrip />

        {/* Close */}
        <button onClick={onClose} aria-label="Close"
          className="absolute right-4 top-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-all hover:border-zinc-500 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          {done ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-400/80">Application received</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">You&apos;re in the queue.</h2>
              <p className="mt-3 max-w-sm text-sm text-zinc-400">
                We review every application personally — usually within 48 hours.
              </p>
              <p className="mt-2 max-w-sm text-sm text-zinc-400">
                <strong className="text-white">Once you&apos;re approved</strong>, we&apos;ll reach out on
                WhatsApp / Telegram and unlock your account — you&apos;ll be able to set up your{' '}
                <strong className="text-white">profile</strong> and chat directly with our team.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Confidential</span>
                <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" />No obligation</span>
              </div>
              <button onClick={onClose} className="mt-7 rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400">
                Done
              </button>
            </div>
          ) : mode === 'quick' ? (
            /* ─────────────────── QUICK APPLY (one screen) ─────────────────── */
            <>
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80">Apply to BabeHub</p>
                <h2 className="mt-1.5 text-xl font-black tracking-tight text-white">Apply in 30 seconds</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Pick your niche, drop a contact — we&apos;ll take it from there in chat.</p>
              </div>

              <form onSubmit={submit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    What should we call you? <span className="text-primary">*</span>
                  </label>
                  <input type="text" value={form.name} maxLength={50} onChange={(e) => set('name', e.target.value)}
                    placeholder="First name or stage name" className={input} />
                </div>

                {/* Gender */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    You are <span className="text-primary">*</span>
                  </p>
                  <div className="flex gap-2">
                    {([['woman', 'Woman'], ['man', 'Man'], ['non_binary', 'Non-binary']] as const).map(([val, label]) => (
                      <button key={val} type="button" onClick={() => set('gender', val)}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                          form.gender === val ? 'border-primary bg-primary/12 text-primary' : 'border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-white'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Your experience <span className="text-primary">*</span>
                  </p>
                  <div className="flex gap-2">
                    <YesNo name="isActiveCreator" value="no" label="Just starting" selected={form.isActiveCreator} onSelect={set} />
                    <YesNo name="isActiveCreator" value="yes" label="Experienced / pro" selected={form.isActiveCreator} onSelect={set} />
                  </div>
                </div>

                {/* Niche */}
                <fieldset>
                  <legend className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    What&apos;s your niche? <span className="text-primary">*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTIONS.map(({ id, icon: Icon, label, desc, activeCls }) => {
                      const active = form.sections.includes(id);
                      return (
                        <button key={id} type="button" onClick={() => toggleSection(id)}
                          className={`group rounded-xl border border-zinc-700 bg-zinc-900/60 p-3 text-left transition-all hover:border-zinc-600 ${active ? activeCls : ''}`}>
                          <Icon className={`mb-1.5 h-4 w-4 transition-colors ${active ? '' : 'text-zinc-500'}`} />
                          <p className="text-xs font-bold text-zinc-300">{label}</p>
                          <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">{desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Contact */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    How do we reach you? <span className="text-primary">*</span>
                    <span className="ml-2 font-normal normal-case text-zinc-600">— one is enough</span>
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                        <MessageCircle className="h-3.5 w-3.5 text-green-400" /> WhatsApp
                      </label>
                      <input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)}
                        placeholder="+1 123 456 7890" className={input} />
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                        <MessageCircle className="h-3.5 w-3.5 text-sky-400" /> Telegram
                      </label>
                      <input type="text" value={form.telegram} onChange={(e) => set('telegram', e.target.value)}
                        placeholder="@username" className={input} />
                    </div>
                  </div>
                </div>

                {/* Optional photos */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Photos <span className="font-normal normal-case text-zinc-600">(optional — helps us review faster)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {images.map((im) => (
                      <div key={im.preview} className="relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={im.preview} alt="" className="h-full w-full object-cover" />
                        {im.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </div>
                        )}
                        {!im.uploading && (
                          <button type="button" onClick={() => removePhoto(im.preview)}
                            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {images.length < MAX_PHOTOS && (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-700 text-zinc-500 transition-colors hover:border-primary/50 hover:text-primary">
                        <ImagePlus className="h-4 w-4" />
                        <span className="text-[8px] font-bold uppercase tracking-wider">Add</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { if (e.target.files) addPhotos(e.target.files); e.target.value = ''; }} />
                </div>

                {/* 18+ */}
                <Checkbox
                  name="quick18"
                  checked={form.isOver18 === 'yes'}
                  onChange={(e) => set('isOver18', e.target.checked ? 'yes' : '')}
                  label={<span>I confirm I am <strong className="text-white">18 years or older</strong> and that adult content is legal where I live.</span>}
                />

                {err && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">{err}</div>
                )}

                <button type="submit" disabled={busy || !ok()}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100">
                  {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <>Submit Application <ArrowRight className="h-4 w-4" /></>}
                </button>

                <div className="flex items-center justify-center gap-4 pt-1 text-[10px] text-zinc-600">
                  <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Confidential</span>
                  <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" />No obligation</span>
                </div>

                <button type="button" onClick={() => setMode('full')}
                  className="w-full text-center text-[11px] text-zinc-500 underline-offset-2 transition-colors hover:text-primary hover:underline">
                  Prefer the detailed application? Add more about yourself →
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-5">
                <button type="button" onClick={() => setMode('quick')}
                  className="mb-2 inline-flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-primary">
                  <ArrowLeft className="h-3 w-3" /> Back to quick apply
                </button>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80">Apply to BabeHub</p>
                <h2 className="mt-1.5 text-xl font-black tracking-tight text-white">
                  {step === 1 && 'Tell us about yourself'}
                  {step === 2 && 'Your platform & niche'}
                  {step === 3 && 'How to reach you'}
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {step === 1 && 'Confidential · under 3 minutes'}
                  {step === 2 && 'Help us understand your content and goals'}
                  {step === 3 && 'Reviewed personally · reply within 48 hours'}
                </p>
              </div>

              <StepDots current={step} total={TOTAL} />

              <form onSubmit={submit} className="space-y-5">

                {/* ── Step 1 ── */}
                {step === 1 && (
                  <>
                    <fieldset>
                      <legend className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Which section fits you? <span className="text-primary">*</span>
                      </legend>
                      <div className="grid grid-cols-2 gap-2">
                        {SECTIONS.map(({ id, icon: Icon, label, desc, activeCls }) => {
                          const active = form.sections.includes(id);
                          return (
                            <button key={id} type="button" onClick={() => toggleSection(id)}
                              className={`group rounded-xl border border-zinc-700 bg-zinc-900/60 p-3 text-left transition-all hover:border-zinc-600 ${active ? activeCls : ''}`}>
                              <Icon className={`mb-1.5 h-4 w-4 transition-colors ${active ? '' : 'text-zinc-500'}`} />
                              <p className="text-xs font-bold text-zinc-300">{label}</p>
                              <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">{desc}</p>
                            </button>
                          );
                        })}
                      </div>
                      {form.sections.length === 0 && <p className="mt-1.5 text-[11px] text-zinc-600">Select at least one</p>}
                    </fieldset>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">18 or over? <span className="text-primary">*</span></p>
                      <div className="flex gap-3">
                        <YesNo name="isOver18" value="yes" label="Yes" selected={form.isOver18} onSelect={set} />
                        <YesNo name="isOver18" value="no" label="No" selected={form.isOver18} onSelect={set} />
                      </div>
                      {form.isOver18 === 'no' && <p className="mt-1.5 text-[11px] text-red-400">You must be 18+ to apply.</p>}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Currently active as creator or performer? <span className="text-primary">*</span></p>
                      <div className="flex gap-3">
                        <YesNo name="isActiveCreator" value="yes" label="Yes" selected={form.isActiveCreator} onSelect={set} />
                        <YesNo name="isActiveCreator" value="no" label="No — just starting" selected={form.isActiveCreator} onSelect={set} />
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Currently generating revenue? <span className="text-primary">*</span></p>
                      <div className="flex gap-3">
                        <YesNo name="isGeneratingRevenue" value="yes" label="Yes" selected={form.isGeneratingRevenue} onSelect={set} />
                        <YesNo name="isGeneratingRevenue" value="no" label="Not yet" selected={form.isGeneratingRevenue} onSelect={set} />
                      </div>
                    </div>

                    {form.isGeneratingRevenue === 'yes' && (
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Monthly earnings (USD) <span className="text-primary">*</span></label>
                        <select value={form.monthlyEarnings} onChange={(e) => set('monthlyEarnings', e.target.value)} className={select} required>
                          <option value="" disabled>Select range…</option>
                          <option value="&lt;1k">Less than $1,000</option>
                          <option value="1k-5k">$1,000 – $5,000</option>
                          <option value="5k-10k">$5,000 – $10,000</option>
                          <option value="10k-20k">$10,000 – $20,000</option>
                          <option value="&gt;20k">More than $20,000</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Country <span className="text-primary">*</span></label>
                      <select value={form.country} onChange={(e) => set('country', e.target.value)} className={select} required>
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
                        <option value="RO">Romania</option>
                        <option value="CZ">Czech Republic</option>
                        <option value="HU">Hungary</option>
                        <option value="BR">Brazil</option>
                        <option value="CO">Colombia</option>
                        <option value="MX">Mexico</option>
                        <option value="TH">Thailand</option>
                        <option value="PH">Philippines</option>
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
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Main platform <span className="text-primary">*</span></label>
                        <select value={form.socialPlatform} onChange={(e) => set('socialPlatform', e.target.value)} className={select} required>
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
                          <option value="None">None — just starting</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                          Handle <span className="font-normal normal-case text-zinc-600">(optional)</span>
                        </label>
                        <input type="text" value={form.socialHandle} onChange={(e) => set('socialHandle', e.target.value)}
                          placeholder="@username or leave blank" className={input} />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Content type <span className="text-primary">*</span></label>
                      <select value={form.contentType} onChange={(e) => set('contentType', e.target.value)} className={select} required>
                        <option value="" disabled>Select category…</option>
                        <option value="fully-explicit">Fully explicit (no restrictions)</option>
                        <option value="some-explicit">Some explicit (personal limits apply)</option>
                        <option value="non-explicit">Non-explicit / mainstream crossover</option>
                      </select>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Goals <span className="font-normal normal-case text-zinc-600">(optional)</span></label>
                        <span className="text-[10px] text-zinc-600">{form.goals.length}/300</span>
                      </div>
                      <textarea value={form.goals} onChange={(e) => set('goals', e.target.value.slice(0, 300))} rows={3}
                        placeholder="e.g. Grow my cam audience, break into casting, build a luxury brand, scale OnlyFans revenue…"
                        className={`${input} resize-none`} />
                    </div>

                    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <Checkbox name="interestedInCampaigns" checked={form.interestedInCampaigns}
                        onChange={(e) => set('interestedInCampaigns', e.target.checked)}
                        label={<span>Yes — I&apos;m interested in optional <strong className="text-white">paid campaigns</strong> and agree to work under <strong className="text-white">NDAs</strong> where required.</span>} />
                      <Checkbox name="agreesToProfitShare" checked={form.agreesToProfitShare}
                        onChange={(e) => set('agreesToProfitShare', e.target.checked)}
                        label={<span>I acknowledge BabeHub&apos;s <strong className="text-white">30–40% revenue share</strong>. The exact split will be confirmed during the discovery call.</span>} />
                    </div>
                  </>
                )}

                {/* ── Step 3 ── */}
                {step === 3 && (
                  <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                      <div className="flex flex-wrap gap-4 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" />Confidential</span>
                        <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" />No obligation</span>
                        <span className="flex items-center gap-1.5"><Check className="h-3 w-3" />No upfront cost</span>
                      </div>
                    </div>

                    {/* Primary: messaging apps */}
                    <div>
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Contact via messaging <span className="text-primary">*</span>
                        <span className="ml-2 font-normal normal-case text-zinc-600">— at least one required</span>
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                            <MessageCircle className="h-3.5 w-3.5 text-green-400" />
                            WhatsApp
                          </label>
                          <input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)}
                            placeholder="+1 123 456 7890" className={input} />
                        </div>
                        <div>
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                            <MessageCircle className="h-3.5 w-3.5 text-sky-400" />
                            Telegram
                          </label>
                          <input type="text" value={form.telegram} onChange={(e) => set('telegram', e.target.value)}
                            placeholder="@username" className={input} />
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
                      <div className="relative flex justify-center"><span className="bg-zinc-900 px-3 text-[10px] text-zinc-600">or</span></div>
                    </div>

                    {/* Secondary: email */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Email <span className="font-normal normal-case text-zinc-600">(optional if messaging provided)</span>
                      </label>
                      <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                        placeholder="you@example.com" className={input} />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Name <span className="font-normal normal-case text-zinc-600">(optional)</span>
                      </label>
                      <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                        placeholder="Your name or stage name" className={input} />
                    </div>

                    <p className="text-center text-[11px] text-zinc-600">
                      By applying you confirm you are 18+ and that adult content is legal in your jurisdiction.
                    </p>
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
                      className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100">
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button type="submit" disabled={busy || !ok()}
                      className="flex min-w-[140px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100">
                      {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <>Submit Application <ArrowRight className="h-4 w-4" /></>}
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
