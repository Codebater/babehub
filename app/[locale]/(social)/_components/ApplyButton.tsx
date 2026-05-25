'use client';

import { Megaphone, ArrowRight } from 'lucide-react';
import { useSurveyModal } from '../SurveyModalProvider';

/**
 * Reusable "Apply BabeHub" trigger button. Lives in the (social) shell
 * and uses the shell-wide SurveyModalProvider context to open the
 * survey modal in place — no navigation to /#apply, no scroll jump.
 *
 * Exposed as a client component so it can be embedded inside server
 * components (creator profile, creators page, etc.) without those
 * pages needing to opt into client rendering themselves.
 *
 * Two visual variants:
 *   - primary (default): pink filled CTA, used as a hero button
 *   - outline: bordered, used as a secondary action on profile pages
 */
type Props = {
  variant?: 'primary' | 'outline';
  /** Label override; defaults to "Apply BabeHub". */
  label?: string;
  /** Show the arrow tail (only for primary). */
  withArrow?: boolean;
  className?: string;
};

export default function ApplyButton({
  variant = 'primary',
  label = 'Apply BabeHub',
  withArrow = false,
  className = '',
}: Props) {
  const { openApply } = useSurveyModal();

  const variantClasses =
    variant === 'primary'
      ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-pink-400 hover:scale-[1.02]'
      : 'border border-primary text-primary hover:bg-primary hover:text-white';

  return (
    <button
      type="button"
      onClick={openApply}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${variantClasses} ${className}`}
    >
      <Megaphone className="h-4 w-4" />
      {label}
      {withArrow && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}
