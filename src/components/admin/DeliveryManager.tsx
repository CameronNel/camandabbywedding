import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Eye,
  MessageCircle,
  Phone,
  Save,
  Search,
  Users,
} from 'lucide-react';
import type {
  HouseholdInvitation,
  InvitationDelivery,
  InvitationTemplate,
  SendInvitationRequest,
  SendInvitationResult,
  WeddingConfig,
} from '../../types/wedding';
import {
  buildInvitationMessage,
  downloadAllInvitationsZip,
  downloadInvitationPdf,
  sendOrShareWhatsAppWithPdf,
  type InvitationVariant,
} from '../../utils/invitations';
import { Button, EmptyState, Field, inputClass } from './AdminPrimitives';
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
  onSend?: (request: SendInvitationRequest) => Promise<SendInvitationResult>;
  onPreview: (household: HouseholdInvitation, variant: InvitationVariant) => void;
  notify: (toast: ToastState) => void;
}

const kindToVariant = (kind: InvitationTemplate['kind']): InvitationVariant =>
  kind === 'save_the_date' ? 'save-the-date' : 'official';

const defaultTemplate = (kind: InvitationTemplate['kind'], config: WeddingConfig): InvitationTemplate => {
  const couple = `${config.groomShortName || config.groomName} & ${config.brideShortName || config.brideName}`;
  return kind === 'save_the_date'
    ? {
        id: 'save-the-date-template',
        kind,
        name: 'Save the Date',
        subject: `Save the date — ${couple}`,
        heading: 'Please save our wedding date',
        body: `Dear {name},\n\nPlease save the date for our wedding on {date} at {venue}! ✨\n\nView details and reserve your spot: {url}\n\nWith love,\n${couple}`,
        design: { attachPdf: true, includeQr: true },
        isActive: true,
      }
    : {
        id: 'official-invitation-template',
        kind,
        name: 'Official Invitation',
        subject: `Wedding Invitation — ${couple}`,
        heading: 'We would love you to celebrate with us',
        body: `Dear {name},\n\nWe would love for you to celebrate our wedding with us on {date} at {venue}! 💍✨\n\nPlease view your personal invitation and RSVP here: {url}\n\nWith love,\n${couple}`,
        design: { attachPdf: true, includeQr: true },
        isActive: true,
      };
};

const WHATSAPP_SENT_KEY = 'camabby_whatsapp_sent_v1';

const readWhatsAppSentMap = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const val = localStorage.getItem(WHATSAPP_SENT_KEY);
    return val ? (JSON.parse(val) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const saveWhatsAppSent = (householdId: string): Record<string, string> => {
  const current = readWhatsAppSentMap();
  const next = { ...current, [householdId]: new Date().toISOString() };
  try {
    localStorage.setItem(WHATSAPP_SENT_KEY, JSON.stringify(next));
  } catch {
    // Storage quota fallback
  }
  return next;
};

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({
  config,
  households,
  selectedIds,
  onSelectionChange,
  templates,
  onUpsertTemplate,
  onPreview,
  notify,
}) => {
  const [kind, setKind] = useState<InvitationTemplate['kind']>('official_invitation');
  const storedTemplate = templates.find(template => template.kind === kind);
  const [templateDraft, setTemplateDraft] = useState<InvitationTemplate>(() => storedTemplate || defaultTemplate(kind, config));
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'no-phone'>('all');
  const [whatsappSentMap, setWhatsappSentMap] = useState<Record<string, string>>(readWhatsAppSentMap);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const variant = kindToVariant(kind);

  const selectKind = (nextKind: InvitationTemplate['kind']) => {
    setKind(nextKind);
    setTemplateDraft(templates.find(template => template.kind === nextKind) || defaultTemplate(nextKind, config));
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
      notify({ tone: 'success', message: `WhatsApp ${saved.name} message template saved.` });
      return saved;
    } catch (error) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'Could not save message template.' });
      throw error;
    } finally {
      setSavingTemplate(false);
    }
  };

  const filteredHouseholds = useMemo(() => {
    return households.filter(h => {
      const matchesSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || (h.phone && h.phone.includes(search)) || h.inviteCode.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      const isSent = Boolean(whatsappSentMap[h.id]);
      if (statusFilter === 'sent') return isSent;
      if (statusFilter === 'pending') return !isSent;
      if (statusFilter === 'no-phone') return !h.phone;
      return true;
    });
  }, [households, search, statusFilter, whatsappSentMap]);

  const selectedCount = selectedIds.size;

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredHouseholds.length && filteredHouseholds.length > 0) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(filteredHouseholds.map(h => h.id)));
    }
  };

  const toggleHousehold = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const getPersonalizedMessage = (household: HouseholdInvitation): string => {
    const base = buildInvitationMessage(
      { ...config, websiteUrl: household.invitationUrl || config.siteUrl },
      { id: household.id, name: household.name, inviteCode: household.inviteCode, phone: household.phone, email: household.email },
      variant,
    );
    return base.message;
  };

  const [sendingId, setSendingId] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);

  const handleSendWhatsApp = async (household: HouseholdInvitation) => {
    setSendingId(household.id);
    try {
      const recipient = {
        id: household.id,
        name: household.name,
        inviteCode: household.inviteCode,
        phone: household.phone,
        email: household.email,
      };
      const res = await sendOrShareWhatsAppWithPdf(
        { ...config, websiteUrl: household.invitationUrl || config.siteUrl },
        recipient,
        variant,
      );
      const updated = saveWhatsAppSent(household.id);
      setWhatsappSentMap(updated);
      if (res.method === 'native-share') {
        notify({ tone: 'success', message: `Shared invitation & PDF for ${household.name}!` });
      } else {
        notify({ tone: 'success', message: `Generated ${household.name}'s 5×7 PDF & opened WhatsApp chat!` });
      }
    } catch (error) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'Could not generate PDF.' });
    } finally {
      setSendingId(null);
    }
  };

  const handleDownloadZip = async () => {
    const targetHouseholds = households.filter(h => selectedIds.has(h.id));
    if (!targetHouseholds.length) {
      notify({ tone: 'error', message: 'Select at least one household to download PDFs.' });
      return;
    }
    setZipping(true);
    try {
      const recipients = targetHouseholds.map(h => ({
        id: h.id,
        name: h.name,
        inviteCode: h.inviteCode,
        phone: h.phone,
        email: h.email,
      }));
      await downloadAllInvitationsZip(config, recipients, variant);
      notify({ tone: 'success', message: `Downloaded ${recipients.length} personalized 5×7 invitation PDFs in ZIP!` });
    } catch (error) {
      notify({ tone: 'error', message: error instanceof Error ? error.message : 'ZIP generation failed.' });
    } finally {
      setZipping(false);
    }
  };

  const handleCopyMessage = async (household: HouseholdInvitation) => {
    const message = getPersonalizedMessage(household);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(household.id);
      setTimeout(() => setCopiedId(null), 2500);
      notify({ tone: 'success', message: `Copied WhatsApp invitation for ${household.name}.` });
    } catch {
      notify({ tone: 'error', message: 'Clipboard access blocked by browser.' });
    }
  };

  const handleCopyAllSelected = async () => {
    const targetHouseholds = households.filter(h => selectedIds.has(h.id));
    if (!targetHouseholds.length) {
      notify({ tone: 'error', message: 'Select at least one household to copy messages.' });
      return;
    }
    const combined = targetHouseholds
      .map(h => {
        const phone = h.phone ? ` (${h.phone})` : '';
        return `═══════════════════════════════════════\nTO: ${h.name}${phone}\n═══════════════════════════════════════\n${getPersonalizedMessage(h)}\n`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(combined);
      notify({ tone: 'success', message: `Copied ${targetHouseholds.length} personalized WhatsApp messages!` });
    } catch {
      notify({ tone: 'error', message: 'Clipboard access blocked by browser.' });
    }
  };

  const totalSentCount = Object.keys(whatsappSentMap).filter(id => households.some(h => h.id === id)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Direct WhatsApp Dispatcher</p>
          </div>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-900">WhatsApp Invitations</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-stone-500">
            Dispatch personalized invitations directly to your guests on WhatsApp with 1 click. Zero server setup or API fees.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center">
            <p className="text-xl font-bold text-emerald-800">{totalSentCount} / {households.length}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Sent on WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        {/* Template & Message Customization */}
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 grid grid-cols-2 rounded-2xl bg-stone-100 p-1">
            {([
              ['official_invitation', '💍 Official Invitation'],
              ['save_the_date', '✨ Save the Date'],
            ] as Array<[InvitationTemplate['kind'], string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => selectKind(value)}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  kind === value ? 'bg-white text-emerald-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Field label="Message Heading">
              <input
                value={templateDraft.heading}
                onChange={event => setTemplateDraft(current => ({ ...current, heading: event.target.value }))}
                className={inputClass}
                placeholder="We would love you to celebrate with us"
              />
            </Field>

            <Field
              label="WhatsApp Message Body"
              hint="Each guest automatically receives their personal name, date, venue, and private RSVP link."
            >
              <textarea
                rows={6}
                value={templateDraft.body}
                onChange={event => setTemplateDraft(current => ({ ...current, body: event.target.value }))}
                className={`${inputClass} font-sans text-xs leading-relaxed`}
              />
            </Field>

            {/* Live Message Sample Preview */}
            <div className="rounded-2xl border border-emerald-200 bg-[#f4faf4] p-4 text-xs">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Live WhatsApp Message Preview (Sample):
              </p>
              <div className="whitespace-pre-line rounded-xl bg-white p-3.5 font-sans text-xs text-stone-800 shadow-sm border border-emerald-100/60">
                {households[0] ? getPersonalizedMessage(households[0]) : templateDraft.body}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-100 pt-4">
              {households[0] && (
                <Button size="sm" onClick={() => onPreview(households[0], variant)}>
                  <Eye className="h-4 w-4" /> Preview Card
                </Button>
              )}
              {households[0] && (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await downloadInvitationPdf({ ...config, websiteUrl: households[0].invitationUrl || config.siteUrl }, households[0], variant);
                      notify({ tone: 'success', message: 'Sample 5×7 PDF downloaded.' });
                    } catch (error) {
                      notify({ tone: 'error', message: error instanceof Error ? error.message : 'PDF download failed.' });
                    }
                  }}
                >
                  <Download className="h-4 w-4" /> Sample 5×7 PDF
                </Button>
              )}
              <Button
                size="sm"
                tone="primary"
                onClick={() => void saveTemplate()}
                disabled={savingTemplate}
              >
                <Save className="h-4 w-4" /> {savingTemplate ? 'Saving…' : 'Save Message'}
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Batch Actions & Progress */}
        <section className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">Batch WhatsApp Actions</h3>
            <p className="mt-1 text-xs text-stone-500">Select guests below to batch copy messages or dispatch 1-by-1.</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-xs">
                <span className="font-medium text-stone-700">Selected households:</span>
                <span className="rounded-full bg-emerald-600 px-3 py-1 font-bold text-white">
                  {selectedCount} selected
                </span>
              </div>

              <Button
                tone="primary"
                className="w-full justify-center !bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700 !text-white min-h-11"
                onClick={() => void handleCopyAllSelected()}
                disabled={!selectedCount}
              >
                <Copy className="h-4 w-4" /> Copy All Selected WhatsApp Messages
              </Button>

              <Button
                className="w-full justify-center min-h-11 border-stone-300 text-stone-700 hover:bg-stone-50"
                onClick={() => void handleDownloadZip()}
                disabled={!selectedCount || zipping}
              >
                <Download className="h-4 w-4 text-emerald-600" /> {zipping ? 'Packaging PDFs into ZIP…' : `Download All Selected 5×7 PDFs (ZIP)`}
              </Button>

              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 text-[11px] leading-relaxed text-stone-600">
                <p className="font-semibold text-stone-800 mb-1">💡 Automated PDF &amp; WhatsApp Dispatch:</p>
                <ul className="list-disc pl-4 space-y-1 text-stone-500">
                  <li>Clicking <strong>Send on WhatsApp</strong> instantly generates the guest's personalized 5×7 printable PDF card with their unique QR code and opens WhatsApp with their private link.</li>
                  <li>On mobile phones, both the PDF and text are attached directly into WhatsApp. On desktop, the PDF is saved to your downloads and WhatsApp opens in 1 click.</li>
                  <li>Click <strong>Download All Selected PDFs (ZIP)</strong> to download every guest's individual PDF all at once in a neat zip archive!</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Guest WhatsApp Queue & Dispatch Table */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">Guest WhatsApp Queue</h3>
            <p className="mt-0.5 text-xs text-stone-500">Click the green WhatsApp button next to each guest to send their invitation.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search guest or phone…"
                className={`${inputClass} py-1.5 pl-8 text-xs`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as any)}
              className={`${inputClass} w-auto py-1.5 text-xs`}
            >
              <option value="all">All Guests ({households.length})</option>
              <option value="pending">Not Sent Yet</option>
              <option value="sent">Sent on WhatsApp ({totalSentCount})</option>
              <option value="no-phone">Phone Missing</option>
            </select>
          </div>
        </div>

        {/* Action toolbar */}
        <div className="mt-4 flex items-center justify-between border-b border-stone-100 pb-3 text-xs text-stone-500">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filteredHouseholds.length > 0 && selectedIds.size === filteredHouseholds.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-medium">Select all ({filteredHouseholds.length})</span>
          </label>

          <span className="text-[11px]">
            Showing {filteredHouseholds.length} household{filteredHouseholds.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* List */}
        {filteredHouseholds.length ? (
          <div className="divide-y divide-stone-100">
            {filteredHouseholds.map(household => {
              const isSent = Boolean(whatsappSentMap[household.id]);
              const isSelected = selectedIds.has(household.id);

              return (
                <div
                  key={household.id}
                  className={`flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between transition ${
                    isSelected ? 'bg-emerald-50/40 -mx-3 px-3 rounded-2xl' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleHousehold(household.id)}
                      className="h-4 w-4 shrink-0 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="truncate text-sm font-semibold text-stone-900">{household.name}</strong>
                        <span className="text-[10px] text-stone-400 font-mono">({household.inviteCode})</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                        {household.phone ? (
                          <span className="flex items-center gap-1 text-stone-700 font-mono">
                            <Phone className="h-3 w-3 text-emerald-600" /> {household.phone}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">⚠️ No phone number</span>
                        )}
                        <span>·</span>
                        <span>{household.members?.length || household.partySize} guests</span>
                        {isSent && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <Check className="h-3 w-3" /> Sent on WhatsApp
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={sendingId === household.id}
                      onClick={() => void handleSendWhatsApp(household)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                      title="Generates personalized PDF and opens WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{sendingId === household.id ? 'Generating PDF…' : 'Send on WhatsApp'}</span>
                    </button>

                    <Button
                      size="sm"
                      onClick={() => void handleCopyMessage(household)}
                      title="Copy WhatsApp text"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedId === household.id ? 'Copied!' : 'Copy'}</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await downloadInvitationPdf({ ...config, websiteUrl: household.invitationUrl || config.siteUrl }, household, variant);
                          notify({ tone: 'success', message: `5×7 PDF downloaded for ${household.name}.` });
                        } catch (error) {
                          notify({ tone: 'error', message: 'PDF generation failed.' });
                        }
                      }}
                      title="Download 5×7 PDF Card"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => onPreview(household, variant)}
                      title="Preview Card"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No households match this filter"
            description="Clear your search or switch filters to view more guests."
          />
        )}
      </section>
    </div>
  );
};

