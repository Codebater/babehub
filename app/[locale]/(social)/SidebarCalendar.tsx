'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Compact archive calendar that lives in the persistent left sidebar
 * on every (social) page. Days are color-coded by event kind:
 *
 *   - blog post  → primary pink
 *   - featured job → amber
 *
 * Click a highlighted day → opens that event. If a day has multiple
 * events of different kinds, a stacked-dot row shows below the date
 * and we navigate to the most recent event on click.
 *
 * Fits inside the 240px-wide sidebar (≈208px usable). Cells size down
 * to ~24px so the 7-column grid stays comfortably inside the rail.
 *
 * Pure client component (needs useState for month navigation), zero
 * external deps.
 */
export type CalendarEvent = {
  /** ISO YYYY-MM-DD. */
  date: string;
  /** Color bucket. Add more kinds later by extending KIND_STYLE. */
  kind: 'blog' | 'job';
  /** Where the click lands. */
  href: string;
  /** Hover tooltip + a11y label. */
  title: string;
};

type MonthState = { year: number; monthIndex: number };

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Per-kind visual config — extend this when new event types land
 * (live events, scheduled streams, releases, etc.).
 *
 * `dot` is what shows up below the day number when the kind appears
 * on a day; `cell` is the cell background when that's the ONLY kind
 * present that day. Multi-kind days fall back to a neutral background
 * with stacked dots so the user sees the mix at a glance.
 */
const KIND_STYLE: Record<
  CalendarEvent['kind'],
  { dot: string; cell: string; label: string }
> = {
  // Subtler tone — colored text + dot only, no filled background by
  // default. Hover lifts the cell into the full accent color so the
  // calendar still feels interactive without being loud at rest.
  blog: {
    dot: 'bg-primary',
    cell: 'text-primary hover:bg-primary/15',
    label: 'Blog post',
  },
  job: {
    dot: 'bg-amber-400',
    cell: 'text-amber-300 hover:bg-amber-400/15',
    label: 'Featured job',
  },
};

function toUTC(iso: string): Date {
  return new Date(iso + 'T00:00:00Z');
}

function monday0(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

function monthLabel(year: number, monthIndex: number): string {
  return new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function SidebarCalendar({ events }: { events: CalendarEvent[] }) {
  // Group events by "year-month-day" so a single day can carry multiple
  // entries (e.g. a blog post AND a featured job on the same date).
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const d = toUTC(e.date);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    return m;
  }, [events]);

  // Default to the month of the most recent event, fallback to today.
  const initial: MonthState = useMemo(() => {
    if (events.length === 0) {
      const now = new Date();
      return { year: now.getUTCFullYear(), monthIndex: now.getUTCMonth() };
    }
    const newest = events.reduce((a, b) => (a.date > b.date ? a : b));
    const d = toUTC(newest.date);
    return { year: d.getUTCFullYear(), monthIndex: d.getUTCMonth() };
  }, [events]);

  const [{ year, monthIndex }, setMonth] = useState<MonthState>(initial);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
    const leadingBlanks = monday0(firstOfMonth);
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const today = new Date();
    const todayKey = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;

    type Cell =
      | { kind: 'blank'; key: string }
      | {
          kind: 'day';
          key: string;
          day: number;
          events: CalendarEvent[];
          isToday: boolean;
        };

    const arr: Cell[] = [];
    for (let i = 0; i < leadingBlanks; i++) {
      arr.push({ kind: 'blank', key: `b-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${monthIndex}-${d}`;
      arr.push({
        kind: 'day',
        key,
        day: d,
        events: byDay.get(key) ?? [],
        isToday: key === todayKey,
      });
    }
    while (arr.length < 42) {
      arr.push({ kind: 'blank', key: `t-${arr.length}` });
    }
    return arr;
  }, [year, monthIndex, byDay]);

  const goPrev = () =>
    setMonth(({ year, monthIndex }) =>
      monthIndex === 0
        ? { year: year - 1, monthIndex: 11 }
        : { year, monthIndex: monthIndex - 1 },
    );
  const goNext = () =>
    setMonth(({ year, monthIndex }) =>
      monthIndex === 11
        ? { year: year + 1, monthIndex: 0 }
        : { year, monthIndex: monthIndex + 1 },
    );

  // For days with multiple events we navigate to whichever was most
  // recent — that's most likely to be what the user wants to see.
  const primaryEvent = (es: CalendarEvent[]): CalendarEvent =>
    es.reduce((a, b) => (a.date > b.date ? a : b));

  // Unique kinds present on a day — drives stacked dots.
  const uniqueKinds = (es: CalendarEvent[]): CalendarEvent['kind'][] => {
    const set = new Set<CalendarEvent['kind']>();
    for (const e of es) set.add(e.kind);
    return Array.from(set);
  };

  return (
    // No wrapping card / border / background — the calendar sits flush
    // in the sidebar as a quiet utility, not a competing surface.
    <div className="px-1">
      {/* Header — month label + nav arrows. Kept tight to fit the rail. */}
      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous month"
          className="rounded p-0.5 text-text-secondary transition-colors hover:bg-secondary hover:text-text-main"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-main">
          {monthLabel(year, monthIndex)}
        </p>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
          className="rounded p-0.5 text-text-secondary transition-colors hover:bg-secondary hover:text-text-main"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Day-of-week header. */}
      <div className="mb-1 grid grid-cols-7 gap-px text-center text-[8px] font-bold uppercase tracking-widest text-text-secondary/60">
        {DAY_LABELS.map((d, i) => (
          <span key={`${d}-${i}`} className="py-0.5">
            {d}
          </span>
        ))}
      </div>

      {/* Day grid — 6×7. Days with events are colored cells; the cell
          color uses the primary event's kind so a glance reveals the
          mix across the month. Multi-kind days show a stacked-dot row
          below the number. */}
      <div className="grid grid-cols-7 gap-px text-center text-[10px]">
        {cells.map((c) => {
          if (c.kind === 'blank') {
            return <span key={c.key} aria-hidden className="aspect-square" />;
          }
          if (c.events.length > 0) {
            const main = primaryEvent(c.events);
            const kinds = uniqueKinds(c.events);
            const isMulti = kinds.length > 1;
            const style = KIND_STYLE[main.kind];
            const ariaParts = c.events.map((e) => `${KIND_STYLE[e.kind].label}: ${e.title}`);
            return (
              <Link
                key={c.key}
                href={main.href as never}
                title={ariaParts.join('\n')}
                aria-label={ariaParts.join('. ')}
                className={`group relative flex aspect-square flex-col items-center justify-center rounded font-bold transition-all hover:scale-105 ${
                  isMulti
                    ? 'bg-text-main/10 text-text-main hover:bg-text-main hover:text-background'
                    : style.cell
                }`}
              >
                <span>{c.day}</span>
                {isMulti && (
                  <span className="absolute bottom-0.5 flex gap-[1px]">
                    {kinds.map((k) => (
                      <span
                        key={k}
                        className={`h-[3px] w-[3px] rounded-full ${KIND_STYLE[k].dot}`}
                      />
                    ))}
                  </span>
                )}
              </Link>
            );
          }
          return (
            <span
              key={c.key}
              className={`flex aspect-square items-center justify-center text-text-secondary/40 ${
                c.isToday ? 'rounded ring-1 ring-text-secondary/40' : ''
              }`}
            >
              {c.day}
            </span>
          );
        })}
      </div>

      {/* Legend intentionally omitted — colors are intuitive once
          seen, and dropping the row keeps the widget visually quiet. */}
    </div>
  );
}
