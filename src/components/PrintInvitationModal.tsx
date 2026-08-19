import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import {
  CalendarHeart,
  Check,
  FileDown,
  Heart,
  Image as ImageIcon,
  Loader2,
  Printer,
  QrCode,
  Sparkles,
  X,
} from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import {
  buildInvitationUrl,
  createInvitationPdf,
  createQrDataUrl,
  downloadInvitationPdf,
  type InvitationConfig,
  type InvitationRecipient,
  type InvitationVariant,
} from '../utils/invitations';

interface RecipientLike {
  id?: string;
  name?: string;
  householdName?: string;
  inviteCode?: string;
  invite_code?: string;
  invitationUrl?: string;
  email?: string;
  primaryEmail?: string;
  phone?: string;
  primaryPhone?: string;
}

export interface PrintInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestNameOverride?: string;
  inviteCodeOverride?: string;
  recipient?: RecipientLike;
  household?: RecipientLike;
  invitationType?: InvitationVariant;
}

const normaliseRecipient = (
  source: RecipientLike | null | undefined,
  guestNameOverride?: string,
  inviteCodeOverride?: string,
): InvitationRecipient => ({
  id: source?.id,
  name: guestNameOverride || source?.householdName || source?.name || 'Honoured Guest',
  inviteCode: inviteCodeOverride || source?.inviteCode || source?.invite_code,
  email: source?.primaryEmail || source?.email,
  phone: source?.primaryPhone || source?.phone,
});

const formatWeddingDate = (value: string, short = false): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed';
  return date.toLocaleDateString('en-ZA', short
    ? { day: '2-digit', month: 'long', year: 'numeric' }
    : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const isFieldTbc = (config: Record<string, unknown>, field: string): boolean => {
  const tbcFields = config.tbcFields;
  if (Array.isArray(tbcFields)) return tbcFields.includes(field);
  if (tbcFields && typeof tbcFields === 'object') {
    return Boolean((tbcFields as Record<string, unknown>)[field]);
  }
  return false;
};

export const PrintInvitationModal: React.FC<PrintInvitationModalProps> = ({
  isOpen,
  onClose,
  guestNameOverride,
  inviteCodeOverride,
  recipient,
  household,
  invitationType = 'official',
}) => {
  const wedding = useWedding();
  const contextRecord = wedding.activeGuest as RecipientLike | null;
  const config = wedding.config as unknown as InvitationConfig & Record<string, unknown>;
  const selectedRecord = recipient || household || contextRecord;
  const [prevInvitationType, setPrevInvitationType] = useState<InvitationVariant>(invitationType);
  const [variant, setVariant] = useState<InvitationVariant>(invitationType);
  const [addressee, setAddressee] = useState(
    guestNameOverride || selectedRecord?.householdName || selectedRecord?.name || '',
  );
  const [includeQr, setIncludeQr] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  if (prevInvitationType !== invitationType) {
    setPrevInvitationType(invitationType);
    setVariant(invitationType);
  }

  const inviteRecipient = useMemo(() => normaliseRecipient(
    selectedRecord,
    addressee || guestNameOverride,
    inviteCodeOverride,
  ), [addressee, guestNameOverride, inviteCodeOverride, selectedRecord]);

  const invitationUrl = useMemo(
    () => selectedRecord?.invitationUrl || buildInvitationUrl(inviteRecipient, config.websiteUrl || config.siteUrl),
    [config.siteUrl, config.websiteUrl, inviteRecipient, selectedRecord?.invitationUrl],
  );
  const qrDataUrl = useMemo(() => {
    try {
      return createQrDataUrl(invitationUrl);
    } catch {
      return '';
    }
  }, [invitationUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const flashSuccess = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 3200);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadInvitationPdf({ ...config, websiteUrl: invitationUrl }, inviteRecipient, variant);
      flashSuccess(`${variant === 'save-the-date' ? 'Save-the-date' : 'Invitation'} PDF downloaded.`);
    } catch (error) {
      console.error('Unable to generate invitation PDF', error);
      setSuccessMessage('The PDF could not be generated. Please check the invitation link and try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#fcf9f5',
        logging: false,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${variant === 'save-the-date' ? 'Save_the_Date' : 'Wedding_Invitation'}_${inviteRecipient.name}`
        .replace(/[^a-z0-9_-]+/gi, '_') + '.png';
      link.click();
      flashSuccess('High-resolution PNG downloaded.');
    } catch (error) {
      console.error('Unable to generate invitation image', error);
      setSuccessMessage('The image could not be generated. Please try the PDF instead.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePrintPdf = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setSuccessMessage('The browser blocked the print window. Allow pop-ups here, then try again.');
      return;
    }
    printWindow.document.write('<title>Preparing invitation…</title><p style="font:16px sans-serif;padding:24px">Preparing the print-ready invitation…</p>');
    try {
      const pdf = await createInvitationPdf({ ...config, websiteUrl: invitationUrl }, inviteRecipient, variant);
      pdf.autoPrint();
      const url = URL.createObjectURL(pdf.output('blob'));
      printWindow.location.replace(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      printWindow.close();
      console.error('Unable to prepare invitation for printing', error);
      setSuccessMessage('The print-ready PDF could not be opened. Please use Download PDF instead.');
    }
  };

  const dateIsTbc = isFieldTbc(config, 'weddingDate');
  const venueIsTbc = isFieldTbc(config, 'ceremonyVenue');
  const displayUrl = invitationUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-stone-950/80 p-2 backdrop-blur-md sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Invitation studio"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-auto flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-[#f7f3ee] shadow-2xl">
        <div className="flex shrink-0 flex-col gap-3 border-b border-stone-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7f2540] to-[#d26886] text-white shadow-md">
              <CalendarHeart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9b5b6d]">Invitation studio</p>
              <h2 className="font-serif text-lg font-semibold text-stone-900">Print-ready, private and personalised</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 rounded-full bg-[#7f2540] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#681d34] disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100" aria-label="Close invitation studio">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="order-2 overflow-y-auto border-t border-stone-200 bg-white p-5 lg:order-1 lg:border-r lg:border-t-0">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Invitation format</label>
                <div className="grid grid-cols-2 rounded-2xl bg-stone-100 p-1">
                  {(['save-the-date', 'official'] as InvitationVariant[]).map(option => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setVariant(option)}
                      className={`rounded-xl px-3 py-2 text-[11px] font-semibold transition ${variant === option ? 'bg-white text-[#7f2540] shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                    >
                      {option === 'save-the-date' ? 'Save the date' : 'Official invite'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="invitation-addressee" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Household addressee</label>
                <input
                  id="invitation-addressee"
                  value={addressee}
                  onChange={event => setAddressee(event.target.value)}
                  placeholder="The Daniels family"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-[#bd7890] focus:ring-2 focus:ring-[#ead3db]"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-stone-400">This name appears on the card. The private invite code remains tied to the selected household.</p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span>
                    <span className="block text-xs font-semibold text-stone-800">Include QR code</span>
                    <span className="mt-0.5 block text-[10px] text-stone-500">Links directly to this household&apos;s RSVP.</span>
                  </span>
                  <input type="checkbox" checked={includeQr} onChange={event => setIncludeQr(event.target.checked)} className="h-4 w-4 rounded border-stone-300 text-[#8b2946] focus:ring-[#bd7890]" />
                </label>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[11px] text-emerald-900">
                <div className="mb-1.5 flex items-center gap-2 font-semibold"><QrCode className="h-4 w-4" /> Personal link ready</div>
                <p className="break-all leading-relaxed opacity-80">{invitationUrl}</p>
                {!inviteRecipient.inviteCode && !selectedRecord?.invitationUrl && <p className="mt-2 font-semibold text-amber-700">Select a household to add its private invite code.</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleDownloadImage} disabled={isGeneratingImage} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-[11px] font-semibold text-stone-700 transition hover:border-[#cf9faf] hover:bg-[#fff7fa] disabled:opacity-50">
                  {isGeneratingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />} PNG
                </button>
                <button type="button" onClick={handlePrintPdf} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-[11px] font-semibold text-stone-700 transition hover:border-[#cf9faf] hover:bg-[#fff7fa]">
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
              </div>
            </div>
          </aside>

          <main className="order-1 min-h-0 overflow-y-auto bg-[#e8e2dc] p-3 sm:p-8 lg:order-2">
            {successMessage && (
              <div className="mx-auto mb-3 flex max-w-[430px] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 shadow-sm">
                <Check className="h-4 w-4 shrink-0" /> {successMessage}
              </div>
            )}

            <div
              ref={cardRef}
              id="printable-invitation-card"
              className="relative mx-auto flex aspect-[5/7] w-full max-w-[430px] flex-col overflow-hidden rounded-[1.4rem] border border-[#c6a468] bg-[#fcf9f5] p-7 text-center shadow-[0_30px_70px_-25px_rgba(70,42,35,0.55)] sm:p-9"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              <div className="pointer-events-none absolute inset-3 rounded-[1rem] border border-[#e5c9cf]" />
              <div className="pointer-events-none absolute -left-7 -top-8 h-32 w-32 rounded-full bg-[#eec9d1]/45 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-7 -right-8 h-36 w-36 rounded-full bg-[#dce4d6]/60 blur-2xl" />
              <CornerBotanical className="absolute left-1 top-1 h-24 w-24 opacity-80" />
              <CornerBotanical className="absolute right-1 top-1 h-24 w-24 -scale-x-100 opacity-80" />
              <CornerBotanical className="absolute bottom-1 left-1 h-24 w-24 -scale-y-100 opacity-70" />
              <CornerBotanical className="absolute bottom-1 right-1 h-24 w-24 scale-x-[-1] scale-y-[-1] opacity-70" />

              <div className="relative z-10 flex h-full flex-col">
                <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#7b213e] via-[#ab4664] to-[#d47791] text-[10px] font-bold tracking-[0.16em] text-white shadow-lg ring-1 ring-[#c5a05d]">
                  C&amp;A
                </div>

                <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.3em] text-stone-500 sm:text-[9px]">
                  {variant === 'save-the-date' ? 'Please save the date' : 'Together with their families'}
                </p>
                {addressee && (
                  <div className="mx-auto mt-2 max-w-[85%] rounded-full border border-[#e9c6d0] bg-[#fff1f4] px-4 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#7f2540] sm:text-[9px]">
                    For {addressee}
                  </div>
                )}

                <div className="my-auto py-3">
                  <h3 className="font-serif text-3xl font-normal leading-none text-stone-900 sm:text-4xl">{config.brideName}</h3>
                  <p className="my-1 font-serif text-2xl italic leading-none text-[#a23d5c]">&amp;</p>
                  <h3 className="font-serif text-3xl font-normal leading-none text-stone-900 sm:text-4xl">{config.groomName}</h3>
                  <div className="mx-auto my-4 h-px w-20 bg-gradient-to-r from-transparent via-[#b99555] to-transparent" />

                  {variant === 'save-the-date' ? (
                    <>
                      <p className="font-serif text-lg font-semibold uppercase tracking-[0.04em] text-stone-800 sm:text-xl">
                        {dateIsTbc ? 'Date to be confirmed' : formatWeddingDate(config.weddingDate, true)}
                      </p>
                      <p className="mt-2 text-[8px] font-semibold uppercase tracking-[0.28em] text-stone-500 sm:text-[9px]">George · Western Cape</p>
                      <p className="mx-auto mt-5 max-w-[270px] font-serif text-[11px] italic leading-relaxed text-stone-600 sm:text-sm">
                        {config.tagline || 'A beautiful celebration is on the horizon.'}
                      </p>
                      <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#8b2946]">Formal invitation to follow</p>
                    </>
                  ) : (
                    <>
                      <p className="font-serif text-[11px] italic text-stone-600 sm:text-sm">request the pleasure of your company at their wedding</p>
                      <p className="mt-4 font-serif text-sm font-semibold text-stone-800 sm:text-base">
                        {dateIsTbc ? 'Date and time to be confirmed' : formatWeddingDate(config.weddingDate)}
                      </p>
                      {!dateIsTbc && <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.17em] text-stone-500">{config.ceremonyVenue.time}</p>}
                      <p className="mt-4 font-serif text-sm font-semibold text-[#7f2540] sm:text-base">
                        {venueIsTbc ? 'Venue details to follow' : config.ceremonyVenue.name}
                      </p>
                      {!venueIsTbc && <p className="mx-auto mt-1 max-w-[270px] text-[8px] leading-relaxed text-stone-500 sm:text-[9px]">{[config.ceremonyVenue.address, config.ceremonyVenue.city].filter(Boolean).join(', ')}</p>}
                      {config.receptionVenue?.name && <p className="mt-2 font-serif text-[9px] italic text-stone-600 sm:text-[11px]">Celebration to follow at {config.receptionVenue.name}</p>}
                    </>
                  )}
                </div>

                <div className={`grid items-end gap-3 border-t border-[#ead3d9] pt-3 text-left ${includeQr && qrDataUrl ? 'grid-cols-[1fr_68px]' : 'grid-cols-1 text-center'}`}>
                  <div className="min-w-0">
                    <p className="text-[7px] font-bold uppercase tracking-[0.19em] text-stone-500">{variant === 'official' ? 'Kindly RSVP online' : 'Details & updates'}</p>
                    <p className="mt-1 break-all text-[7px] leading-relaxed text-stone-600 sm:text-[8px]">{displayUrl}</p>
                    {inviteRecipient.inviteCode && <p className="mt-1 font-mono text-[8px] font-bold text-[#8b2946]">CODE: {inviteRecipient.inviteCode}</p>}
                    {variant === 'official' && config.rsvpDeadline && <p className="mt-1 text-[7px] text-stone-500">Please respond by {formatWeddingDate(config.rsvpDeadline, true)}</p>}
                  </div>
                  {includeQr && qrDataUrl && <img src={qrDataUrl} alt={`QR code for ${inviteRecipient.name}'s private RSVP`} className="h-[68px] w-[68px] rounded-md bg-white p-0.5 shadow-sm" />}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

const CornerBotanical: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M1 2C28 19 42 38 53 74" stroke="#9c7b62" strokeWidth="1.4" />
    <path d="M23 26C37 18 47 18 57 21M35 45C48 38 60 39 70 45" stroke="#9c7b62" strokeWidth="1.1" />
    <ellipse cx="42" cy="20" rx="11" ry="7" fill="#d8aaaf" fillOpacity=".66" />
    <ellipse cx="67" cy="45" rx="9" ry="6" fill="#e7c2ca" fillOpacity=".8" />
    <ellipse cx="29" cy="31" rx="8" ry="4" transform="rotate(26 29 31)" fill="#aabd9f" fillOpacity=".75" />
    <ellipse cx="46" cy="52" rx="8" ry="4" transform="rotate(35 46 52)" fill="#aabd9f" fillOpacity=".62" />
  </svg>
);

export const CutePrintButton: React.FC<{
  className?: string;
  guestName?: string;
  inviteCode?: string;
  recipient?: RecipientLike;
  household?: RecipientLike;
  invitationType?: InvitationVariant;
  variant?: 'pill' | 'outline' | 'card';
}> = ({
  className = '',
  guestName,
  inviteCode,
  recipient,
  household,
  invitationType = 'official',
  variant = 'pill',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const compact = variant === 'outline';
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={compact
          ? `inline-flex items-center gap-1.5 rounded-full border border-[#d7a7b5] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#7f2540] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff5f8] hover:shadow ${className}`
          : `group inline-flex items-center gap-2 rounded-full border border-[#d9a9b8] bg-gradient-to-r from-[#fff5f8] via-white to-[#fff0f4] px-5 py-3 text-xs font-semibold text-[#713047] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${className}`}
        title="Preview or download a personalised invitation"
      >
        {invitationType === 'save-the-date' ? <CalendarHeart className="h-4 w-4 text-[#a13d5b]" /> : <Heart className="h-4 w-4 fill-[#d16d89] text-[#d16d89]" />}
        <span>{compact ? 'Invitation' : invitationType === 'save-the-date' ? 'Save-the-date card' : 'Keepsake invitation'}</span>
        {!compact && <Sparkles className="h-3.5 w-3.5 text-[#b28a40] transition group-hover:rotate-12" />}
      </button>
      {isOpen && (
        <PrintInvitationModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          guestNameOverride={guestName}
          inviteCodeOverride={inviteCode}
          recipient={recipient}
          household={household}
          invitationType={invitationType}
        />
      )}
    </>
  );
};
