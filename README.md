# Cam & Abby Wedding

The public wedding site and private couple dashboard for Cam and Abby's wedding at ArendsRus Country Lodge on 4 January 2027.

The frontend is React, TypeScript, Vite, and Tailwind. GitHub Pages serves the frontend; Supabase provides authentication, durable data, row-level security, photo storage, and the server function used to send invitations. Resend delivers email, while Twilio is optional for SMS and WhatsApp.

## Safety and data model

- Guest details are never committed to GitHub or included in the public JavaScript bundle.
- Production admin access uses Supabase Auth and is allowlisted to `cameronnel111@gmail.com` and `abby@snappy.click` in both the frontend and database policies.
- The `6385` PIN works only in local fallback mode. It is rejected when Supabase is configured and is never stored in the public database config.
- Invitations are households with individual members. Exact 96-bit invitation codes act as bearer credentials; name, email, and phone searches are unavailable to anonymous visitors.
- `free_venue_housing` and `presence_is_our_gift` are enforced inside a token-scoped database function. The browser does not receive content the household is not entitled to see.
- Gallery images are public only when published. Generated invitation PDFs are stored privately.
- Accommodations, services, registry entries, wishes, and guest records start empty. Only the confirmed names, date, venue, and four existing repository images are seeded.

## Local development

```sh
npm install
cp .env.example .env.local
npm run dev
```

If the two `VITE_SUPABASE_*` values are absent, the app intentionally switches to browser-local fallback storage. This is useful for UI development only: data is not shared between browsers and photo/email delivery is unavailable.

## Supabase setup

1. Create a Supabase project and install or run the Supabase CLI.
2. Link the repository and apply the migration:

   ```sh
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

3. In Supabase Auth, create the two admin accounts listed above. Disable public user creation and add the production URL plus local development URL to the permitted Auth redirect URLs.
4. Copy the project URL and publishable key into `.env.local`. The publishable/anon key is browser-visible by design; its safety depends on the included RLS policies. Never expose the service-role key in Vite or GitHub Pages.
5. Configure server-only function secrets:

   ```sh
   npx supabase secrets set \
     RESEND_API_KEY=... \
     INVITATION_FROM_EMAIL=invite@your-verified-domain.example \
     INVITATION_FROM_NAME="Cam & Abby" \
     SITE_URL=https://cameronnel.github.io/camandabbywedding/ \
     ALLOWED_ORIGIN=https://cameronnel.github.io
   ```

   Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to its hosted functions; do not copy the service-role value into frontend configuration.

6. Deploy the invitation function:

   ```sh
   npx supabase functions deploy send-invitation
   ```

The migration creates:

- `site_config`, `households`, and `household_members`;
- editable accommodations, services, registry items, wishes, and gallery metadata;
- versionable save-the-date and official-invitation templates;
- append-only invitation delivery attempts;
- public gallery and private invitation Storage buckets;
- RLS policies and exact-token RSVP functions.

## Email, SMS, and WhatsApp

Resend requires a verified sending domain. Email sends create a personalized 5×7 PDF, embed a real QR code linking to that household's RSVP page, attach the PDF, store a private copy, and log every send attempt. Re-sending creates a new numbered attempt; an idempotency key prevents a provider retry from duplicating one attempt. Keep attachments below Resend's 40 MB post-base64 limit.

To enable Twilio, add these optional function secrets:

```sh
npx supabase secrets set \
  TWILIO_ACCOUNT_SID=... \
  TWILIO_AUTH_TOKEN=... \
  TWILIO_SMS_FROM=... \
  TWILIO_WHATSAPP_FROM=... \
  TWILIO_WHATSAPP_CONTENT_SID=...
```

Business-initiated WhatsApp messages normally require an approved Twilio/WhatsApp content template. `TWILIO_WHATSAPP_CONTENT_SID` is therefore recommended for production. Plain `Body` delivery is retained for the sandbox or an open customer-service window.

The function records `sent` or `failed`. Provider webhooks are still required if the dashboard must later distinguish `delivered` and `bounced` after the initial provider acceptance.

## GitHub Pages deployment

Add these repository-level Actions variables before pushing to `main`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The Pages workflow fails closed when either value is missing so production cannot silently deploy with per-browser fallback data. No provider secret belongs in GitHub Pages build variables.

## Verification

```sh
npm run lint
npm run build
```

Before inviting guests, use the dashboard's dry run, send one test invitation to each admin, scan the PDF QR code on a second device, submit a test RSVP, and verify that tags hide the correct accommodation or gift content.
