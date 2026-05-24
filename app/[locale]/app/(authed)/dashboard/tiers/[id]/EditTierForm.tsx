'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { archiveTier, updateTier, type TierState } from '../actions';
import TierFormFields from '../TierFormFields';

function SubmitButton() {
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

const initial: TierState = {};

export default function EditTierForm({
  tierId,
  defaults,
}: {
  tierId: string;
  defaults: {
    name: string;
    description: string;
    price_dollars: string;
    currency: string;
    perks: string;
    active: boolean;
  };
}) {
  // Bind the tier id so the server action receives it on submit.
  const boundUpdate = updateTier.bind(null, tierId);
  const [state, formAction] = useActionState(boundUpdate, initial);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <TierFormFields state={state} defaults={defaults} />
        <div className="flex items-center justify-between pt-2">
          {state.ok && <p className="text-sm text-green-400">Saved.</p>}
          <div className="ml-auto">
            <SubmitButton />
          </div>
        </div>
      </form>

      <hr className="border-border-color/40" />

      <form action={async () => archiveTier(tierId)} className="rounded-xl bg-red-500/5 p-4">
        <p className="text-sm text-text-secondary">
          Archive this tier. It will be hidden from your public profile and no
          new subscribers can sign up. Existing subscribers keep their access
          until their period ends.
        </p>
        <button
          type="submit"
          className="mt-3 rounded-full border border-red-500/40 px-4 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          Archive tier
        </button>
      </form>
    </div>
  );
}
