'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { createTier, type TierState } from './actions';
import TierFormFields from './TierFormFields';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-6 py-2 font-bold text-white transition-all hover:bg-pink-400 disabled:cursor-not-allowed disabled:bg-pink-400/50"
    >
      {pending ? 'Creating…' : 'Create tier'}
    </button>
  );
}

const initial: TierState = {};

export default function CreateTierForm() {
  const [state, formAction] = useActionState(createTier, initial);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form after a successful create so the next entry starts blank.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <TierFormFields
        state={state}
        defaults={{ currency: 'USD', active: true }}
      />
      <div className="flex items-center justify-between pt-2">
        {state.ok && (
          <p className="text-sm text-green-400">Tier created.</p>
        )}
        <div className="ml-auto">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
