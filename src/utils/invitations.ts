import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
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

const drawBotanicalCorner = (pdf: jsPDF, x: number, y: number, mirrorX = 1, mirrorY = 1) => {
  pdf.setDrawColor(144, 117, 91);
  pdf.setLineWidth(0.45);
  pdf.line(x, y, x + mirrorX * 34, y + mirrorY * 42);
  pdf.line(x + mirrorX * 13, y + mirrorY * 16, x + mirrorX * 28, y + mirrorY * 12);
  pdf.line(x + mirrorX * 22, y + mirrorY * 28, x + mirrorX * 39, y + mirrorY * 27);
  pdf.setFillColor(235, 196, 201);
  pdf.circle(x + mirrorX * 29, y + mirrorY * 11, 4.6, 'F');
  pdf.setFillColor(218, 175, 181);
  pdf.circle(x + mirrorX * 39, y + mirrorY * 27, 3.5, 'F');
  pdf.setFillColor(174, 193, 166);
  pdf.ellipse(x + mirrorX * 17, y + mirrorY * 17, 5, 2.4, 'F');
  pdf.ellipse(x + mirrorX * 28, y + mirrorY * 34, 5, 2.4, 'F');
};

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

export const createInvitationPdf = async (
  config: InvitationConfig,
  recipient: InvitationRecipient,
  variant: InvitationVariant = 'official',
): Promise<jsPDF> => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PDF_WIDTH, PDF_HEIGHT], compress: true });
  const invitationUrl = buildInvitationUrl(recipient, config.websiteUrl || config.siteUrl);
  const centre = PDF_WIDTH / 2;

  pdf.setFillColor(252, 249, 245);
  pdf.rect(0, 0, PDF_WIDTH, PDF_HEIGHT, 'F');
  pdf.setDrawColor(184, 151, 92);
  pdf.setLineWidth(1.1);
  pdf.roundedRect(14, 14, PDF_WIDTH - 28, PDF_HEIGHT - 28, 8, 8, 'S');
  pdf.setDrawColor(226, 190, 198);
  pdf.setLineWidth(0.45);
  pdf.roundedRect(20, 20, PDF_WIDTH - 40, PDF_HEIGHT - 40, 6, 6, 'S');

  drawBotanicalCorner(pdf, 19, 19);
  drawBotanicalCorner(pdf, PDF_WIDTH - 19, 19, -1, 1);
  drawBotanicalCorner(pdf, 19, PDF_HEIGHT - 19, 1, -1);
  drawBotanicalCorner(pdf, PDF_WIDTH - 19, PDF_HEIGHT - 19, -1, -1);

  pdf.setFillColor(137, 48, 72);
  pdf.circle(centre, 50, 18, 'F');
  pdf.setDrawColor(204, 169, 92);
  pdf.setLineWidth(1);
  pdf.circle(centre, 50, 21, 'S');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  pdf.text('C & A', centre, 53.5, { align: 'center' });

  pdf.setTextColor(90, 72, 67);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setCharSpace(1.55);
  pdf.text(variant === 'save-the-date' ? 'PLEASE SAVE THE DATE' : 'TOGETHER WITH THEIR FAMILIES', centre, 84, { align: 'center' });
  pdf.setCharSpace(0);

  if (recipient.name) {
    pdf.setFillColor(252, 236, 239);
    pdf.roundedRect(centre - 74, 94, 148, 17, 8, 8, 'F');
    pdf.setTextColor(116, 37, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.7);
    pdf.text(safePdfText(`FOR ${recipient.name.toUpperCase()}`), centre, 105, { align: 'center', maxWidth: 135 });
  }

  const namesTop = variant === 'save-the-date' ? 145 : 139;
  pdf.setTextColor(49, 42, 39);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(25);
  pdf.text(safePdfText(config.brideName), centre, namesTop, { align: 'center' });
  pdf.setTextColor(145, 49, 77);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(17);
  pdf.text('&', centre, namesTop + 22, { align: 'center' });
  pdf.setTextColor(49, 42, 39);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(25);
  pdf.text(safePdfText(config.groomName), centre, namesTop + 49, { align: 'center' });

  pdf.setDrawColor(193, 156, 84);
  pdf.setLineWidth(0.6);
  pdf.line(centre - 44, namesTop + 67, centre + 44, namesTop + 67);

  if (variant === 'save-the-date') {
    pdf.setTextColor(91, 72, 65);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(17);
    pdf.text(safePdfText(formatDate(config.weddingDate, false).toUpperCase()), centre, 239, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setCharSpace(1.2);
    pdf.text('GEORGE, WESTERN CAPE', centre, 260, { align: 'center' });
    pdf.setCharSpace(0);
    pdf.setFont('times', 'italic');
    pdf.setFontSize(11);
    pdf.setTextColor(117, 91, 82);
    pdf.text(safePdfText(config.tagline || 'A beautiful celebration is on the horizon.'), centre, 293, { align: 'center', maxWidth: 255 });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(110, 91, 84);
    pdf.text('FORMAL INVITATION TO FOLLOW', centre, 326, { align: 'center' });
  } else {
    pdf.setFont('times', 'italic');
    pdf.setFontSize(10.5);
    pdf.setTextColor(100, 80, 74);
    pdf.text('request the pleasure of your company at their wedding', centre, 220, { align: 'center' });

    pdf.setFont('times', 'bold');
    pdf.setFontSize(13.5);
    pdf.setTextColor(69, 56, 51);
    pdf.text(safePdfText(formatDate(config.weddingDate)), centre, 247, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text(safePdfText(config.ceremonyVenue.time || ''), centre, 264, { align: 'center' });

    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(123, 39, 64);
    pdf.text(safePdfText(config.ceremonyVenue.name), centre, 291, { align: 'center', maxWidth: 255 });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(98, 83, 78);
    pdf.text(
      safePdfText([config.ceremonyVenue.address, config.ceremonyVenue.city].filter(Boolean).join(', ')),
      centre,
      306,
      { align: 'center', maxWidth: 250 },
    );
    if (config.receptionVenue?.name) {
      pdf.setFont('times', 'italic');
      pdf.setFontSize(9);
      pdf.text(safePdfText(`Celebration to follow at ${config.receptionVenue.name}`), centre, 327, { align: 'center', maxWidth: 260 });
    }
  }

  const qrSize = 70;
  const qrX = PDF_WIDTH - 48 - qrSize;
  const qrY = 374;
  drawQr(pdf, invitationUrl, qrX, qrY, qrSize);

  pdf.setTextColor(83, 68, 63);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.2);
  const footerX = 45;
  const footerWidth = qrX - footerX - 12;
  pdf.text(variant === 'save-the-date' ? 'DETAILS & UPDATES' : 'KINDLY RSVP ONLINE', footerX, 392);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.8);
  const urlLines = pdf.splitTextToSize(safePdfText(displayUrl(invitationUrl)), footerWidth);
  pdf.text(urlLines, footerX, 407);
  if (recipient.inviteCode) {
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(138, 45, 70);
    pdf.text(safePdfText(`INVITE CODE: ${recipient.inviteCode}`), footerX, 431);
  }
  if (variant === 'official') {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(94, 79, 74);
    const deadline = config.rsvpDeadline ? formatDate(config.rsvpDeadline, false) : 'the date shown online';
    pdf.text(safePdfText(`Please respond by ${deadline}`), footerX, 447);
    if (config.dressCode?.title) pdf.text(safePdfText(config.dressCode.title), footerX, 459, { maxWidth: footerWidth });
  } else {
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8.5);
    pdf.setTextColor(114, 90, 82);
    pdf.text('We cannot wait to celebrate with you.', footerX, 451, { maxWidth: footerWidth });
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(132, 118, 112);
  pdf.text('Scan the code for your private invitation and RSVP.', qrX + qrSize / 2, qrY + qrSize + 10, { align: 'center' });

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

export const buildInvitationMessage = (
  config: InvitationConfig,
  recipient: InvitationRecipient,
  variant: InvitationVariant,
): { subject: string; message: string; url: string } => {
  const url = buildInvitationUrl(recipient, config.websiteUrl || config.siteUrl);
  const couple = `${config.groomShortName || config.groomName} & ${config.brideShortName || config.brideName}`;
  const subject = variant === 'save-the-date'
    ? `Save the date — ${couple}`
    : `Your wedding invitation — ${couple}`;
  const message = variant === 'save-the-date'
    ? `Dear ${recipient.name},\n\nPlease save the date for our wedding on ${formatDate(config.weddingDate)} at ${config.ceremonyVenue.name}! ✨\n\nView details and reserve your spot: ${url}\n\nWith love,\n${couple}`
    : `Dear ${recipient.name},\n\nWe would love for you to celebrate our wedding with us on ${formatDate(config.weddingDate)} at ${config.ceremonyVenue.name}! 💍✨\n\nPlease view your personal invitation and RSVP here: ${url}\n\nWith love,\n${couple}`;
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
