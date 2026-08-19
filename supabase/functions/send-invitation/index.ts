import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import QRCode from 'npm:qrcode@1.5.4';

type Channel = 'email' | 'sms' | 'whatsapp';

interface SendRequest {
  householdIds: string[];
  templateId: string;
  channels: Channel[];
  dryRun?: boolean;
  /** Stable for one user-initiated send; a deliberate resend uses a new UUID. */
  requestKey?: string;
}

interface HouseholdRow {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  invite_code: string;
}

interface TemplateRow {
  id: string;
  kind: 'save_the_date' | 'official_invitation';
  name: string;
  subject: string;
  heading: string;
  body: string;
  email_html: string | null;
  design: Record<string, unknown>;
  is_active: boolean;
}

const ADMIN_EMAILS = new Set([
  'cameronnel111@gmail.com',
  'abby@snappy.click',
]);

const allowedChannels = new Set<Channel>(['email', 'sms', 'whatsapp']);
const MAX_HOUSEHOLDS_PER_REQUEST = 10;
const MAX_DELIVERIES_PER_REQUEST = 24;
const MAX_PERSONALIZED_MESSAGE_CHARACTERS = 5000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const configuredSiteUrl = Deno.env.get('SITE_URL')
  ?? 'https://cameronnel.github.io/camandabbywedding/';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? configuredSiteUrl.replace(/\/$/, ''),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function invitationUrl(inviteCode: string): string {
  const url = new URL(configuredSiteUrl);
  url.search = '';
  url.searchParams.set('invite', inviteCode);
  url.hash = 'rsvp';
  return url.toString();
}

function prettyDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function configuredDate(siteConfig: Record<string, unknown>): string {
  const value = typeof siteConfig.weddingDate === 'string' ? siteConfig.weddingDate.trim() : '';
  return isTbc(siteConfig, 'weddingDate') || !value ? 'Date to be confirmed' : prettyDate(value);
}

function configuredTime(
  siteConfig: Record<string, unknown>,
  venueField: 'ceremonyVenue' | 'receptionVenue',
  timeField: 'ceremonyTime' | 'receptionTime',
  label: 'Ceremony' | 'Reception',
): string {
  const venue = siteConfig[venueField] as Record<string, unknown> | undefined;
  const value = typeof venue?.time === 'string' ? venue.time.trim() : '';
  const normalized = value.toLowerCase().replace(/[.]/g, '');
  const isPlaceholder = normalized === 'tbc'
    || normalized === 'to be confirmed'
    || normalized === 'details to follow';
  if (isTbc(siteConfig, venueField) || isTbc(siteConfig, timeField) || !value || isPlaceholder) {
    return `${label} time to be confirmed`;
  }
  return `${label}: ${value}`;
}

function attachmentFilename(template: TemplateRow, household: HouseholdRow): string {
  const householdSlug = household.display_name
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '') || 'guest';
  return `${template.kind === 'save_the_date' ? 'Save-the-date' : 'Wedding-invitation'}-${householdSlug}.pdf`;
}

function deliveryRequestKey(
  requestKey: string,
  householdId: string,
  templateId: string,
  channel: Channel,
): string {
  return `${requestKey}:${householdId}:${templateId}:${channel}`;
}

function isTbc(siteConfig: Record<string, unknown>, field: string): boolean {
  const fields = siteConfig.tbcFields;
  return Boolean(fields && typeof fields === 'object' && (fields as Record<string, unknown>)[field]);
}

function replaceTokens(
  value: string,
  household: HouseholdRow,
  siteConfig: Record<string, unknown>,
  rsvpUrl: string,
): string {
  const replacements: Record<string, string> = {
    '{{guest_name}}': household.display_name,
    '{{couple_names}}': `${String(siteConfig.groomShortName ?? 'Cam')} & ${String(siteConfig.brideShortName ?? 'Abby')}`,
    '{{wedding_date}}': configuredDate(siteConfig),
    '{{venue}}': String((siteConfig.ceremonyVenue as Record<string, unknown> | undefined)?.name || 'Venue to be confirmed'),
    '{{ceremony_time}}': configuredTime(siteConfig, 'ceremonyVenue', 'ceremonyTime', 'Ceremony'),
    '{{reception_time}}': configuredTime(siteConfig, 'receptionVenue', 'receptionTime', 'Reception'),
    '{{rsvp_url}}': rsvpUrl,
  };
  return Object.entries(replacements).reduce(
    (result, [token, replacement]) => result.replaceAll(token, replacement),
    value,
  );
}

function wrapText(text: string, maxCharacters: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Standard PDF fonts use WinAnsi. Normalize user-entered punctuation and names
// so one unsupported character cannot fail an entire invitation batch.
function pdfSafe(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E]/g, '?');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function dataUrlBytes(dataUrl: string): Uint8Array {
  const encoded = dataUrl.split(',')[1] ?? '';
  const binary = atob(encoded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function createInvitationPdf(
  household: HouseholdRow,
  template: TemplateRow,
  siteConfig: Record<string, unknown>,
  rsvpUrl: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([360, 504]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const rose = rgb(0.50, 0.08, 0.22);
  const blush = rgb(0.98, 0.92, 0.94);
  const charcoal = rgb(0.20, 0.18, 0.18);

  page.drawRectangle({ x: 0, y: 0, width: 360, height: 504, color: rgb(0.995, 0.985, 0.97) });
  page.drawRectangle({ x: 14, y: 14, width: 332, height: 476, borderColor: rose, borderWidth: 1 });
  page.drawRectangle({ x: 20, y: 20, width: 320, height: 464, borderColor: blush, borderWidth: 3 });

  const coupleNames = `${String(siteConfig.groomShortName ?? 'Cam')} & ${String(siteConfig.brideShortName ?? 'Abby')}`;
  const centered = (value: string, y: number, size: number, font = regular, color = charcoal) => {
    const safeValue = pdfSafe(value);
    const width = font.widthOfTextAtSize(safeValue, size);
    page.drawText(safeValue, { x: (360 - width) / 2, y, size, font, color });
  };

  centered(coupleNames, 440, 23, bold, rose);
  centered(replaceTokens(template.heading || template.name, household, siteConfig, rsvpUrl), 406, 13, regular, charcoal);
  centered(`For ${household.display_name}`, 375, 12, italic, rose);

  const body = replaceTokens(template.body, household, siteConfig, rsvpUrl);
  let y = 342;
  for (const line of wrapText(body, 52).slice(0, 8)) {
    centered(line, y, 9, regular, charcoal);
    y -= 14;
  }

  const ceremonyVenue = siteConfig.ceremonyVenue as Record<string, unknown> | undefined;
  const receptionVenue = siteConfig.receptionVenue as Record<string, unknown> | undefined;
  const dateLabel = configuredDate(siteConfig);
  centered(dateLabel, 215, 14, bold, rose);
  const venue = String(ceremonyVenue?.name || receptionVenue?.name || 'Venue to be confirmed');
  centered(venue, 193, 11, regular, charcoal);
  const ceremonyTime = configuredTime(siteConfig, 'ceremonyVenue', 'ceremonyTime', 'Ceremony');
  const receptionTime = configuredTime(siteConfig, 'receptionVenue', 'receptionTime', 'Reception');
  centered(ceremonyTime, 177, 8, italic, charcoal);
  centered(receptionTime, 164, 8, italic, charcoal);

  const qrDataUrl = await QRCode.toDataURL(rsvpUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280,
    color: { dark: '#2F1D25', light: '#FFFFFF' },
  });
  const qrImage = await pdf.embedPng(dataUrlBytes(qrDataUrl));
  page.drawImage(qrImage, { x: 140, y: 72, width: 80, height: 80 });
  centered('Scan to view your invitation and RSVP', 54, 7.5, regular, charcoal);
  centered(household.invite_code, 39, 6.5, regular, rose);

  return pdf.save();
}

async function sendResendEmail(args: {
  to: string;
  subject: string;
  html: string;
  pdfBase64: string;
  filename: string;
  idempotencyKey: string;
}): Promise<string> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('INVITATION_FROM_EMAIL');
  if (!apiKey || !fromEmail) throw new Error('Resend is not configured.');
  const fromName = Deno.env.get('INVITATION_FROM_NAME') ?? 'Cam & Abby';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': args.idempotencyKey,
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      attachments: [{ filename: args.filename, content: args.pdfBase64 }],
    }),
  });
  const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) throw new Error(payload.message || `Resend returned ${response.status}.`);
  return payload.id ?? '';
}

async function sendTwilioMessage(args: {
  to: string;
  body: string;
  channel: 'sms' | 'whatsapp';
}): Promise<string> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const configuredFrom = args.channel === 'whatsapp'
    ? Deno.env.get('TWILIO_WHATSAPP_FROM')
    : Deno.env.get('TWILIO_SMS_FROM');
  if (!accountSid || !authToken || !configuredFrom) throw new Error(`Twilio ${args.channel} is not configured.`);

  const params = new URLSearchParams();
  const from = args.channel === 'whatsapp' && !configuredFrom.startsWith('whatsapp:')
    ? `whatsapp:${configuredFrom}`
    : configuredFrom;
  const to = args.channel === 'whatsapp' && !args.to.startsWith('whatsapp:')
    ? `whatsapp:${args.to}`
    : args.to;
  params.set('From', from);
  params.set('To', to);

  const contentSid = args.channel === 'whatsapp' ? Deno.env.get('TWILIO_WHATSAPP_CONTENT_SID') : null;
  if (contentSid) {
    params.set('ContentSid', contentSid);
    params.set('ContentVariables', JSON.stringify({ 1: args.body }));
  } else {
    params.set('Body', args.body);
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: params,
  });
  const payload = await response.json().catch(() => ({})) as { sid?: string; message?: string };
  if (!response.ok) throw new Error(payload.message || `Twilio returned ${response.status}.`);
  return payload.sid ?? '';
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 32_768) {
    return jsonResponse({ error: 'Request body is too large.' }, 413);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return jsonResponse({ error: 'Server configuration is incomplete.' }, 500);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  const callerEmail = userData.user?.email?.toLowerCase();
  if (userError || !callerEmail || !ADMIN_EMAILS.has(callerEmail)) {
    return jsonResponse({ error: 'Not authorized.' }, 403);
  }

  let input: SendRequest;
  try {
    input = await request.json() as SendRequest;
  } catch {
    return jsonResponse({ error: 'Invalid JSON request.' }, 400);
  }

  if (!input || typeof input !== 'object'
    || !Array.isArray(input.householdIds)
    || !Array.isArray(input.channels)
    || typeof input.templateId !== 'string'
    || (input.dryRun !== undefined && typeof input.dryRun !== 'boolean')) {
    return jsonResponse({ error: 'Invalid invitation request.' }, 400);
  }

  if (!UUID_PATTERN.test(input.templateId)
    || input.householdIds.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))
    || input.channels.some((channel) => typeof channel !== 'string' || !allowedChannels.has(channel as Channel))) {
    return jsonResponse({ error: 'The request contains an invalid template, household, or channel.' }, 400);
  }

  const householdIds = Array.from(new Set(input.householdIds));
  const channels = Array.from(new Set(input.channels)) as Channel[];
  if (householdIds.length === 0 || channels.length === 0) {
    return jsonResponse({ error: 'Choose a template, at least one household, and at least one channel.' }, 400);
  }
  if (householdIds.length > MAX_HOUSEHOLDS_PER_REQUEST
    || householdIds.length * channels.length > MAX_DELIVERIES_PER_REQUEST) {
    return jsonResponse({
      error: `Send at most ${MAX_HOUSEHOLDS_PER_REQUEST} households and ${MAX_DELIVERIES_PER_REQUEST} deliveries per request.`,
    }, 413);
  }

  const requestKey = input.requestKey?.trim() ?? '';
  if (!input.dryRun && !UUID_PATTERN.test(requestKey)) {
    return jsonResponse({
      error: 'A client-generated requestKey UUID is required for live sending. Reuse it only when retrying the same send.',
    }, 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const [templateResult, householdResult, configResult] = await Promise.all([
    serviceClient.from('invitation_templates').select('*').eq('id', input.templateId).eq('is_active', true).maybeSingle(),
    serviceClient.from('households').select('id, display_name, email, phone, invite_code').in('id', householdIds),
    serviceClient.from('site_config').select('config').eq('id', 'main').maybeSingle(),
  ]);
  if (templateResult.error || !templateResult.data) {
    return jsonResponse({ error: templateResult.error?.message ?? 'Invitation template not found.' }, 404);
  }
  if (householdResult.error) return jsonResponse({ error: householdResult.error.message }, 500);
  if (configResult.error) return jsonResponse({ error: configResult.error.message }, 500);

  const template = templateResult.data as TemplateRow;
  const households = (householdResult.data ?? []) as HouseholdRow[];
  const siteConfig = (configResult.data?.config ?? {}) as Record<string, unknown>;
  const results: Array<Record<string, unknown>> = [];

  const returnedHouseholdIds = new Set(households.map((household) => household.id));
  const missingHouseholdIds = householdIds.filter((id) => !returnedHouseholdIds.has(id));
  if (missingHouseholdIds.length > 0) {
    return jsonResponse({
      error: 'One or more selected households no longer exist.',
      missingHouseholdIds,
    }, 404);
  }

  for (const household of households) {
    const rsvpUrl = invitationUrl(household.invite_code);
    const subject = replaceTokens(template.subject, household, siteConfig, rsvpUrl);
    const heading = replaceTokens(template.heading || template.name, household, siteConfig, rsvpUrl);
    const body = replaceTokens(template.body, household, siteConfig, rsvpUrl);
    const message = [heading, body, `View your invitation and RSVP: ${rsvpUrl}`].filter(Boolean).join('\n\n');
    const filename = attachmentFilename(template, household);
    let previewPdf: Uint8Array | null = null;
    let previewError = '';

    if (subject.length > 500 || message.length > MAX_PERSONALIZED_MESSAGE_CHARACTERS) {
      previewError = 'The personalized subject or message is too long to send safely.';
    } else if (input.dryRun) {
      try {
        // Dry runs execute the same token replacement, QR, font and PDF path as
        // live email without writing storage or contacting a provider.
        previewPdf = await createInvitationPdf(household, template, siteConfig, rsvpUrl);
      } catch (error) {
        previewError = error instanceof Error ? error.message : 'The invitation PDF could not be generated.';
      }
    }

    for (const channel of channels) {
      const recipient = channel === 'email' ? household.email : household.phone;
      const previewDetails = {
        subject,
        message,
        attachmentFilename: filename,
        attachmentSizeBytes: previewPdf?.byteLength,
      };

      if (previewError || (channel === 'email' && !subject.trim())) {
        results.push({
          householdId: household.id,
          channel,
          recipient: recipient ?? undefined,
          status: 'failed',
          invitationUrl: rsvpUrl,
          ...previewDetails,
          error: previewError || 'The selected template needs an email subject.',
        });
        continue;
      }
      if (!recipient) {
        results.push({
          householdId: household.id,
          channel,
          status: 'skipped',
          invitationUrl: rsvpUrl,
          ...(input.dryRun ? previewDetails : {}),
          error: `No ${channel === 'email' ? 'email address' : 'phone number'} is saved.`,
        });
        continue;
      }
      if (input.dryRun) {
        results.push({
          householdId: household.id,
          channel,
          recipient,
          status: 'preview',
          invitationUrl: rsvpUrl,
          ...previewDetails,
        });
        continue;
      }

      const itemRequestKey = deliveryRequestKey(requestKey, household.id, template.id, channel);
      const existingResult = await serviceClient
        .from('invitation_deliveries')
        .select('id, recipient, status, attempt_number, provider_message_id, error_message, pdf_path')
        .eq('request_key', itemRequestKey)
        .maybeSingle();
      if (existingResult.error) {
        results.push({
          householdId: household.id,
          channel,
          recipient,
          status: 'failed',
          invitationUrl: rsvpUrl,
          error: existingResult.error.message,
        });
        continue;
      }
      if (existingResult.data) {
        const existing = existingResult.data;
        const existingStatus = existing.status === 'sent' || existing.status === 'delivered'
          ? 'sent'
          : existing.status === 'failed' || existing.status === 'bounced'
          ? 'failed'
          : 'queued';
        results.push({
          householdId: household.id,
          channel,
          recipient: existing.recipient,
          status: existingStatus,
          invitationUrl: rsvpUrl,
          providerMessageId: existing.provider_message_id ?? undefined,
          error: existing.error_message ?? undefined,
          deliveryId: existing.id,
          attemptNumber: existing.attempt_number,
          reused: true,
        });
        continue;
      }

      const attemptResult = await serviceClient
        .from('invitation_deliveries')
        .select('attempt_number')
        .eq('household_id', household.id)
        .eq('template_id', template.id)
        .eq('channel', channel)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (attemptResult.error) {
        results.push({
          householdId: household.id,
          channel,
          recipient,
          status: 'failed',
          invitationUrl: rsvpUrl,
          error: attemptResult.error.message,
        });
        continue;
      }
      const attemptNumber = (attemptResult.data?.attempt_number ?? 0) + 1;
      let deliveryId: string | undefined;
      let pdfPath: string | undefined;

      try {
        const insertResult = await serviceClient.from('invitation_deliveries').insert({
          household_id: household.id,
          template_id: template.id,
          channel,
          recipient,
          status: 'queued',
          attempt_number: attemptNumber,
          request_key: itemRequestKey,
        }).select('id').single();
        if (insertResult.error?.code === '23505') {
          const duplicate = await serviceClient
            .from('invitation_deliveries')
            .select('id, recipient, status, attempt_number, provider_message_id, error_message')
            .eq('request_key', itemRequestKey)
            .single();
          if (duplicate.error) throw duplicate.error;
          const duplicateStatus = duplicate.data.status === 'sent' || duplicate.data.status === 'delivered'
            ? 'sent'
            : duplicate.data.status === 'failed' || duplicate.data.status === 'bounced'
            ? 'failed'
            : 'queued';
          results.push({
            householdId: household.id,
            channel,
            recipient: duplicate.data.recipient,
            status: duplicateStatus,
            invitationUrl: rsvpUrl,
            providerMessageId: duplicate.data.provider_message_id ?? undefined,
            error: duplicate.data.error_message ?? undefined,
            deliveryId: duplicate.data.id,
            attemptNumber: duplicate.data.attempt_number,
            reused: true,
          });
          continue;
        }
        if (insertResult.error) throw insertResult.error;
        deliveryId = insertResult.data.id;

        let providerMessageId = '';
        if (channel === 'email') {
          const pdf = await createInvitationPdf(household, template, siteConfig, rsvpUrl);
          pdfPath = `${template.kind}/${household.id}/${requestKey}.pdf`;
          const upload = await serviceClient.storage.from('wedding-invitations').upload(pdfPath, pdf, {
            contentType: 'application/pdf',
            upsert: false,
          });
          if (upload.error) throw upload.error;

          const defaultHtml = `
            <div style="font-family:Georgia,serif;max-width:620px;margin:auto;color:#34282d;line-height:1.7">
              <h1 style="color:#801337">${escapeHtml(heading)}</h1>
              <p>Dear ${escapeHtml(household.display_name)},</p>
              ${body.split(/\n{2,}/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`).join('')}
              <p><a href="${escapeHtml(rsvpUrl)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#801337;color:white;text-decoration:none">View invitation &amp; RSVP</a></p>
              <p style="font-size:12px;color:#75676d">Your personalized invitation is attached as a PDF.</p>
            </div>`;
          const html = template.email_html
            ? replaceTokens(template.email_html, household, siteConfig, rsvpUrl)
            : defaultHtml;
          providerMessageId = await sendResendEmail({
            to: recipient,
            subject,
            html,
            pdfBase64: bytesToBase64(pdf),
            filename,
            idempotencyKey: itemRequestKey,
          });
        } else {
          providerMessageId = await sendTwilioMessage({ to: recipient, body: message, channel });
        }

        const updateResult = await serviceClient.from('invitation_deliveries').update({
          status: 'sent',
          provider_message_id: providerMessageId || null,
          pdf_path: pdfPath || null,
          sent_at: new Date().toISOString(),
        }).eq('id', deliveryId);
        if (updateResult.error) throw updateResult.error;
        results.push({
          householdId: household.id,
          channel,
          recipient,
          status: 'sent',
          invitationUrl: rsvpUrl,
          providerMessageId,
          deliveryId,
          attemptNumber,
          requestKey: itemRequestKey,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invitation delivery failed.';
        if (deliveryId) {
          await serviceClient.from('invitation_deliveries').update({
            status: 'failed',
            error_message: message.slice(0, 2000),
            pdf_path: pdfPath || null,
          }).eq('id', deliveryId);
        }
        results.push({
          householdId: household.id,
          channel,
          recipient,
          status: 'failed',
          invitationUrl: rsvpUrl,
          error: message,
        });
      }
    }
  }

  const ok = results.every((result) => result.status === 'sent' || result.status === 'preview' || result.status === 'queued');
  return jsonResponse({ ok, dryRun: Boolean(input.dryRun), results });
});
