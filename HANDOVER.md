# BabeHub — Handover Guide

End-to-end operations playbook for the buyer to take over and deploy
the platform on their own Ubuntu VPS.

This document covers:
1. What you (the buyer) are inheriting
2. What you need to create yourself (cannot be transferred)
3. Ubuntu VPS deploy (Coolify recommended, manual Docker as fallback)
4. DNS + SSL cutover
5. Post-deploy checklist
6. Day-2 operations: backups, updates, scaling

The seller hands you the assets in the next section. Everything else
you set up yourself in ~2 hours.

---

## 1. Assets the seller transfers to you

| Asset | How it's transferred | What to do on your side |
|---|---|---|
| **Source code (GitHub repo)** | Seller pushes a clean copy to your fresh GitHub repo | Accept the push, set branch protection rules |
| **Supabase project** | Seller invites your Supabase account as Owner via Dashboard → Team → Add member, then leaves the org | Accept the invite; verify you can read `auth.users` + `public.profiles`; remove the seller's account; **rotate the `service_role` key** (Settings → API → roll keys) |
| **Domain (babehub.net)** | Seller initiates a transfer at the registrar; you provide your registrar's auth code | Once transferred, lock the domain + enable WHOIS privacy |

After these three handovers, the seller no longer has access to anything.

---

## 2. Things you create fresh (cannot be transferred)

Any account whose API keys are baked into env vars must be re-created
in your name, because the keys are tied to the seller's billing.

### NOWPayments (crypto payments)
- Sign up at https://account.nowpayments.io with **your** business email
- Complete KYC/KYB if required
- Settings → API Keys → create one
- Settings → Store Settings → enable IPN; callback URL = `https://babehub.net/api/nowpayments/ipn`; generate IPN secret
- Settings → Profile → copy your public key (store UUID)
- Settings → Payment Settings → link your payout wallet
- ⚠ The seller's NOWPayments keys are now revoked — you MUST swap them or payments will fail silently

### Resend (transactional email — runs through Supabase Auth)
- Sign up at https://resend.com
- Domains → Add `babehub.net` → add the SPF/DKIM/DMARC DNS records they give you (TXT records at your registrar)
- Wait for "Verified" (5–30 min)
- API Keys → create key
- Open Supabase Dashboard → Authentication → Emails → SMTP Settings:
  - Host: `smtp.resend.com`
  - Port: `465`
  - Username: `resend`
  - Password: `<your Resend API key>`
  - Sender email: `no-reply@babehub.net`
- Save → send a test sign-up email to verify

### Your own infrastructure
- Ubuntu 22.04 or 24.04 VPS (minimum 2GB RAM, 40GB disk — see Section 3)
- GitHub account (for the repo + CI/CD)

### Optional
- Airtable base (if you want survey + inquiry mirroring beyond Supabase)
- Cloudflare account (recommended in front of your VPS for caching + DDoS protection)

---

## 3. Deploy on Ubuntu VPS (Coolify — recommended)

Coolify gives you a Vercel/Heroku-style web UI on your own VPS. Free,
self-hosted, supports push-to-deploy, automatic SSL via Let's Encrypt,
multi-app + multi-domain, and built-in PostgreSQL backups if you ever
self-host the DB.

### 3.1 Provision the VPS (5 min)

Any Ubuntu host works (Hetzner, DigitalOcean, Linode, OVH, etc.).

Recommended specs:
- Ubuntu 24.04 LTS
- 2 vCPU + 2GB RAM minimum (4GB if you expect >50 concurrent users)
- 40GB SSD
- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (Coolify UI, lock to your IP)

Get the public IPv4 — call it `$SERVER_IP`.

### 3.2 Install Coolify (10 min)

```bash
ssh root@$SERVER_IP

# One-line installer
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

The installer pulls Docker, Docker Compose, sets up Coolify's UI on
port `:8000`. Wait for "Coolify is now ready", then open
`http://$SERVER_IP:8000`, register your admin account.

**Lock down**: Coolify → Settings → Authentication → enable 2FA.
Optional: restrict port 8000 to your office IP via `ufw`.

### 3.3 Connect GitHub + create the app (15 min)

In Coolify UI:

1. **Sources** → New Source → **GitHub App** → install the Coolify GitHub App on your `babehub` repository
2. **Projects** → New Project → name: "BabeHub"
3. Inside the project → **+ New** → **Application** → from GitHub Source → pick your `babehub` repo, branch `main` (or whichever branch the seller pushed to)
4. Build Pack: **Nixpacks** (auto-detects Next.js); leave install/build/start commands at defaults:
   - Install: `npm install`
   - Build: `npm run build`
   - Start: `npm start`
5. **Domain**: `https://babehub.net` (DNS comes in 3.4)
6. **Environment Variables**: paste the whole block — see `.env.example` in the repo for the template; here's a starter:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard → Settings → API>
   NOWPAYMENTS_API_KEY=<from your NOWPayments dashboard>
   NOWPAYMENTS_PUBLIC_KEY=<from your NOWPayments dashboard>
   NOWPAYMENTS_IPN_SECRET=<from your NOWPayments dashboard>
   NOWPAYMENTS_SANDBOX=false
   ADMIN_EMAILS=you@your-domain.com
   ```

7. Click **Deploy**. First build takes 3–5 min. Watch the logs live.
8. Once status flips to "Running", Coolify will request a Let's Encrypt SSL cert automatically the moment DNS resolves to the server.

### 3.4 DNS cutover (5 min + propagation)

At your domain registrar (now you, post-transfer):

1. Find the A record for `babehub.net`
2. Change TTL to 60s, save. Wait 5 min for the lower TTL to propagate.
3. Change the value from the old Vercel IP to **`$SERVER_IP`**
4. Optionally add an AAAA record for IPv6 (`$SERVER_IPv6`)
5. Add a CNAME for `www.babehub.net` → `babehub.net`

Wait 5–60 minutes for DNS to propagate globally. Check status with:
```bash
dig babehub.net +short
```

When the response is your `$SERVER_IP`, Coolify will pick it up and
issue the SSL cert. Visit `https://babehub.net` — you should see the
platform served from your VPS with a green padlock.

---

## 4. Post-deploy checklist

Run through this list. Each item is a one-minute test.

### 4.1 Smoke tests

- [ ] `https://babehub.net/` loads (marketing home)
- [ ] `https://babehub.net/explore` loads (video feed)
- [ ] `https://babehub.net/c/babehub` shows the admin's creator profile
- [ ] Open in incognito → the 18+ age gate modal appears
- [ ] Click "No" → redirects to google.com
- [ ] Click "Yes" → modal closes, content visible
- [ ] `https://babehub.net/app/login` shows the three tabs (Sign in / Sign up / Magic link)

### 4.2 Auth flow

- [ ] Sign up with a fresh test email → "Check your inbox"
- [ ] Verification email arrives from `no-reply@babehub.net` (delivered via Resend)
- [ ] Click verification link → lands on `/explore` signed in
- [ ] (If your email is in `ADMIN_EMAILS`) Sidebar profile menu shows "Admin hub" → click → `/app/admin` loads

### 4.3 Payments (smallest tier test)

- [ ] On `/c/babehub` click "Subscribe with crypto" on the cheapest tier
- [ ] Land on NOWPayments hosted checkout — pay $1 worth of crypto
- [ ] Return to `/app/subscriptions/{id}` — polling shows "Waiting for payment confirmation"
- [ ] Within 5–10 min: page flips to "You're subscribed!" green check
- [ ] Refresh `/c/babehub` — tier-locked posts are now unlocked
- [ ] Repeat for `/app/premium` with $10 — verifies premium path
- [ ] In Supabase Studio: confirm `payment_invoices.status = 'finished'`, `subscriptions` row created (or `profiles.is_premium = true` for premium)

### 4.4 Admin operations

- [ ] `/app/admin/users` lists all users
- [ ] Click "Verify" on a user — `is_verified` flips
- [ ] `/app/admin/jobs` — pick a job to feature
- [ ] `/app/admin/blog/new` — publish a test blog post, then check it appears at `/blog`

### 4.5 Security hardening

- [ ] **Rotate `SUPABASE_SERVICE_ROLE_KEY`** (Supabase → Settings → API → Roll). Update Coolify env vars. Redeploy. ⚠ The seller knew this key.
- [ ] Rotate `NOWPAYMENTS_IPN_SECRET` if you want (Settings → Store Settings → regenerate)
- [ ] Supabase → Authentication → URL Configuration → set Site URL to `https://babehub.net`, add `https://babehub.net/**` to Redirect URLs. Remove any leftover `localhost` / Vercel preview URLs.
- [ ] Remove the seller from Supabase Team
- [ ] Update `ADMIN_EMAILS` env var to your real address, redeploy
- [ ] Coolify → 2FA enabled

---

## 5. Day-2 operations

### Updating the code

Push to `main` on GitHub → Coolify webhook fires → auto-rebuild +
auto-deploy. Watch the build logs in the Coolify UI. Roll back via
Coolify → Deployments → pick a previous deployment → Redeploy.

### Database backups

Supabase takes automatic daily backups on paid plans. To download a
manual backup:

```bash
# On any machine with the Supabase CLI installed
npx supabase db dump --db-url "postgresql://postgres.<PROJECT>:<PWD>@aws-0-<region>.pooler.supabase.com:6543/postgres" \
  > backup-$(date +%Y%m%d).sql
```

Store these somewhere off Supabase (S3 bucket, Backblaze B2, etc.).
Set up a weekly cron on your VPS to automate it.

### Applying database migrations

Migrations live in `supabase/migrations/*.sql` in the repo. Apply via
the Supabase Dashboard → SQL Editor (copy-paste). Or via the Supabase
MCP if you use Claude. Always test on a `supabase db branch` clone
before running on production.

### Monitoring

- Coolify shows container CPU/memory/network in real time
- Set up uptime monitoring at https://uptimerobot.com (free) pinging `https://babehub.net/`
- For deeper insight: install Plausible or Umami (self-hosted analytics) — both have Docker images Coolify can deploy
- Errors: Supabase logs in the dashboard; Coolify logs per-container; consider piping to Sentry (free tier 5k events/mo)

### Scaling up

When 2GB RAM stops being enough:
1. Coolify → Stop the app
2. Hetzner / DigitalOcean console → resize the VPS to a bigger plan (downtime: 2-5 min while VM reboots)
3. Coolify → Start the app
4. No code or DB changes needed

If you need >1 VPS (high availability): put Cloudflare Load Balancer in
front of multiple VPS instances; have each Coolify-deployed app connect
to the same Supabase. Stateless app design means horizontal scaling
"just works".

---

## 6. Things to know about the codebase

Stack snapshot — useful when you read code or hire a dev to extend it:

- **Framework**: Next.js 15 App Router (React Server Components + Server Actions)
- **Auth + DB + Storage**: Supabase (Postgres with RLS, Auth, Storage buckets)
- **Payments**: NOWPayments (crypto); CCBill (cards/SEPA) planned, not wired
- **Email**: Resend SMTP via Supabase Auth
- **External video catalog**: eporner v2 API (cached 5 min, AI-filtered)
- **i18n**: next-intl, 7 locales (en/de/es/fr/ja/pt/th), `localePrefix: 'as-needed'`

Project layout: see `README.md` for the full directory tree.

19 migrations in `supabase/migrations/`. They were applied via the
Supabase MCP tool, NOT the Supabase CLI. The canonical state lives in
the live Supabase project — the SQL files are history. If you ever
need to rebuild a fresh DB from scratch, apply them in numerical order
via the Supabase SQL Editor.

### Where Supabase Auth is wired

- `/app/login` — page with three tabs (Sign in / Sign up / Magic link)
- `/auth/callback` — receives Supabase's PKCE `code` exchange or token
  fallback; promotes emails matching `ADMIN_EMAILS` to admin
- `lib/supabase/{server,client,admin}.ts` — three client factories
- `lib/auth/guards.ts` — `requireUser` / `requireOnboarded` /
  `requireCreator` / `requireRecruiter` / `requireAdmin` redirect
  helpers used by every authed page

### Where payments are wired

- `/app/premium` — platform-wide $10/mo upgrade page
- `/c/{handle}` — per-creator tier subscriptions
- `/api/nowpayments/create-invoice` — POST handler for tier subscriptions
- `/api/nowpayments/create-premium-invoice` — POST handler for premium
- `/api/nowpayments/ipn` — webhook receiver; verifies HMAC-SHA512
  signature; branches on `payment_invoices.purpose`
- `lib/nowpayments/{client,verifyIpn}.ts` — REST wrapper + sig verifier

---

## 7. Compliance & legal notes

Not legal advice — talk to a lawyer in your operating jurisdiction
before going live with real users.

- **Adult content licensing**: some countries require operator licensing
  (e.g. UK Online Safety Act, German JuSchG, US 18 USC §2257
  record-keeping). The 18+ gate on every page is the bare minimum.
- **Payment processor terms**: NOWPayments allows adult content; many
  card processors do not. Verify your processor's AUP before scaling.
- **GDPR**: the `survey_submissions` + `banner_inquiries` tables
  contain personal data. `/legal/delete-my-application` lets users
  self-serve delete; document this in your privacy policy.
- **DMCA / takedown**: build a takedown contact email + process. Posts
  + media live in Supabase Storage `posts` bucket — admins can delete
  via SQL or `/app/admin/users` (banning a user soft-deletes their
  content via RLS).
- **Terms / Privacy**: `/legal/terms` and `/legal/privacy` are template
  copy. Replace with your company name + lawyer-reviewed text before
  taking real traffic. Both are linked from the 18+ gate footer.

---

## 8. Quick reference — URLs and where things live

| Surface | URL | What it does |
|---|---|---|
| Marketing home | `/` | Public landing page |
| Discovery feed | `/explore` | eporner videos + creator content |
| Creator profile | `/c/{handle}` | Public profile with tiers |
| Job board | `/jobs` | Recruiter + applicant marketplace |
| Blog | `/blog` | Static + admin-published posts |
| Sign in | `/app/login` | Three tabs (signin/signup/magic) |
| Dashboard | `/app/dashboard` | Creator dashboard |
| Premium | `/app/premium` | $10/mo platform upgrade |
| Admin hub | `/app/admin` | Admin-only (Users/Jobs/Apps/Inquiries/Blog) |
| Settings | `/app/professional/edit` | Profile + Identity editor |

### What ports does Coolify expose?
- `:80` HTTP — redirects to HTTPS
- `:443` HTTPS — public traffic to the app
- `:8000` Coolify admin UI — lock this to your IP via firewall

---

## 9. Support / questions

This repo is now yours. The codebase is well-commented; start with
`README.md` and `app/[locale]/(social)/layout.tsx` to understand the
shell, then drill into the route folders.

For future work, the original developer can be hired at a per-hour
rate to add features or troubleshoot. The architecture is intentionally
boring — Next.js + Supabase + a couple of REST API clients — so most
junior-to-senior full-stack devs can pick it up in a day or two.

Good luck.
