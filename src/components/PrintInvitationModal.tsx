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

export const TwinTulips: React.FC<{ className?: string }> = ({ className = 'w-12 h-9' }) => (
  <svg viewBox="0 0 100 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Stems in soft romantic sage green */}
    <path d="M50 60 C47 46 40 35 34 24" stroke="#8cb38a" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M50 60 C53 46 60 35 66 24" stroke="#8cb38a" strokeWidth="2.4" strokeLinecap="round" />

    {/* Soft Sage Leaves */}
    <path d="M50 54 C38 48 30 40 25 32 C31 40 41 47 50 54Z" fill="#a4c6a1" />
    <path d="M50 54 C62 48 70 40 75 32 C69 40 59 47 50 54Z" fill="#a4c6a1" />

    {/* Left Tulip (Blushing Pastel Bloom) */}
    <g transform="translate(34, 23) rotate(-14)">
      <path d="M0 -21 C-6 -15 -6 -7 0 0 C6 -7 6 -15 0 -21Z" fill="#f89cb1" />
      <path d="M0 0 C-10 -4 -12 -16 -6 -20 C-2 -14 -1 -5 0 0Z" fill="#ea7892" />
      <path d="M0 0 C10 -4 12 -16 6 -20 C2 -14 1 -5 0 0Z" fill="#f2829c" />
      <path d="M0 0 C-4 -5 -5 -15 0 -18 C5 -15 4 -5 0 0Z" fill="#ffd1dc" />
    </g>

    {/* Right Tulip (Blushing Pastel Bloom) */}
    <g transform="translate(66, 23) rotate(14)">
      <path d="M0 -21 C-6 -15 -6 -7 0 0 C6 -7 6 -15 0 -21Z" fill="#f89cb1" />
      <path d="M0 0 C-10 -4 -12 -16 -6 -20 C-2 -14 -1 -5 0 0Z" fill="#f2829c" />
      <path d="M0 0 C10 -4 12 -16 6 -20 C2 -14 1 -5 0 0Z" fill="#ea7892" />
      <path d="M0 0 C-4 -5 -5 -15 0 -18 C5 -15 4 -5 0 0Z" fill="#ffd1dc" />
    </g>
  </svg>
);

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
  const [variant, setVariant] = useState<InvitationVariant>(invitationType);
  const [addressee, setAddressee] = useState(
    guestNameOverride || selectedRecord?.householdName || selectedRecord?.name || '',
  );
  const [includeQr, setIncludeQr] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
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

const isFieldTbc = (config: Record<string, unknown>, field: string): boolean => {
  const tbcFields = config.tbcFields;
  if (Array.isArray(tbcFields)) return tbcFields.includes(field);
  if (tbcFields && typeof tbcFields === 'object') {
    return Boolean((tbcFields as Record<string, unknown>)[field]);
  }
  return false;
};

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#fdebee',
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
  const resolvedVenue = config.ceremonyVenue?.name &&
    config.ceremonyVenue.name !== 'ArendsRus Country Lodge' &&
    config.ceremonyVenue.name !== 'Venue to follow'
    ? config.ceremonyVenue.name
    : 'Arendsrus';

  const resolvedTime = config.ceremonyVenue?.time &&
    config.ceremonyVenue.time.toLowerCase() !== 'to be confirmed'
    ? config.ceremonyVenue.time
    : '15:00';

  const displayUrl = invitationUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const modal = (
    <div
      className="fixed inset-0 z-[100050] flex items-center justify-center overflow-y-auto bg-stone-950/80 p-2 backdrop-blur-md sm:p-5"
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
              <h2 className="font-serif text-lg font-semibold text-stone-900">Cute &amp; simple personalised cards</h2>
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
              Download 5×7 PDF
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
                  placeholder="e.g. Anri Daniel or The Daniels Family"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-[#bd7890] focus:ring-2 focus:ring-[#ead3db]"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-stone-400">Personal name or family name shown on the card.</p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span>
                    <span className="block text-xs font-semibold text-stone-800">Include QR code</span>
                    <span className="mt-0.5 block text-[10px] text-stone-500">Guests can scan with their phone camera to visit the website &amp; RSVP.</span>
                  </span>
                  <input type="checkbox" checked={includeQr} onChange={event => setIncludeQr(event.target.checked)} className="h-4 w-4 rounded border-stone-300 text-[#8b2946] focus:ring-[#bd7890]" />
                </label>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[11px] text-emerald-900">
                <div className="mb-1.5 flex items-center gap-2 font-semibold"><QrCode className="h-4 w-4" /> Personal RSVP link ready</div>
                <p className="break-all leading-relaxed opacity-80">{invitationUrl}</p>
                {inviteRecipient.inviteCode ? (
                  <p className="mt-2 font-mono font-bold text-[#7f2540]">Private Code: {inviteRecipient.inviteCode}</p>
                ) : (
                  <p className="mt-2 font-semibold text-amber-700">Generic preview link.</p>
                )}
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

            {/* Cute, Clean & Simple 5x7 Card in Dreamy Pastel Pink */}
            <div
              ref={cardRef}
              id="printable-invitation-card"
              className="relative mx-auto flex aspect-[5/7] w-full max-w-[430px] flex-col overflow-hidden rounded-[1.6rem] border-2 border-[#f3b2bf] bg-gradient-to-b from-[#fff5f8] via-[#fdebee] to-[#fce4ec] p-6 text-center shadow-[0_20px_50px_-20px_rgba(180,90,110,0.3)] sm:p-8"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {/* Subtle inner hairline border in soft pastel pink */}
              <div className="pointer-events-none absolute inset-2.5 rounded-[1.2rem] border border-[#f8ccd5]" />

              <div className="relative z-10 flex h-full flex-col justify-between">
                {/* TOP HEADER */}
                <div>
                  {/* Cute Twin Tulips */}
                  <div className="mx-auto mb-1 flex items-center justify-center">
                    <TwinTulips className="h-10 w-auto drop-shadow-xs" />
                  </div>

                  <div className="mx-auto mb-1 flex items-center justify-center gap-2">
                    <span className="h-px w-8 bg-[#f3b2bf]" />
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#9c3353]">
                      {variant === 'save-the-date' ? 'Save the Date' : 'Wedding Invitation'}
                    </p>
                    <span className="h-px w-8 bg-[#f3b2bf]" />
                  </div>
                  {addressee && (
                    <div className="mx-auto mt-1 inline-block rounded-full bg-white/85 border border-[#f3b2bf] px-3.5 py-0.5 font-sans text-[10px] font-bold tracking-wider text-[#9c3353] uppercase shadow-xs">
                      For {addressee}
                    </div>
                  )}
                </div>

                {/* MIDDLE CONTENT */}
                <div className="my-auto py-1">
                  {variant === 'official' && (
                    <p className="mb-2 font-serif text-xs italic text-stone-500">
                      request the pleasure of your company at the wedding of
                    </p>
                  )}

                  <h3 className="font-serif text-3xl font-normal leading-tight text-stone-900 sm:text-4xl">
                    {config.brideShortName || config.brideName}
                  </h3>
                  <p className="my-1 font-serif text-2xl italic text-[#db6b88]">&amp;</p>
                  <h3 className="font-serif text-3xl font-normal leading-tight text-stone-900 sm:text-4xl">
                    {config.groomShortName || config.groomName}
                  </h3>

                  {/* Delicate romantic heart divider */}
                  <div className="mx-auto my-3 flex items-center justify-center gap-2 text-[#f3b2bf]">
                    <span className="h-px w-10 bg-[#f3b2bf]" />
                    <Heart className="h-3.5 w-3.5 fill-[#f48fa4] text-[#f48fa4]" />
                    <span className="h-px w-10 bg-[#f3b2bf]" />
                  </div>

                  {/* Date */}
                  <p className="font-serif text-base font-semibold tracking-wide text-stone-800 sm:text-lg">
                    {dateIsTbc ? 'Date to be confirmed' : formatWeddingDate(config.weddingDate)}
                  </p>

                  {/* Official: Time & Venue (Arendsrus, 15:00) */}
                  {variant === 'official' && (
                    <>
                      <p className="mt-0.5 font-sans text-[11px] font-bold tracking-wider text-[#9c3353] uppercase">
                        at {resolvedTime}
                      </p>
                      <p className="mt-2 font-serif text-base font-semibold text-[#8a2947]">
                        {resolvedVenue}
                      </p>
                      <p className="font-sans text-[10px] text-stone-500">
                        George, Western Cape
                      </p>
                      <p className="mt-2 font-serif text-xs italic text-stone-600">
                        Celebration to follow
                      </p>
                    </>
                  )}

                  {/* Save the date: NO venue, NO time */}
                  {variant === 'save-the-date' && (
                    <p className="mt-4 font-serif text-sm italic text-[#9c3353]">
                      Formal invitation to follow
                    </p>
                  )}
                </div>

                {/* BOTTOM SECTION */}
                <div className="mt-auto border-t border-[#f6c3ce] pt-3 font-sans">
                  {variant === 'official' ? (
                    <>
                      {/* Explicit instruction to RSVP on website */}
                      <div className="mb-2 rounded-xl bg-white/90 border border-[#f3b2bf] px-3 py-1.5 text-center shadow-xs">
                        <p className="text-[11px] font-bold text-[#9c3353]">
                          ✉️ Please RSVP on our website
                        </p>
                        {config.rsvpDeadline && (
                          <p className="text-[9px] text-[#824d5b]">
                            Kindly respond by {formatWeddingDate(config.rsvpDeadline, true)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 text-left">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#9c3353]">
                            Your Private Invite Code
                          </p>
                          <p className="mt-0.5 font-mono text-xs font-extrabold text-[#7f2540] tracking-wider">
                            {inviteRecipient.inviteCode || 'Provided with your invite'}
                          </p>
                          <p className="mt-1 break-all text-[8px] text-stone-500">
                            {displayUrl}
                          </p>
                        </div>

                        {includeQr && qrDataUrl && (
                          <div className="shrink-0 text-center">
                            <img
                              src={qrDataUrl}
                              alt="Scan QR code to RSVP"
                              className="h-16 w-16 rounded-xl bg-white p-1 border border-[#f3b2bf] shadow-xs"
                            />
                            <p className="mt-0.5 text-[8px] font-bold text-[#9c3353]">
                              Scan to RSVP
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Save the date bottom */
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9c3353]">
                          Visit our wedding website
                        </p>
                        <p className="mt-0.5 break-all text-[9px] text-stone-600">
                          {displayUrl}
                        </p>
                        {inviteRecipient.inviteCode && (
                          <p className="mt-1 font-mono text-[9px] font-bold text-[#7f2540]">
                            Your Code: {inviteRecipient.inviteCode}
                          </p>
                        )}
                      </div>

                      {includeQr && qrDataUrl && (
                        <div className="shrink-0 text-center">
                          <img
                            src={qrDataUrl}
                            alt="Scan QR code to visit website"
                            className="h-16 w-16 rounded-xl bg-white p-1 border border-[#f3b2bf] shadow-xs"
                          />
                          <p className="mt-0.5 text-[8px] font-bold text-[#9c3353]">
                            Scan to visit
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
