'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProfileText, type SettingsState } from './actions';

/**
 * Slim identity-fields form (handle / display name / bio) embedded
 * inside the Identity card of `/app/professional/edit`. Sprint 2g
 * stripped:
 *
 *   - The nested "Account type" sub-card with the fan → creator
 *     upgrade button. Role flipping moved off the Profile editor —
 *     ProfileMenu's "Switch on recruiter mode" handles role[]
 *     progression, and the singular `role` upgrade can move to
 *     /app/dashboard later if it's missed.
 *   - The babehub.net/c/ prefix decoration on the handle input that
 *     made the row visually heavier than the other identity fields.
 *   - The standalone "Save changes" button. The parent Profile
 *     editor's sticky-bottom save bar covers the pro section; this
 *     form keeps its own minimal Save button next to the bio so
 *     identity edits commit independently of the pro upsert (the two
 *     server actions write to different rows).
 *
 * Visual rhythm now matches the pro-form sections — same dark inputs,
 * same font sizes, same spacing — so the Identity card no longer
 * looks like a foreign component bolted on top.
 *
 * `role` prop is kept on the signature for forward-compat but no
 * longer rendered (was driving the dropped Account-type sub-card).
 */
function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Save identity'}
    </button>
  );
}

const initial: SettingsState = {};

const inputClass =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none [color-scheme:dark]';

export default function SettingsForm({
  defaults,
}: {
  defaults: { handle: string; display_name: string; bio: string };
  /** Kept on the prop signature for forward-compat — the role-based
   *  UI moved off this form. Drop the argument from callers when
   *  ready; for now we silently accept and ignore. */
  role?: string;
}) {
  const [state, formAction] = useActionState(updateProfileText, initial);
  const values = state.values ?? defaults;

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-text-main">Handle</span>
        <input
          name="handle"
          type="text"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9_]+"
          defaultValue={values.handle ?? ''}
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          placeholder="your_handle"
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-text-secondary">
          Lowercase letters, numbers, underscore. Changes your /c/{`{handle}`} URL.
        </span>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-bold text-text-main">Display name</span>
        <input
          name="display_name"
          type="text"
          required
          minLength={2}
          maxLength={50}
          defaultValue={values.display_name ?? ''}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1 flex justify-between text-sm font-bold text-text-main">
          <span>Bio</span>
          <span className="text-[10px] font-normal uppercase tracking-widest text-text-secondary">
            500 max
          </span>
        </span>
        <textarea
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={values.bio ?? ''}
          placeholder="One or two sentences. This sits under your name on the public profile."
          className={`${inputClass} resize-y`}
        />
      </label>

      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {state.error}
        </div>
      )}

      <div className="flex items-center justify-between">
        {state.ok && <p className="text-xs text-green-400">Saved.</p>}
        <div className="ml-auto">
          <SaveButton />
        </div>
      </div>
    </form>
  );
}
