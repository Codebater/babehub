import { redirect } from 'next/navigation';

/**
 * `/app/settings` was merged into the Profile editor in the Sprint-2f
 * cleanup pass — the two screens edited the same user and their fields
 * complemented each other. Existing links to /app/settings keep
 * working via this redirect.
 */
export default function SettingsRedirect() {
  redirect('/app/professional/edit');
}
