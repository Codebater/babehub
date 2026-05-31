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
          '/auth/',          // OAuth / magic-link callback
          '/app/dashboard',  // personal dashboards
          '/app/admin',      // admin hub
          '/app/recruiter',  // recruiter panel
          '/app/creator',    // creator-only pages
          '/app/onboarding', // sign-up flow
          '/app/professional/edit', // profile editor
          '/app/settings',   // account settings
          '/app/chat',       // private messages
          '/app/upload',     // video upload
          '/app/premium',    // upsell page (noindex)
          '/app/subscriptions', // personal subscriptions
          '/app/login',      // auth screens
          '/app/reset-password',
          '/favorites',      // personal saved items
          '/v/',             // per-video pages (thin third-party catalog content)
        ],
      },
    ],
    sitemap: `${DOMAIN}/sitemap.xml`,
    host: DOMAIN,
  };
}
