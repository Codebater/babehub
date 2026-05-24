'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Polls the current route every 5 seconds while the user waits for the
 * NOWPayments IPN to confirm their payment. Each refresh hits the server
 * component, which re-reads the `payment_invoices` row; once the status
 * flips out of the pending bucket, the parent renders the success or
 * failure branch and unmounts this component (stopping the poll).
 */
export default function PollingRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
