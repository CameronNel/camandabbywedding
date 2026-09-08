import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { formatWeddingDate } from './dates';

export type InvitationVariant = 'save-the-date' | 'official';
export type DeliveryChannel = 'email' | 'sms' | 'whatsapp';

export interface InvitationRecipient {
  id?: string;
  name: string;
  inviteCode?: string;
  email?: string;
  phone?: string;
}

export interface InvitationConfig {
  brideName: string;
  brideShortName?: string;
  groomName: string;
  groomShortName?: string;
  weddingDate: string;
  tagline?: string;
  rsvpDeadline?: string;
  siteUrl?: string;
  websiteUrl?: string;
  ceremonyVenue: {
    name: string;
    address?: string;
    city?: string;
    time?: string;
  };
  receptionVenue?: {
    name?: string;
    address?: string;
    city?: string;
    time?: string;
  };
  dressCode?: {
    title?: string;
  };
}

export interface DryRunDelivery {
  id: string;
  recipientId?: string;
  recipientName: string;
  invitationVariant: InvitationVariant;
  channel: DeliveryChannel;
  destination: string;
  subject?: string;
  message: string;
  attachmentName?: string;
  status: 'simulated' | 'failed';
  sentAt: string;
  isTest: boolean;
}

const PDF_WIDTH = 360;
const PDF_HEIGHT = 504;
const DRY_RUN_HISTORY_KEY = 'camabby_invitation_delivery_history_v1';

/** Uses the maintained `qrcode` encoder so every visual and PDF code is a real,
 * error-corrected QR symbol rather than a decorative approximation. */
export const createQrMatrix = (value: string): boolean[][] => {
  const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const data = qr.modules.data;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (__, column) => Boolean(data[row * size + column])),
  );
};

export const createQrSvg = (value: string, foreground = '#20191b', background = '#ffffff'): string => {
  const modules = createQrMatrix(value);
  const quietZone = 4;
  const size = modules.length + quietZone * 2;
  const path = modules
    .flatMap((row, rowIndex) =>
      row.flatMap((dark, columnIndex) => dark ? [`M${columnIndex + quietZone} ${rowIndex + quietZone}h1v1h-1z`] : []),
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${background}"/><path d="${path}" fill="${foreground}"/></svg>`;
};

export const createQrDataUrl = (value: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createQrSvg(value))}`;

const currentSiteBase = (): string => {
  if (typeof window === 'undefined') return 'https://cameronnel.github.io/camandabbywedding/';
  return `${window.location.origin}${window.location.pathname}`;
};

export const buildInvitationUrl = (
  recipient: Pick<InvitationRecipient, 'inviteCode'>,
  configuredUrl?: string,
): string => {
  const base = configuredUrl || currentSiteBase();
  try {
    const url = new URL(base, typeof window === 'undefined' ? 'https://cameronnel.github.io/' : window.location.href);
    if (recipient.inviteCode) url.searchParams.set('code', recipient.inviteCode);
    url.hash = 'rsvp';
    return url.toString();
  } catch {
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${recipient.inviteCode ? `${separator}code=${encodeURIComponent(recipient.inviteCode)}` : ''}#rsvp`;
  }
};

const formatDate = (value: string, long = true): string => {
  return formatWeddingDate(value, long
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: 'long', year: 'numeric' });
};

const displayUrl = (url: string): string => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const safePdfText = (value: string): string => value
  .replace(/[–—]/g, '-')
  .replace(/[’‘]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[^\x20-\x7E]/g, '');

const drawQr = (pdf: jsPDF, value: string, x: number, y: number, size: number) => {
  const matrix = createQrMatrix(value);
  const quietZone = 4;
  const moduleSize = size / (matrix.length + quietZone * 2);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, size, size, 'F');
  pdf.setFillColor(31, 25, 27);
  matrix.forEach((row, rowIndex) => {
    row.forEach((dark, columnIndex) => {
      if (!dark) return;
      pdf.rect(
        x + (columnIndex + quietZone) * moduleSize,
        y + (rowIndex + quietZone) * moduleSize,
        moduleSize + 0.08,
        moduleSize + 0.08,
        'F',
      );
    });
  });
};

export const invitationFilename = (
  config: InvitationConfig,
  recipient: InvitationRecipient,
  variant: InvitationVariant,
): string => {
  const couple = `${config.groomShortName || config.groomName}_${config.brideShortName || config.brideName}`;
  const addressee = recipient.name || 'Guest';
  return `${couple}_${variant === 'save-the-date' ? 'Save_the_Date' : 'Wedding_Invitation'}_${addressee}`
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') + '.pdf';
};

const drawTulipPair = (pdf: jsPDF, centre: number, topY: number) => {
  // Stems in sage green
  pdf.setDrawColor(140, 179, 138);
  pdf.setLineWidth(1.3);
  pdf.line(centre - 1, topY + 20, centre - 7, topY + 9);
  pdf.line(centre + 1, topY + 20, centre + 7, topY + 9);

  // Soft Sage Leaves
  pdf.setFillColor(164, 198, 161);
  pdf.ellipse(centre - 10, topY + 14, 5.5, 2.2, 'F');
  pdf.ellipse(centre + 10, topY + 14, 5.5, 2.2, 'F');

  // Left Tulip Blossom (Blushing pastel pink)
  pdf.setFillColor(248, 156, 177);
  pdf.ellipse(centre - 8, topY + 5, 4, 5.5, 'F');
  pdf.setFillColor(234, 120, 146);
  pdf.ellipse(centre - 10.5, topY + 6, 2.8, 4.8, 'F');
  pdf.setFillColor(242, 130, 156);
  pdf.ellipse(centre - 5.5, topY + 6, 2.8, 4.8, 'F');
  pdf.setFillColor(255, 209, 220);
  pdf.ellipse(centre - 8, topY + 6, 2.5, 3.8, 'F');

  // Right Tulip Blossom (Blushing pastel pink)
  pdf.setFillColor(248, 156, 177);
  pdf.ellipse(centre + 8, topY + 5, 4, 5.5, 'F');
  pdf.setFillColor(242, 130, 156);
  pdf.ellipse(centre + 5.5, topY + 6, 2.8, 4.8, 'F');
  pdf.setFillColor(234, 120, 146);
  pdf.ellipse(centre + 10.5, topY + 6, 2.8, 4.8, 'F');
  pdf.setFillColor(255, 209, 220);
  pdf.ellipse(centre + 8, topY + 6, 2.5, 3.8, 'F');
};

export const createInvitationPdf = async (
  config: InvitationConfig,
  recipient: InvitationRecipient,
  variant: InvitationVariant = 'official',
): Promise<jsPDF> => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PDF_WIDTH, PDF_HEIGHT], compress: true });
  const invitationUrl = buildInvitationUrl(recipient, config.websiteUrl || config.siteUrl);
  const centre = PDF_WIDTH / 2;

  const venueName = config.ceremonyVenue?.name &&
    config.ceremonyVenue.name !== 'ArendsRus Country Lodge' &&
    config.ceremonyVenue.name !== 'Venue to follow'
    ? config.ceremonyVenue.name
    : 'Arendsrus';

  const venueTime = config.ceremonyVenue?.time &&
    config.ceremonyVenue.time.toLowerCase() !== 'to be confirmed'
    ? config.ceremonyVenue.time
    : '15:00';

  // 1. Soft pastel pink background
  pdf.setFillColor(254, 240, 244);
  pdf.rect(0, 0, PDF_WIDTH, PDF_HEIGHT, 'F');

  // 2. Romantic dual hairline border in soft pastel pink
  pdf.setDrawColor(243, 178, 191);
  pdf.setLineWidth(1.4);
  pdf.roundedRect(14, 14, PDF_WIDTH - 28, PDF_HEIGHT - 28, 8, 8, 'S');

  pdf.setDrawColor(248, 204, 213);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(18, 18, PDF_WIDTH - 36, PDF_HEIGHT - 36, 6, 6, 'S');

  // 3. Tulip pair & Header
  drawTulipPair(pdf, centre, 20);

  pdf.setDrawColor(243, 178, 191);
  pdf.setLineWidth(0.6);
  pdf.line(centre - 85, 47, centre - 50, 47);
  pdf.line(centre + 50, 47, centre + 85, 47);

  pdf.setTextColor(156, 51, 83);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setCharSpace(1.8);
  pdf.text(variant === 'save-the-date' ? 'SAVE THE DATE' : 'WEDDING INVITATION', centre, 49.5, { align: 'center' });
  pdf.setCharSpace(0);

  // Addressee tag pill (if present)
  let contentTop = 66;
  if (recipient.name) {
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(centre - 75, 56, 150, 16, 8, 8, 'F');
    pdf.setDrawColor(243, 178, 191);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(centre - 75, 56, 150, 16, 8, 8, 'S');

    pdf.setTextColor(156, 51, 83);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    pdf.text(safePdfText(`FOR ${recipient.name.toUpperCase()}`), centre, 66.5, { align: 'center', maxWidth: 140 });
    contentTop = 84;
  }

  // 4. Couple Names
  const namesTop = contentTop + (variant === 'official' ? 36 : 24);
  if (variant === 'official') {
    pdf.setFont('times', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(120, 105, 100);
    pdf.text('request the pleasure of your company at the wedding of', centre, namesTop - 18, { align: 'center' });
  }

  const bride = config.brideShortName || config.brideName;
  const groom = config.groomShortName || config.groomName;

  pdf.setTextColor(40, 32, 35);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(25);
  pdf.text(safePdfText(bride), centre, namesTop + 8, { align: 'center' });

  pdf.setTextColor(219, 107, 136);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(18);
  pdf.text('&', centre, namesTop + 28, { align: 'center' });

  pdf.setTextColor(40, 32, 35);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(25);
  pdf.text(safePdfText(groom), centre, namesTop + 54, { align: 'center' });

  // Delicate divider
  pdf.setDrawColor(243, 178, 191);
  pdf.setLineWidth(0.6);
  pdf.line(centre - 36, namesTop + 70, centre + 36, namesTop + 70);

  // 5. Date & Venue Details
  if (variant === 'save-the-date') {
    pdf.setTextColor(55, 45, 48);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    pdf.text(safePdfText(formatDate(config.weddingDate)), centre, namesTop + 98, { align: 'center' });

    pdf.setFont('times', 'italic');
    pdf.setFontSize(11);
    pdf.setTextColor(156, 51, 83);
    pdf.text('Formal invitation to follow', centre, namesTop + 126, { align: 'center' });
  } else {
    // Official invite: Date, Time (15:00), Venue (Arendsrus)
    pdf.setTextColor(50, 40, 45);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14.5);
    pdf.text(safePdfText(formatDate(config.weddingDate)), centre, namesTop + 96, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(156, 51, 83);
    pdf.text(safePdfText(`AT ${venueTime}`), centre, namesTop + 110, { align: 'center' });

    pdf.setFont('times', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(138, 41, 71);
    pdf.text(safePdfText(venueName), centre, namesTop + 128, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(120, 110, 105);
    pdf.text(
      safePdfText('George, Western Cape'),
      centre,
      namesTop + 141,
      { align: 'center' },
    );

    pdf.setFont('times', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 90, 85);
    pdf.text('Celebration to follow', centre, namesTop + 158, { align: 'center' });
  }

  // 6. Bottom Section: RSVP Box & Scannable QR Code
  pdf.setDrawColor(246, 195, 206);
  pdf.setLineWidth(0.6);
  pdf.line(26, 376, PDF_WIDTH - 26, 376);

  if (variant === 'official') {
    // RSVP Callout Box
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(30, 386, PDF_WIDTH - 60, 24, 6, 6, 'F');
    pdf.setDrawColor(243, 178, 191);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(30, 386, PDF_WIDTH - 60, 24, 6, 6, 'S');

    pdf.setTextColor(156, 51, 83);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text('PLEASE RSVP ON OUR WEBSITE', centre, 398, { align: 'center' });

    if (config.rsvpDeadline) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(130, 77, 91);
      pdf.text(`Kindly respond by ${formatDate(config.rsvpDeadline, false)}`, centre, 406.5, { align: 'center' });
    }

    // QR Code on right
    const qrSize = 58;
    const qrX = PDF_WIDTH - 36 - qrSize;
    const qrY = 418;
    drawQr(pdf, invitationUrl, qrX, qrY, qrSize);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(156, 51, 83);
    pdf.text('SCAN TO RSVP', qrX + qrSize / 2, qrY + qrSize + 7.5, { align: 'center' });

    // Left info
    const leftX = 36;
    pdf.setTextColor(156, 51, 83);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    pdf.text('YOUR PRIVATE INVITE CODE:', leftX, 428);

    if (recipient.inviteCode) {
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(127, 37, 64);
      pdf.text(safePdfText(recipient.inviteCode), leftX, 442);
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(120, 110, 105);
    pdf.text(safePdfText(displayUrl(invitationUrl)), leftX, 456);

    pdf.setFont('times', 'italic');
    pdf.setFontSize(7.5);
    pdf.setTextColor(156, 51, 83);
    pdf.text('Scan the QR code to RSVP directly on our website.', leftX, 470);
  } else {
    // Save the date bottom
    const qrSize = 64;
    const qrX = PDF_WIDTH - 36 - qrSize;
    const qrY = 394;
    drawQr(pdf, invitationUrl, qrX, qrY, qrSize);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(156, 51, 83);
    pdf.text('SCAN TO VISIT', qrX + qrSize / 2, qrY + qrSize + 8.5, { align: 'center' });

    const leftX = 36;
    pdf.setTextColor(156, 51, 83);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('VISIT OUR WEDDING WEBSITE', leftX, 410);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(120, 110, 105);
    pdf.text(safePdfText(displayUrl(invitationUrl)), leftX, 424);

    if (recipient.inviteCode) {
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(127, 37, 64);
      pdf.text(safePdfText(`YOUR CODE: ${recipient.inviteCode}`), leftX, 440);
    }

    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(156, 51, 83);
    pdf.text('Scan the QR code to visit our website & save the date.', leftX, 458);
  }

  return pdf;
};

export const createInvitationPdfBlob = (
  config: InvitationConfig,
  recipient: InvitationRecipient,
  variant: InvitationVariant = 'official',
): Promise<Blob> => createInvitationPdf(config, recipient, variant).then(pdf => pdf.output('blob'));

export const downloadInvitationPdf = (
  config: InvitationConfig,
  recipient: InvitationRecipient,
  variant: InvitationVariant = 'official',
): Promise<void> => createInvitationPdf(config, recipient, variant)
  .then(pdf => {
    pdf.save(invitationFilename(config, recipient, variant));
  });

export const downloadAllInvitationsZip = async (
  config: InvitationConfig,
  recipients: InvitationRecipient[],
  variant: InvitationVariant = 'official',
): Promise<void> => {
  const zip = new JSZip();
  const folder = zip.folder(variant === 'save-the-date' ? 'Save_The_Date_PDFs' : 'Wedding_Invitation_PDFs') || zip;

  for (const recipient of recipients) {
    const blob = await createInvitationPdfBlob(config, recipient, variant);
    const filename = invitationFilename(config, recipient, variant);
    folder.file(filename, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const couple = `${config.groomShortName || config.groomName}_${config.brideShortName || config.brideName}`;
  anchor.download = `${couple}_${variant === 'save-the-date' ? 'Save_the_Dates' : 'Invitations'}_PDFs.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const sendOrShareWhatsAppWithPdf = async (
  config: InvitationConfig,
  recipient: InvitationRecipient,
  variant: InvitationVariant = 'official',
): Promise<{ method: 'native-share' | 'download-and-open' }> => {
  const blob = await createInvitationPdfBlob(config, recipient, variant);
  const filename = invitationFilename(config, recipient, variant);
  const file = new File([blob], filename, { type: 'application/pdf' });
  const { message, subject } = buildInvitationMessage(config, recipient, variant);

  // Try native mobile share if supported
  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: subject,
        text: message,
        files: [file],
      });
      return { method: 'native-share' };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { method: 'native-share' };
      }
    }
  }

  // Desktop / standard browser: auto-download PDF & open WhatsApp
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  // Open WhatsApp in new tab
  const waUrl = buildWhatsAppInvitationUrl(config, recipient, variant);
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  return { method: 'download-and-open' };
};

export const buildInvitationMessage = (
  config: InvitationConfig,
  recipient: InvitationRecipient,
  variant: InvitationVariant,
): { subject: string; message: string; url: string } => {
  const url = buildInvitationUrl(recipient, config.websiteUrl || config.siteUrl);
  const couple = `${config.groomShortName || config.groomName} & ${config.brideShortName || config.brideName}`;
  const venueName = config.ceremonyVenue?.name &&
    config.ceremonyVenue.name !== 'ArendsRus Country Lodge' &&
    config.ceremonyVenue.name !== 'Venue to follow'
    ? config.ceremonyVenue.name
    : 'Arendsrus';
  const venueTime = config.ceremonyVenue?.time &&
    config.ceremonyVenue.time.toLowerCase() !== 'to be confirmed'
    ? config.ceremonyVenue.time
    : '15:00';

  const subject = variant === 'save-the-date'
    ? `Save the date — ${couple}`
    : `Your wedding invitation — ${couple}`;
  const message = variant === 'save-the-date'
    ? `Dear ${recipient.name},\n\nPlease save the date for our wedding on ${formatDate(config.weddingDate)}! ✨\n\nFormal invitation to follow. Visit our wedding website: ${url}\n\nWith love,\n${couple}`
    : `Dear ${recipient.name},\n\nWe would love for you to celebrate our wedding with us on ${formatDate(config.weddingDate)} at ${venueTime} at ${venueName}! 💍✨\n\nPlease view your personal invitation and RSVP on our website: ${url}\n\nWith love,\n${couple}`;
  return { subject, message, url };
};

export const formatWhatsAppNumber = (phone?: string): string => {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0') && clean.length === 10) {
    clean = '27' + clean.slice(1);
  }
  return clean;
};

export const buildWhatsAppInvitationUrl = (
  config: InvitationConfig,
  recipient: InvitationRecipient,
  variant: InvitationVariant = 'official',
): string => {
  const { message } = buildInvitationMessage(config, recipient, variant);
  const cleanPhone = formatWhatsAppNumber(recipient.phone);
  const encoded = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
};

export const readDryRunDeliveryHistory = (): DryRunDelivery[] => {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(DRY_RUN_HISTORY_KEY);
    return value ? JSON.parse(value) as DryRunDelivery[] : [];
  } catch {
    return [];
  }
};

/** Records a delivery simulation only. It never contacts an email or messaging provider. */
export const dispatchInvitationDryRun = async (
  delivery: Omit<DryRunDelivery, 'id' | 'status' | 'sentAt'>,
): Promise<DryRunDelivery> => {
  const record: DryRunDelivery = {
    ...delivery,
    id: `delivery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'simulated',
    sentAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    const history = [record, ...readDryRunDeliveryHistory()].slice(0, 500);
    window.localStorage.setItem(DRY_RUN_HISTORY_KEY, JSON.stringify(history));
  }
  return record;
};
