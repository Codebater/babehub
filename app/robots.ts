import type { MetadataRoute } from 'next';

const DOMAIN = 'https://babehub.net';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // server-side endpoints — not content
          '/_next/',         // Next.js internals
          '/app/dashboard',  // personal dashboards
          '/app/admin',      // admin hub
          '/app/recruiter',  // recruiter panel
          '/app/creator',    // creator-only pages
          '/app/onboarding', // sign-up flow
          '/app/professional/edit', // profile editor
          '/favorites',      // personal saved items
        ],
      },
    ],
    sitemap: `${DOMAIN}/sitemap.xml`,
    host: DOMAIN,
  };
}
