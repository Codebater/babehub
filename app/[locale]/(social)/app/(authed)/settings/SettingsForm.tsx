'use client';

import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { switchToCreator, updateProfileText, type SettingsState } from './actions';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-6 py-2 font-bold text-white transition-all hover:bg-pink-400 disabled:cursor-not-allowed disabled:bg-pink-400/50"
    >
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}

const initial: SettingsState = {};

export default function SettingsForm({
  defaults,
  role,
}: {
  defaults: { handle: string; display_name: string; bio: string };
  role: 'fan' | 'creator' | 'chatter' | 'admin';
}) {
  const [state, formAction] = useActionState(updateProfileText, initial);
  const [isPending, startTransition] = useTransition();
  const values = state.values ?? defaults;

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="handle" className="mb-1 block text-sm font-medium text-text-secondary">
            Handle
          </label>
          <div className="flex items-stretch overflow-hidden rounded-md border border-border-color bg-secondary focus-within:ring-2 focus-within:ring-primary">
            <span className="flex items-center px-3 text-sm text-text-secondary">babehub.net/c/</span>
            <input
              id="handle"
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
              className="flex-1 bg-transparent py-2 pr-3 text-text-main focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Changing your handle changes your public profile URL — any old links
            will 404.
          </p>
        </div>

        <div>
          <label htmlFor="display_name" className="mb-1 block text-sm font-medium text-text-secondary">
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            minLength={2}
            maxLength={50}
            defaultValue={values.display_name ?? ''}
            className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 flex justify-between text-sm font-medium text-text-secondary">
            <span>Bio</span>
            <span className="text-xs text-text-secondary/70">max 500 chars</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={500}
            defaultValue={values.bio ?? ''}
            className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {state.error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-between">
          {state.ok && <p className="text-sm text-green-400">Saved.</p>}
          <div className="ml-auto">
            <SaveButton />
          </div>
        </div>
      </form>

      {/* ── Account type — one-way fan → creator upgrade ──────────────────── */}
      <section className="rounded-2xl border border-border-color bg-secondary/40 p-5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
          Account type
        </h3>
        <p className="mt-2 text-text-main">
          You&apos;re currently a <span className="font-bold capitalize text-primary">{role}</span>.
        </p>
        {role === 'fan' ? (
          <>
            <p className="mt-2 text-sm text-text-secondary">
              Switch to a creator account to publish posts, set up subscription
              tiers, and earn from your audience. Your fan subscriptions stay
              intact.
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await switchToCreator();
                })
              }
              className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-pink-400 disabled:cursor-not-allowed disabled:bg-pink-400/50"
            >
              {isPending ? 'Switching…' : 'Become a creator →'}
            </button>
          </>
        ) : (
          <p className="mt-2 text-sm text-text-secondary">
            Creator account features unlocked. Manage your tiers and content
            from the dashboard.
          </p>
        )}
      </section>
    </div>
  );
}
