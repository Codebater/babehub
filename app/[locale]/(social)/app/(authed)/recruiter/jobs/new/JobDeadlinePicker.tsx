'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarClock } from 'lucide-react';

/**
 * Native date input + preset-button picker for the job application
 * deadline.
 *
 * Constraint: every job needs a deadline between **7 days** and
 * **6 months** from today. The hard `min` / `max` on the input
 * stops mobile pickers from letting the recruiter pick an out-of-band
 * date, and the four preset chips ("1 week", "1 month", "3 months",
 * "6 months") give them a one-click answer for the common case.
 *
 * The hidden default starts at "1 month" — sensible middle ground for
 * a typical casting window. If the recruiter wants no deadline at
 * all, that's not possible anymore (the field is required); past the
 * 6-month max they'd be claiming an open posting, which isn't really
 * a job ad. Lifting either bound is a one-line change here + the
 * server action.
 */
type PresetKey = 'week' | 'month' | '3 months' | '6 months';

function isoForOffset(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const PRESETS: { key: PresetKey; label: string; days: number }[] = [
  { key: 'week', label: '1 week', days: 7 },
  { key: 'month', label: '1 month', days: 30 },
  { key: '3 months', label: '3 months', days: 90 },
  { key: '6 months', label: '6 months', days: 180 },
];

export default function JobDeadlinePicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  // Default to "1 month" — common casting window. Server-side parses
  // YYYY-MM-DD and treats it as end-of-day UTC.
  const [value, setValue] = useState<string>(() => isoForOffset(30));

  // Keep the native input + state synced when a preset chip is clicked.
  // Plain `value` binding on the input handles user-typed changes.
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const min = isoForOffset(7);
  const max = isoForOffset(180);

  const pickPreset = (days: number) => {
    setValue(isoForOffset(days));
    inputRef.current?.focus();
  };

  // Highlight the preset chip whose date matches the current value.
  const activePreset = PRESETS.find((p) => isoForOffset(p.days) === value);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          <CalendarClock className="h-3 w-3" />
          Quick pick
        </span>
        {PRESETS.map((p) => {
          const isActive = activePreset?.key === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => pickPreset(p.days)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-text-secondary hover:text-text-main'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <input
        ref={inputRef}
        name="expires_at"
        type="date"
        required
        min={min}
        max={max}
        defaultValue={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none [color-scheme:dark]"
      />
    </div>
  );
}
