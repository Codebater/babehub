'use client';

import { Megaphone, ArrowRight } from 'lucide-react';
import { useSurveyModal } from './SurveyModalProvider';

/**
 * Tiny B2B entry point in the persistent sidebar, sitting right under
 * the SidebarCalendar. Clicking opens the BannerInquiryModal (the
 * multi-select brand inquiry form), so every page in the (social)
 * shell has a one-click path to "pitch a sponsored slot".
 *
 * Visual posture matches the calendar's quiet sidebar style — no big
 * card chrome, no primary fill at rest. The accent only appears on
 * hover so the button doesn't fight with the categories or the
 * profile widget for attention.
 *
 * The amber accent (instead of pink) ties it to the same "featured /
 * sponsored" color family the calendar uses for job dots — visually
 * signals that this is the inventory-side surface.
 */
export default function SidebarPitchButton() {
  const { openBanner } = useSurveyModal();
  return (
    <button
      type="button"
      onClick={openBanner}
      className="group mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-border-color/60 px-2.5 py-2 text-left transition-all hover:border-amber-400/60 hover:bg-amber-400/[0.04]"
      title="Pitch a sponsored slot — banner, featured job, or creator collab"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-300 transition-colors group-hover:border-amber-400/60 group-hover:bg-amber-400/20">
          <Megaphone className="h-3 w-3" />
        </span>
        <span className="truncate text-[11px] font-bold text-text-secondary transition-colors group-hover:text-text-main">
          Pitch a slot
        </span>
      </span>
      <ArrowRight className="h-3 w-3 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
    </button>
  );
}
