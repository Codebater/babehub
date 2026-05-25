'use client';

import { useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';

/**
 * Multi-select chip picker. Shared across the social shell — used by
 * the professional-profile editor (categories / skills / languages)
 * and the job composer (categories / tags).
 *
 * Click a chip to toggle. Selected chips stay pinned at the top with
 * a primary fill; unselected suggestions sit below in a softer tone.
 * A small "+ Add custom" input lets users add tags that aren't in
 * the preset list — common when the platform's vocabulary lags
 * behind what users actually want to describe.
 *
 * The component renders a hidden `<input>` with the same `name` as
 * the surrounding form expects, storing the selection as a
 * comma-separated string. That matches the server actions' existing
 * CSV parser — no backend change to migrate a free-text input.
 */
type Props = {
  /** Form field name; rendered as a hidden input. */
  name: string;
  /** Human label shown above the chip cloud. */
  label: string;
  /** Helper text under the label. */
  hint?: string;
  /** All suggestions shown as clickable chips. */
  presets: readonly string[];
  /** Pre-selected values (case-insensitive match against presets). */
  initial?: string[];
  /** Cap on selection size. Hard limit; clicks past this are no-ops. */
  limit?: number;
  /**
   * Enable the "+ Add" custom-tag input. Defaults to true. Set false
   * when the platform must own the vocabulary (e.g. categories that
   * also drive recommendation routing).
   */
  allowCustom?: boolean;
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export default function ChipPicker({
  name,
  label,
  hint,
  presets,
  initial = [],
  limit = 20,
  allowCustom = true,
}: Props) {
  const [selected, setSelected] = useState<string[]>(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of initial) {
      const n = normalize(v);
      if (!n || seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
    return out;
  });
  const [draft, setDraft] = useState('');

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // Suggestions = preset list minus already-selected (so users don't
  // see duplicate "Add" buttons for things they've already picked).
  const suggestions = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const p of presets) {
      const n = normalize(p);
      if (selectedSet.has(n) || seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
    return out;
  }, [presets, selectedSet]);

  const toggle = (value: string) => {
    const n = normalize(value);
    if (!n) return;
    setSelected((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= limit) return prev;
      return [...prev, n];
    });
  };

  const addCustom = () => {
    const n = normalize(draft);
    if (!n) return;
    setDraft('');
    if (selectedSet.has(n) || selected.length >= limit) return;
    setSelected((prev) => [...prev, n]);
  };

  const hiddenValue = selected.join(',');

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-text-main">{label}</span>
        <span className="text-[10px] uppercase tracking-widest text-text-secondary">
          {selected.length} / {limit}
        </span>
      </div>
      {hint && <p className="mb-2 text-xs text-text-secondary">{hint}</p>}

      <input type="hidden" name={name} value={hiddenValue} />

      {/* Selected pills — clicking removes. */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <button
              key={`sel-${v}`}
              type="button"
              onClick={() => toggle(v)}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white transition-transform hover:scale-[1.04]"
            >
              {v}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Preset suggestions — clicking adds. */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((v) => (
            <button
              key={`sug-${v}`}
              type="button"
              onClick={() => toggle(v)}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-200 transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Optional custom-add input. */}
      {allowCustom && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            maxLength={40}
            placeholder="Add custom…"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!draft.trim() || selected.length >= limit}
            className="rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-bold text-zinc-200 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
