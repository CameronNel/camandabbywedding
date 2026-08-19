import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  History,
  Mail,
  MessageCircle,
  RefreshCw,
  Save,
  Send,
  Smartphone,
} from 'lucide-react';
import type {
  HouseholdInvitation,
  InvitationChannel,
  InvitationDelivery,
  InvitationTemplate,
  SendInvitationRequest,
  SendInvitationResult,
  WeddingConfig,
} from '../../types/wedding';
import {
  buildInvitationMessage,
  createInvitationPdfBlob,
  dispatchInvitationDryRun,
  downloadInvitationPdf,
  invitationFilename,
  readDryRunDeliveryHistory,
  type DryRunDelivery,
  type InvitationVariant,
} from '../../utils/invitations';
import { Button, EmptyState, Field, Modal, Toggle, inputClass } from './AdminPrimitives';
import type { ProviderStatus, ToastState } from './contracts';

interface DeliveryManagerProps {
  config: WeddingConfig;
  dataMode: 'supabase' | 'local';
  households: HouseholdInvitation[];
  selectedIds: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  templates: InvitationTemplate[];
  deliveries: InvitationDelivery[];
  providerStatus?: ProviderStatus;
  onUpsertTemplate: (template: InvitationTemplate) => Promise<InvitationTemplate>;
  onSend: (request: SendInvitationRequest) => Promise<SendInvitationResult>;
  onPreview: (household: HouseholdInvitation, variant: InvitationVariant) => void;
  notify: (toast: ToastState) => void;
}

const kindToVariant = (kind: InvitationTemplate['kind']): InvitationVariant => kind === 'save_the_date' ? 'save-the-date' : 'official';

const defaultTemplate = (kind: InvitationTemplate['kind'], config: WeddingConfig): InvitationTemplate => {
  const couple = `${config.groomShortName} & ${config.brideShortName}`;
  return kind === 'save_the_date' ? {
    id: 'save-the-date-template',
    kind,
    name: 'Save the Date',
    subject: `Save the date — ${couple}`,
    heading: 'Please save the date',
    body: 'We would love you to reserve our wedding date. Open your private link for the latest confirmed details.',
    design: { attachPdf: true, includeQr: true },
    isActive: true,
  } : {
    id: 'official-invitation-template',
    kind,
    name: 'Official Invitation',
    subject: `Your wedding invitation — ${couple}`,
    heading: 'We would be delighted to celebrate with you',
    body: 'Your personalised invitation is attached. Please follow your private link to RSVP and view the latest guest details.',
    design: { attachPdf: true, includeQr: true },
    isActive: true,
  };
};

const channelInfo: Record<InvitationChannel, { label: string; icon: React.ReactNode; destination: (household: HouseholdInvitation) => string | undefined }> = {
  email: { label: 'Email + PDF', icon: <Mail className="h-5 w-5" />, destination: household => household.email },
  sms: { label: 'SMS', icon: <Smartphone className="h-5 w-5" />, destination: household => household.phone },
  whatsapp: { label: 'WhatsApp', icon: <MessageCircle className="h-5 w-5" />, destination: household => household.phone },
};

const statusStyle: Record<string, string> = {
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  queued: 'bg-amber-50 text-amber-700 border-amber-200',
  preview: 'bg-violet-50 text-violet-700 border-violet-200',
  simulated: 'bg-violet-50 text-violet-700 border-violet-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  bounced: 'bg-rose-50 text-rose-700 border-rose-200',
  draft: 'bg-stone-50 text-stone-600 border-stone-200',
};

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({
  config,
  dataMode,
  households,
  selectedIds,
  onSelectionChange,
  templates,
  deliveries,
  providerStatus,
  onUpsertTemplate,
  onSend,
  onPreview,
  notify,
}) => {
  const [kind, setKind] = useState<InvitationTemplate['kind']>('save_the_date');
  const storedTemplate = templates.find(template => template.kind === kind);
  const [templateDraft, setTemplateDraft] = useState<InvitationTemplate>(() => storedTemplate || defaultTemplate(kind, config));
  const [channels, setChannels] = useState<InvitationChannel[]>(['email']);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'preview' | 'live'>('preview');
  const [confirmationText, setConfirmationText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachmentSize, setAttachmentSize] = useState<number | null>(null);
  const [result, setResult] = useState<SendInvitationResult | null>(null);
  const [retryRequest, setRetryRequest] = useState<SendInvitationRequest | null>(null);
  const [dryHistory, setDryHistory] = useState<DryRunDelivery[]>(readDryRunDeliveryHistory);
  const [historyFilter, setHistoryFilter] = useState<'all' | InvitationChannel>('all');

  const selectedHouseholds = useMemo(() => households.filter(household => selectedIds.has(household.id)), [households, selectedIds]);
  const activeTemplate = storedTemplate || templateDraft;

  const selectKind = (nextKind: InvitationTemplate['kind']) => {
    setKind(nextKind);
    setTemplateDraft(templates.find(template => template.kind === nextKind) || defaultTemplate(nextKind, config));
    setResult(null);
  };

  const saveTemplate = async (): Promise<InvitationTemplate> => {
    setSavingTemplate(true);
    try {
      const saved = await onUpsertTemplate({
        ...templateDraft,
        kind,
        design: { ...templateDraft.design, attachPdf: true, includeQr: true },
      });
      setTemplateDraft(saved);
      notify({ tone: 'success', message: `${saved.name} template saved.` });
      return saved;
    } finally {
      setSavingTemplate(false);
    }
  };

  const toggleChannel = (channel: InvitationChannel) => {
    setChannels(current => current.includes(channel) ? current.filter(item => item !== channel) : [...current, channel]);
  };

  const prepareConfirmation = async (mode: 'preview' | 'live') => {
    if (!selectedHouseholds.length) {
      notify({ tone: 'error', message: 'Select at least one household before creating a delivery preview.' });
      return;
    }
    if (!channels.length) {
      notify({ tone: 'error', message: 'Choose at least one delivery channel.' });
      return;
    }
    const missing = selectedHouseholds.flatMap(household => channels
      .filter(channel => !channelInfo[channel].destination(household))
      .map(channel => `${household.name} (${channel})`));
    if (missing.length) {
      notify({ tone: 'error', message: `Add missing contact details before sending: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}.` });
      return;
    }
    try {
      if (channels.includes('email')) {
        const first = selectedHouseholds[0];
        const blob = await createInvitationPdfBlob(
          { ...config, websiteUrl: first.invitationUrl || config.siteUrl },
          { id: first.id, name: first.name, inviteCode: first.inviteCode, email: first.email, phone: first.phone },
          kindToVariant(kind),
        );
        setAttachmentSize(blob.size);
      } else setAttachmentSize(null);
      setDeliveryMode(mode);
      setConfirmationText('');
      setConfirmationOpen(true);
    } catch (error) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'The personalised PDF attachment could not be prepared.' });
    }
  };

  const recordPreviewHistory = async (sendResult: SendInvitationResult, template: InvitationTemplate, isTest: boolean) => {
    const variant = kindToVariant(template.kind);
    for (const item of sendResult.results) {
      const household = households.find(entry => entry.id === item.householdId);
      if (!household) continue;
      const message = buildInvitationMessage(
        { ...config, websiteUrl: household.invitationUrl || config.siteUrl },
        { id: household.id, name: household.name, inviteCode: household.inviteCode, email: household.email, phone: household.phone },
        variant,
      );
      await dispatchInvitationDryRun({
        recipientId: household.id,
        recipientName: household.name,
        invitationVariant: variant,
        channel: item.channel,
        destination: item.recipient || channelInfo[item.channel].destination(household) || 'Missing destination',
        subject: template.subject,
        message: message.message,
        attachmentName: item.channel === 'email' ? invitationFilename(config, household, variant) : undefined,
        isTest,
      });
    }
    setDryHistory(readDryRunDeliveryHistory());
  };

  const runDelivery = async (
    isTest = false,
    override?: { householdId: string; templateId: string; channel: InvitationChannel },
    live = false,
    retry?: SendInvitationRequest,
  ) => {
    setSending(true);
    setResult(null);
    let attemptedRequest: SendInvitationRequest | null = retry || null;
    try {
      let template = storedTemplate || templateDraft;
      if (!retry && (!storedTemplate || templateDraft.subject !== storedTemplate.subject || templateDraft.body !== storedTemplate.body || templateDraft.heading !== storedTemplate.heading)) {
        template = await saveTemplate();
      }
      const request: SendInvitationRequest = retry || (override ? {
        householdIds: [override.householdId],
        templateId: override.templateId || template.id,
        channels: [override.channel],
        dryRun: !live,
        requestKey: live ? crypto.randomUUID() : undefined,
      } : {
        householdIds: isTest ? selectedHouseholds.slice(0, 1).map(household => household.id) : selectedHouseholds.map(household => household.id),
        templateId: template.id,
        channels,
        dryRun: !live,
        requestKey: live ? crypto.randomUUID() : undefined,
      });
      attemptedRequest = request;
      const response = await onSend(request);
      setResult(response);
      setRetryRequest(null);
      if (!live) await recordPreviewHistory(response, template, isTest);
      const failed = response.results.filter(item => item.status === 'failed' || item.status === 'skipped');
      if (!response.ok || failed.length) {
        notify({ tone: 'error', message: response.error || `${failed.length} delivery preview${failed.length === 1 ? '' : 's'} failed. Review the results below.` });
      } else {
        notify({
          tone: 'success',
          message: live
            ? `${response.results.length} personalised ${response.results.length === 1 ? 'delivery' : 'deliveries'} submitted. Review the provider results below.`
            : `${response.results.length} personalised delivery preview${response.results.length === 1 ? '' : 's'} generated. Nothing was sent.`,
        });
      }
      setConfirmationOpen(false);
    } catch (error) {
      if (live && attemptedRequest) setRetryRequest(attemptedRequest);
      notify({
        tone: 'error',
        message: live && attemptedRequest
          ? 'The connection ended before the final send result was confirmed. Use “Retry same request” so the server can safely return the original result without duplicating messages.'
          : error instanceof Error ? error.message : 'The invitation service could not create the preview.',
      });
    } finally {
      setSending(false);
    }
  };

  const selectAudience = (audience: 'all' | 'pending' | 'attending') => {
    onSelectionChange(new Set(households.filter(household => audience === 'all' || household.rsvpStatus === audience).map(household => household.id)));
  };

  const combinedHistory = useMemo(() => {
    const persistent = deliveries.map(delivery => ({
      id: delivery.id,
      householdId: delivery.householdId,
      templateId: delivery.templateId,
      channel: delivery.channel,
      recipient: delivery.recipient,
      status: delivery.status,
      attempts: delivery.attemptNumber,
      date: delivery.sentAt || delivery.createdAt || '',
      error: delivery.errorMessage,
      simulated: false,
    }));
    const previews = dryHistory.map(delivery => ({
      id: delivery.id,
      householdId: delivery.recipientId || '',
      templateId: templates.find(template => kindToVariant(template.kind) === delivery.invitationVariant)?.id || '',
      channel: delivery.channel,
      recipient: delivery.destination,
      status: delivery.status,
      attempts: 1,
      date: delivery.sentAt,
      error: undefined,
      simulated: true,
    }));
    return [...previews, ...persistent]
      .filter(item => historyFilter === 'all' || item.channel === historyFilter)
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 100);
  }, [deliveries, dryHistory, historyFilter, templates]);

  const variant = kindToVariant(kind);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d72]">Invitation operations</p>
        <h2 className="font-serif text-2xl font-semibold text-stone-900">Design, test &amp; deliver</h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-stone-500">Every household receives its own QR, private RSVP link and—by email—a personalised PDF. Test with a dry run first; shared cloud mode can then send through the configured providers after an explicit final confirmation.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-stone-100 p-1">
            {([
              ['save_the_date', 'Save the Date'],
              ['official_invitation', 'Official Invitation'],
            ] as Array<[InvitationTemplate['kind'], string]>).map(([value, label]) => (
              <button key={value} type="button" onClick={() => selectKind(value)} className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${kind === value ? 'bg-white text-[#7f2540] shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}>{label}</button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Template name"><input value={templateDraft.name} onChange={event => setTemplateDraft(current => ({ ...current, name: event.target.value }))} className={inputClass} /></Field><Field label="Email subject"><input value={templateDraft.subject} onChange={event => setTemplateDraft(current => ({ ...current, subject: event.target.value }))} className={inputClass} /></Field></div>
            <Field label="Heading"><input value={templateDraft.heading} onChange={event => setTemplateDraft(current => ({ ...current, heading: event.target.value }))} className={inputClass} /></Field>
            <Field label="Message body" hint="The delivery service appends each household's private link. Avoid placing a generic shared URL here."><textarea rows={5} value={templateDraft.body} onChange={event => setTemplateDraft(current => ({ ...current, body: event.target.value }))} className={inputClass} /></Field>
            <div className="grid gap-3 sm:grid-cols-2"><Toggle checked={true} onChange={() => undefined} disabled label="Attach personalised 5×7 PDF" description="Email attachments are generated per household and encoded for the configured Resend provider." /><Toggle checked={templateDraft.isActive} onChange={checked => setTemplateDraft(current => ({ ...current, isActive: checked }))} label="Active template" description="Only active templates should be used for a delivery batch." /></div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4">
              {selectedHouseholds[0] && <Button onClick={() => onPreview(selectedHouseholds[0], variant)}><Eye className="h-4 w-4" /> Preview card</Button>}
              {selectedHouseholds[0] && <Button onClick={async () => {
                try {
                  await downloadInvitationPdf({ ...config, websiteUrl: selectedHouseholds[0].invitationUrl || config.siteUrl }, selectedHouseholds[0], variant);
                } catch (error) {
                  notify({ tone: 'error', message: error instanceof Error ? error.message : 'PDF download failed.' });
                }
              }}><Download className="h-4 w-4" /> Sample PDF</Button>}
              <Button tone="primary" onClick={() => void saveTemplate().catch(error => notify({ tone: 'error', message: error instanceof Error ? error.message : 'The invitation template could not be saved.' }))} disabled={savingTemplate}><Save className="h-4 w-4" /> {savingTemplate ? 'Saving…' : 'Save template'}</Button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-serif text-lg font-semibold text-stone-900">Delivery audience</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-stone-500">Use the household checkboxes or a quick audience selector.</p>
          <div className="mt-4 grid grid-cols-3 gap-2"><Button size="sm" onClick={() => selectAudience('all')}>All</Button><Button size="sm" onClick={() => selectAudience('pending')}>Pending</Button><Button size="sm" onClick={() => selectAudience('attending')}>Attending</Button></div>
          <div className="mt-4 rounded-2xl border border-[#dfbbc6] bg-[#fff6f8] p-4 text-[#713047]">
            <p className="text-2xl font-semibold">{selectedHouseholds.length}</p><p className="text-[10px] font-bold uppercase tracking-[0.16em]">households selected</p>
          </div>

          <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">Channels</p>
          <div className="space-y-2">
            {(Object.keys(channelInfo) as InvitationChannel[]).map(channel => (
              <button key={channel} type="button" onClick={() => toggleChannel(channel)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${channels.includes(channel) ? 'border-[#ce93a6] bg-[#fff4f7] text-[#713047]' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">{channelInfo[channel].icon}</span><span className="flex-1 text-xs font-semibold">{channelInfo[channel].label}</span>{channels.includes(channel) && <CheckCircle2 className="h-4 w-4" />}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            <Button className="w-full" onClick={() => void runDelivery(true)} disabled={!selectedHouseholds.length || sending}><FileCheck2 className="h-4 w-4" /> Test first recipient</Button>
            <Button className="w-full" onClick={() => void prepareConfirmation('preview')} disabled={!selectedHouseholds.length || sending}><Eye className="h-4 w-4" /> Review delivery preview</Button>
            <Button className="w-full" tone="primary" onClick={() => void prepareConfirmation('live')} disabled={dataMode !== 'supabase' || !selectedHouseholds.length || sending} title={dataMode === 'supabase' ? 'Review and confirm a live provider send' : 'Live sends require shared cloud mode'}><Send className="h-4 w-4" /> {dataMode === 'supabase' ? 'Review live send' : 'Live send unavailable locally'}</Button>
            {retryRequest && <Button className="w-full" tone="danger" onClick={() => void runDelivery(false, undefined, true, retryRequest)} disabled={sending}><RefreshCw className="h-4 w-4" /> Retry same request safely</Button>}
          </div>
        </section>
      </div>

      <ProviderReadiness dataMode={dataMode} status={providerStatus} />

      {result && (
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-lg font-semibold text-stone-900">Latest {result.dryRun ? 'dry-run' : 'send'} results</h3><p className="text-[11px] text-stone-500">{result.dryRun ? 'No provider messages were sent.' : 'Provider responses are shown exactly as returned by the delivery service.'}</p></div><span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${result.dryRun ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>{result.results.length} result{result.results.length === 1 ? '' : 's'}</span></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {result.results.map((item, index) => {
              const household = households.find(entry => entry.id === item.householdId);
              return <div key={`${item.householdId}-${item.channel}-${index}`} className={`rounded-2xl border p-3 text-[11px] ${item.status === 'failed' || item.status === 'skipped' ? 'border-rose-200 bg-rose-50' : 'border-stone-200 bg-stone-50'}`}><div className="flex items-center justify-between gap-2"><strong className="truncate text-stone-800">{household?.name || item.householdId}</strong><span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusStyle[item.status] || statusStyle.draft}`}>{item.status}</span></div><p className="mt-1 text-stone-500">{item.channel} · {item.recipient || 'missing destination'}</p>{item.error && <p className="mt-2 font-medium text-rose-700">{item.error}</p>}</div>;
            })}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-stone-900"><History className="h-4 w-4 text-[#99516a]" /> Send &amp; resend history</h3><p className="mt-0.5 text-[11px] text-stone-500">Includes provider deliveries and local dry-run previews.</p></div><select value={historyFilter} onChange={event => setHistoryFilter(event.target.value as 'all' | InvitationChannel)} className={`${inputClass} w-auto py-2 text-xs`}><option value="all">All channels</option><option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option></select></div>
        {combinedHistory.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-[11px]"><thead><tr className="border-b border-stone-200 text-[9px] font-bold uppercase tracking-[0.14em] text-stone-400"><th className="px-3 py-2">Household</th><th className="px-3 py-2">Channel</th><th className="px-3 py-2">Recipient</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th><th className="px-3 py-2 text-right">Action</th></tr></thead><tbody className="divide-y divide-stone-100">{combinedHistory.map(item => {
          const household = households.find(entry => entry.id === item.householdId);
          return <tr key={item.id}><td className="px-3 py-3 font-semibold text-stone-800">{household?.name || 'Unknown household'}{item.simulated && <span className="ml-2 text-[9px] font-normal text-violet-600">dry run</span>}</td><td className="px-3 py-3 capitalize text-stone-600">{item.channel}</td><td className="px-3 py-3 text-stone-500">{item.recipient}</td><td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${statusStyle[item.status] || statusStyle.draft}`}>{item.status}</span>{item.error && <p className="mt-1 max-w-xs text-[9px] text-rose-600">{item.error}</p>}</td><td className="px-3 py-3 text-stone-500">{item.date ? new Date(item.date).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td><td className="px-3 py-3 text-right"><Button size="sm" disabled={!household} onClick={() => household && void runDelivery(false, { householdId: household.id, templateId: item.templateId || activeTemplate.id, channel: item.channel })}><RefreshCw className="h-3.5 w-3.5" /> Resend preview</Button></td></tr>;
        })}</tbody></table></div> : <EmptyState icon={<Clock3 className="h-5 w-5" />} title="No send history yet" description="Run a test or delivery preview and each personalised attempt will appear here for safe repeat sending." />}
      </section>

      <Modal open={confirmationOpen} onClose={() => setConfirmationOpen(false)} title={deliveryMode === 'live' ? 'Confirm live invitation send' : 'Confirm delivery preview'} eyebrow={deliveryMode === 'live' ? 'This contacts real recipients' : 'No live messages will be sent'}>
        <div className="space-y-4">
          <div className={`rounded-2xl border p-4 text-xs leading-relaxed ${deliveryMode === 'live' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-violet-200 bg-violet-50 text-violet-900'}`}><div className="mb-1 flex items-center gap-2 font-semibold">{deliveryMode === 'live' ? <Send className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4" />}{deliveryMode === 'live' ? 'Live provider delivery' : 'Provider-safe dry run'}</div>{deliveryMode === 'live' ? 'Email, SMS and WhatsApp providers will be contacted. Every email receives its household-specific PDF attachment and private RSVP link. Provider setup errors will be returned in the results.' : 'This creates personalised previews and records them in history. Resend, Twilio, SMS and WhatsApp providers will not be contacted.'}</div>
          <dl className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-stone-50 p-3"><dt className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Recipients</dt><dd className="mt-1 font-semibold text-stone-800">{selectedHouseholds.length} households</dd></div><div className="rounded-xl bg-stone-50 p-3"><dt className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Deliveries</dt><dd className="mt-1 font-semibold text-stone-800">{selectedHouseholds.length * channels.length} {deliveryMode === 'live' ? 'messages' : 'previews'}</dd></div><div className="rounded-xl bg-stone-50 p-3"><dt className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Channels</dt><dd className="mt-1 font-semibold capitalize text-stone-800">{channels.join(', ')}</dd></div><div className="rounded-xl bg-stone-50 p-3"><dt className="text-[9px] font-bold uppercase tracking-wider text-stone-400">PDF attachment</dt><dd className="mt-1 font-semibold text-stone-800">{channels.includes('email') ? `${attachmentSize ? Math.ceil(attachmentSize / 1024) : '—'} KB sample verified` : 'Not applicable'}</dd></div></dl>
          {deliveryMode === 'live' && <Field label="Type SEND to confirm"><input value={confirmationText} onChange={event => setConfirmationText(event.target.value.toUpperCase())} placeholder="SEND" autoComplete="off" className={inputClass} /></Field>}
          <div className="flex justify-end gap-2 border-t border-stone-200 pt-4"><Button onClick={() => setConfirmationOpen(false)}>Cancel</Button><Button tone="primary" onClick={() => void runDelivery(false, undefined, deliveryMode === 'live')} disabled={sending || (deliveryMode === 'live' && confirmationText !== 'SEND')}>{sending ? 'Working…' : deliveryMode === 'live' ? 'Send invitations now' : 'Generate previews'}</Button></div>
        </div>
      </Modal>
    </div>
  );
};

const ProviderReadiness: React.FC<{ dataMode: 'supabase' | 'local'; status?: ProviderStatus }> = ({ dataMode, status }) => {
  const items = [
    { key: 'email' as const, name: 'Email + PDF', detail: 'Resend requires a verified sender domain. Attachments are sent as base64 and must remain below the provider limit.' },
    { key: 'sms' as const, name: 'SMS', detail: 'Twilio credentials and an approved sending number are required.' },
    { key: 'whatsapp' as const, name: 'WhatsApp', detail: 'Business-initiated messages outside the 24-hour window require an approved WhatsApp sender and template.' },
  ];
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-stone-900">Provider readiness</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-3">{items.map(item => {
        const ready = Boolean(status?.[item.key]);
        const error = status?.[`${item.key}Error` as 'emailError' | 'smsError' | 'whatsappError'];
        return <div key={item.key} className={`rounded-2xl border p-4 ${ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><div className="flex items-center gap-2 text-xs font-semibold text-stone-800">{ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}{item.name}</div><p className="mt-2 text-[10px] leading-relaxed text-stone-600">{error || (dataMode === 'local' ? 'Provider not configured in local mode. ' : 'Configuration is verified by the backend at send time. ')}{item.detail}</p></div>;
      })}</div>
    </section>
  );
};
