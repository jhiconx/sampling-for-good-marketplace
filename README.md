# Sampling For Good Marketplace

**Live website:** https://sampling-for-good-marketplace.vercel.app/

This repository is the one production codebase for the Organization and Brand Marketplace. The earlier distribution PWA, duplicate navigation module and obsolete Vercel API proxy were retired. Historic versions remain in Git history and the saved backups.

## Production

- **Vercel project:** `sampling-for-good-marketplace`
- **GitHub:** `jhiconx/sampling-for-good-marketplace`, `main` branch
- **Vercel Root Directory:** `marketplace-preview` (historical folder name, not a second application)
- **Supabase project:** `yxfqfrgjjbxagrioeqzz`
- **Sample-request Edge Function:** `sfg-sample-request`

The sample form requires a signed-in Organization account and writes a validated request to `public.sfg_distribution_requests` through the Edge Function. The browser never has access to the Supabase service-role key. The function attempts to email `samples@iconx.io` only when the following **server-side Supabase Edge Function secrets** are configured:

- `RESEND_API_KEY` (Resend service API key)
- `SAMPLE_FROM_EMAIL` (verified sending address)

When email credentials are absent or delivery fails, the request is still saved, and the website truthfully reports that the automatic email did not send and offers a manual email copy. The old `samplingforgood-b5ld` project and its secret configuration are **not** required to store submissions.

## Operating rules

- One Marketplace website, one production GitHub repository, one Supabase project.
- Production changes only upon explicit request. Standalone demos are not the deployment target.
- Test Organization and Brand accounts separately: account roles are fixed to their signed-in account.
