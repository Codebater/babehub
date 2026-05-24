'use client';

import type { TierState } from './actions';

type Defaults = {
  name?: string;
  description?: string;
  price_dollars?: string;
  currency?: string;
  perks?: string;
  active?: boolean;
};

/**
 * Shared form-body for both the "create" and "edit" tier forms. Lives in
 * its own component so the create flow on /tiers and the edit flow on
 * /tiers/[id] use the same UI.
 */
export default function TierFormFields({
  state,
  defaults,
}: {
  state: TierState;
  defaults: Defaults;
}) {
  const values = state.values ?? {};
  const v = (key: keyof Defaults) => (values[key as keyof typeof values] ?? defaults[key] ?? '');

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-text-secondary">
            Tier name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={50}
            defaultValue={String(v('name'))}
            placeholder="e.g. Insider, VIP, Diamond"
            className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium text-text-secondary">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue={String(v('currency') || 'USD')}
            className="w-full appearance-none rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="price_dollars" className="mb-1 block text-sm font-medium text-text-secondary">
          Price per month
        </label>
        <input
          id="price_dollars"
          name="price_dollars"
          type="number"
          step="0.01"
          min="0"
          max="10000"
          required
          defaultValue={String(v('price_dollars'))}
          placeholder="9.99"
          className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-text-secondary">Enter as decimal (9.99). Stored as cents internally.</p>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 flex justify-between text-sm font-medium text-text-secondary">
          <span>Short description</span>
          <span className="text-xs text-text-secondary/70">optional · max 200</span>
        </label>
        <input
          id="description"
          name="description"
          type="text"
          maxLength={200}
          defaultValue={String(v('description'))}
          placeholder="One sentence — what does this tier get them?"
          className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="perks" className="mb-1 flex justify-between text-sm font-medium text-text-secondary">
          <span>Perks</span>
          <span className="text-xs text-text-secondary/70">one per line · max 10 · 120 chars each</span>
        </label>
        <textarea
          id="perks"
          name="perks"
          rows={4}
          defaultValue={String(v('perks'))}
          placeholder={'Access to all posts\nWeekly photo set\n1 PPV bonus / month'}
          className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-text-secondary">
        <input
          type="checkbox"
          name="active"
          defaultChecked={
            values.active !== undefined ? values.active === 'on' : Boolean(defaults.active ?? true)
          }
          className="h-4 w-4 rounded border-border-color bg-secondary text-primary focus:ring-primary"
        />
        Show this tier on my public profile
      </label>

      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </div>
      )}
    </>
  );
}
