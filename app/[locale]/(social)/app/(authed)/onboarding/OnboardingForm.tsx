'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveOnboarding, type OnboardingState } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-pink-400/50 disabled:hover:scale-100"
    >
      {pending ? 'Saving…' : 'Save and continue →'}
    </button>
  );
}

function RoleCard({
  value,
  selected,
  title,
  subtitle,
  onSelect,
}: {
  value: 'fan' | 'creator';
  selected: boolean;
  title: string;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 rounded-2xl border-2 p-5 text-left transition-all ${
        selected
          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
          : 'border-border-color bg-card hover:border-primary/40'
      }`}
    >
      <p className="text-lg font-bold text-text-main">{title}</p>
      <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      <input type="radio" name="role" value={value} defaultChecked={selected} className="sr-only" />
    </button>
  );
}

const initial: OnboardingState = {};

export default function OnboardingForm({
  initial: initialValues,
}: {
  // `role` accepts every value in the user_role enum (Phase 2 added
  // recruiter / agency / brand / service_provider). The form only
  // distinguishes creator vs everything-else, so we just widen the type.
  initial: { handle: string; display_name: string; bio: string; role: string };
}) {
  const [state, formAction] = useActionState(saveOnboarding, initial);

  const defaults = state.values ?? initialValues;
  const [role, setRole] = useState<'fan' | 'creator'>(
    defaults.role === 'creator' ? 'creator' : 'fan',
  );

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="mb-2 block text-sm font-medium text-text-secondary">
          I&apos;m here to…
        </legend>
        <div className="flex gap-3">
          <RoleCard
            value="fan"
            selected={role === 'fan'}
            title="Discover creators"
            subtitle="Subscribe, send tips, chat. You can switch to creator anytime."
            onSelect={() => setRole('fan')}
          />
          <RoleCard
            value="creator"
            selected={role === 'creator'}
            title="Publish & earn"
            subtitle="Set tiers, post locked content, get paid via Stripe or crypto."
            onSelect={() => setRole('creator')}
          />
        </div>
        {/* Hidden field carries the actual value so the server action sees it */}
        <input type="hidden" name="role" value={role} />
      </fieldset>

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
            defaultValue={defaults.handle ?? ''}
            placeholder="your_handle"
            className="flex-1 bg-transparent py-2 pr-3 text-text-main placeholder-text-secondary focus:outline-none"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          3-30 chars, lowercase letters / numbers / underscores. This is your public profile URL.
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
          defaultValue={defaults.display_name ?? ''}
          placeholder="What should we call you?"
          className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 flex justify-between text-sm font-medium text-text-secondary">
          <span>Bio</span>
          <span className="text-xs text-text-secondary/70">optional · max 500 chars</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={defaults.bio ?? ''}
          placeholder={
            role === 'creator'
              ? 'A short tagline for your profile — what do you make?'
              : 'A few words about you (visible on your profile).'
          }
          className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
