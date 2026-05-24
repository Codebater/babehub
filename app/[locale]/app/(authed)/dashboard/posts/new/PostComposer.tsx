'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPost, type PostState } from '../actions';

type Tier = { id: string; name: string; price_cents: number; currency: string };

function SubmitButtons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        name="action"
        value="draft"
        disabled={pending}
        className="rounded-full border border-border-color px-5 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      >
        Save as draft
      </button>
      <button
        type="submit"
        name="action"
        value="publish"
        disabled={pending}
        className="rounded-full bg-primary px-6 py-2 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-pink-400/50 disabled:hover:scale-100"
      >
        {pending ? 'Publishing…' : 'Publish now'}
      </button>
    </div>
  );
}

const initial: PostState = {};

export default function PostComposer({ tiers }: { tiers: Tier[] }) {
  const [state, formAction] = useActionState(createPost, initial);
  const [body, setBody] = useState(state.values?.body ?? '');

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="body" className="mb-1 flex justify-between text-sm font-medium text-text-secondary">
          <span>What do you want to share?</span>
          <span className="text-xs text-text-secondary/70">{body.length} / 5000</span>
        </label>
        <textarea
          id="body"
          name="body"
          rows={8}
          required
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write something for your subscribers…"
          className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="tier_required_id" className="mb-1 block text-sm font-medium text-text-secondary">
          Who can see this?
        </label>
        <select
          id="tier_required_id"
          name="tier_required_id"
          defaultValue={state.values?.tier_required_id ?? 'public'}
          className="w-full appearance-none rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="public">🌍 Public — anyone on your profile</option>
          {tiers.length === 0 && (
            <option disabled>(create a tier first to gate posts)</option>
          )}
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              🔒 {tier.name} — subscribers only
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <SubmitButtons />
      </div>
    </form>
  );
}
