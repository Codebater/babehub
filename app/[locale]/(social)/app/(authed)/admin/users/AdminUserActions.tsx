'use client';

import { useTransition } from 'react';
import { ShieldCheck, Shield, Pause, Play, Slash, RotateCcw, Sparkles } from 'lucide-react';
import {
  setUserVerified,
  setUserFrozen,
  setUserBanned,
  setUserPremium,
} from '../actions';

/**
 * Row-level action buttons for the admin users table. Each button
 * flips a single boolean column on `profiles` via a server action and
 * triggers a `revalidatePath('/app/admin/users')` so the row re-renders
 * with the new state instantly.
 *
 * `useTransition` keeps the buttons clickable while the server action
 * runs; the pending state dims the row's controls so the admin gets
 * feedback without the whole page reloading.
 *
 * Banning is the most destructive — kept far right with a destructive
 * color shift so it's harder to mis-click.
 */
type Props = {
  userId: string;
  isVerified: boolean;
  isFrozen: boolean;
  isBanned: boolean;
  isPremium?: boolean;
};

export default function AdminUserActions({
  userId,
  isVerified,
  isFrozen,
  isBanned,
  isPremium = false,
}: Props) {
  const [pending, startTransition] = useTransition();

  const toggleVerified = () =>
    startTransition(() => {
      void setUserVerified(userId, !isVerified);
    });
  const toggleFrozen = () =>
    startTransition(() => {
      void setUserFrozen(userId, !isFrozen);
    });
  const toggleBanned = () =>
    startTransition(() => {
      void setUserBanned(userId, !isBanned);
    });
  // 30-day grant on click (matches the $10/mo premium tier); click
  // again to revoke. Admin-only — RLS gates the server action.
  const togglePremium = () =>
    startTransition(() => {
      void setUserPremium(userId, isPremium ? null : 30);
    });

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${pending ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={toggleVerified}
        disabled={pending || isBanned}
        title={isVerified ? 'Revoke BabeHub Verified status' : 'Grant BabeHub Verified status'}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
          isVerified
            ? 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25'
            : 'border-border-color bg-card text-text-secondary hover:border-primary/40 hover:text-primary'
        }`}
      >
        {isVerified ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
        {isVerified ? 'Verified' : 'Verify'}
      </button>

      <button
        type="button"
        onClick={toggleFrozen}
        disabled={pending || isBanned}
        title={isFrozen ? 'Unfreeze account' : 'Freeze account (cannot post / comment / subscribe)'}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
          isFrozen
            ? 'border-sky-400/40 bg-sky-400/15 text-sky-300 hover:bg-sky-400/25'
            : 'border-border-color bg-card text-text-secondary hover:border-sky-400/40 hover:text-sky-300'
        }`}
      >
        {isFrozen ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        {isFrozen ? 'Unfreeze' : 'Freeze'}
      </button>

      <button
        type="button"
        onClick={togglePremium}
        disabled={pending || isBanned}
        title={isPremium ? 'Revoke Premium' : 'Grant Premium (30 days)'}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
          isPremium
            ? 'border-amber-400/40 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
            : 'border-border-color bg-card text-text-secondary hover:border-amber-400/40 hover:text-amber-300'
        }`}
      >
        <Sparkles className="h-3 w-3" />
        {isPremium ? 'Premium' : 'Grant 30d'}
      </button>

      <button
        type="button"
        onClick={toggleBanned}
        disabled={pending}
        title={isBanned ? 'Lift the ban' : 'Ban account (hidden everywhere)'}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
          isBanned
            ? 'border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25'
            : 'border-border-color bg-card text-text-secondary hover:border-red-500/40 hover:text-red-400'
        }`}
      >
        {isBanned ? <RotateCcw className="h-3 w-3" /> : <Slash className="h-3 w-3" />}
        {isBanned ? 'Unban' : 'Ban'}
      </button>
    </div>
  );
}
