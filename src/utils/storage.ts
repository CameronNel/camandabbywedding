import type {
  Accommodation,
  GalleryItem,
  Guest,
  GuestWish,
  InvitationDelivery,
  InvitationTemplate,
  RegistryItem,
  ScheduleEvent,
  WeddingConfig,
  WeddingService,
} from '../types/wedding';
import {
  initialAccommodations,
  initialConfig,
  initialGallery,
  initialGuests,
  initialInvitationDeliveries,
  initialInvitationTemplates,
  initialRegistry,
  initialSchedule,
  initialServices,
  initialWishes,
} from '../data/initialData';

const STORAGE_PREFIX = 'cam_abby_wedding_v9';

const STORAGE_KEYS = {
  config: `${STORAGE_PREFIX}_config`,
  guests: `${STORAGE_PREFIX}_households`,
  wishes: `${STORAGE_PREFIX}_wishes`,
  registry: `${STORAGE_PREFIX}_registry`,
  schedule: `${STORAGE_PREFIX}_schedule`,
  accommodations: `${STORAGE_PREFIX}_accommodations`,
  services: `${STORAGE_PREFIX}_services`,
  gallery: `${STORAGE_PREFIX}_gallery`,
  invitationTemplates: `${STORAGE_PREFIX}_invitation_templates`,
  invitationDeliveries: `${STORAGE_PREFIX}_invitation_deliveries`,
} as const;

const LEGACY_PREFIXES = [
  'wedding_app_',
  'cam_abby_wedding_v7',
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return clone(fallback);
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : clone(fallback);
  } catch (error) {
    console.error(`Failed to load ${key} from local storage`, error);
    return clone(fallback);
  }
}

function safeSave<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to local storage`, error);
  }
}

export function loadConfig(): WeddingConfig {
  const saved = safeLoad<Partial<WeddingConfig>>(STORAGE_KEYS.config, {});
  if (saved.weddingDate === '2027-01-04') {
    saved.weddingDate = '2027-08-01';
  }
  return {
    ...initialConfig,
    ...saved,
    ceremonyVenue: { ...initialConfig.ceremonyVenue, ...saved.ceremonyVenue },
    receptionVenue: { ...initialConfig.receptionVenue, ...saved.receptionVenue },
    dressCode: { ...initialConfig.dressCode, ...saved.dressCode },
    adminPin: '6385',
  };
}

export function saveConfig(config: WeddingConfig): void {
  safeSave(STORAGE_KEYS.config, { ...config, adminPin: '6385' });
}

export const loadGuests = (): Guest[] => {
  const saved = safeLoad<Guest[]>(STORAGE_KEYS.guests, initialGuests);
  const missingInitial = initialGuests.filter(
    (init) => !saved.some((s) => s.inviteCode.toLowerCase() === init.inviteCode.toLowerCase())
  );
  return missingInitial.length > 0 ? [...saved, ...missingInitial] : saved;
};
export const saveGuests = (guests: Guest[]): void => safeSave(STORAGE_KEYS.guests, guests);

export const loadWishes = (): GuestWish[] => safeLoad(STORAGE_KEYS.wishes, initialWishes);
export const saveWishes = (wishes: GuestWish[]): void => safeSave(STORAGE_KEYS.wishes, wishes);

export const loadRegistry = (): RegistryItem[] => safeLoad(STORAGE_KEYS.registry, initialRegistry);
export const saveRegistry = (items: RegistryItem[]): void => safeSave(STORAGE_KEYS.registry, items);

export const loadSchedule = (): ScheduleEvent[] => safeLoad(STORAGE_KEYS.schedule, initialSchedule);
export const saveSchedule = (events: ScheduleEvent[]): void => safeSave(STORAGE_KEYS.schedule, events);

export const loadAccommodations = (): Accommodation[] => safeLoad(STORAGE_KEYS.accommodations, initialAccommodations);
export const saveAccommodations = (items: Accommodation[]): void => safeSave(STORAGE_KEYS.accommodations, items);

export const loadServices = (): WeddingService[] => safeLoad(STORAGE_KEYS.services, initialServices);
export const saveServices = (items: WeddingService[]): void => safeSave(STORAGE_KEYS.services, items);

export const loadGallery = (): GalleryItem[] => safeLoad(STORAGE_KEYS.gallery, initialGallery);
export const saveGallery = (items: GalleryItem[]): void => safeSave(STORAGE_KEYS.gallery, items);

export const loadInvitationTemplates = (): InvitationTemplate[] => {
  const templates = safeLoad(STORAGE_KEYS.invitationTemplates, initialInvitationTemplates);
  return templates.map(t => {
    if (t.body?.includes('4 January 2027')) {
      return {
        ...t,
        subject: t.subject?.replace('4 January 2027', '1 August 2027') ?? t.subject,
        body: t.body
          .replace('Monday, 4 January 2027', 'Sunday, 1 August 2027')
          .replace('4 January 2027', '1 August 2027')
          .replace('Monday, the fourth of January, twenty twenty-seven', 'Sunday, the first of August, twenty twenty-seven'),
      };
    }
    return t;
  });
};
export const saveInvitationTemplates = (items: InvitationTemplate[]): void =>
  safeSave(STORAGE_KEYS.invitationTemplates, items);

export const loadInvitationDeliveries = (): InvitationDelivery[] =>
  safeLoad(STORAGE_KEYS.invitationDeliveries, initialInvitationDeliveries);
export const saveInvitationDeliveries = (items: InvitationDelivery[]): void =>
  safeSave(STORAGE_KEYS.invitationDeliveries, items);

export function resetAppToFactoryDefaults(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of Object.values(STORAGE_KEYS)) window.localStorage.removeItem(key);
    for (const key of Object.keys(window.localStorage)) {
      if (LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        window.localStorage.removeItem(key);
      }
    }
    window.sessionStorage.removeItem('wedding_admin_auth');
    window.location.reload();
  } catch (error) {
    console.error('Failed to reset local wedding data', error);
  }
}

export function createSecureInviteCode(): string {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `CA-${token}`;
}

export function buildInvitationUrl(config: WeddingConfig, inviteCode: string): string {
  const fallback = typeof window === 'undefined' ? initialConfig.siteUrl : window.location.href;
  const url = new URL(config.siteUrl || fallback);
  url.search = '';
  url.hash = 'rsvp';
  url.searchParams.set('invite', inviteCode);
  return url.toString();
}

export function exportGuestsToCsv(guests: Guest[]): void {
  const headers = [
    'Household',
    'Email',
    'Phone',
    'Invite Code',
    'Tags',
    'RSVP Status',
    'Max Party Size',
    'Attending Count',
    'Members',
    'Dietary Restrictions',
    'Dietary Details',
    'Meal Selection',
    'Song Request',
    'Table Number',
    'Message',
    'Checked In',
    'Responded At',
  ];

  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = guests.map((guest) => [
    escape(guest.name),
    escape(guest.email),
    escape(guest.phone),
    escape(guest.inviteCode),
    escape(guest.tags?.join('; ')),
    escape(guest.rsvpStatus),
    guest.partySize || 1,
    guest.attendingCount || 0,
    escape(guest.members?.map((member) => member.name).join('; ') || guest.companionNames?.join('; ')),
    escape(guest.dietaryRestrictions?.join('; ')),
    escape(guest.dietaryDetails),
    escape(guest.mealSelection),
    escape(guest.songRequest),
    escape(guest.tableNumber),
    escape(guest.message),
    guest.checkedIn ? 'Yes' : 'No',
    escape(guest.respondedAt),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Cam_and_Abby_Wedding_Guest_List_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dateOnly(value: string): string {
  return value.slice(0, 10).replaceAll('-', '');
}

function nextDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function getGoogleCalendarUrl(config: WeddingConfig): string {
  const title = encodeURIComponent(`${config.groomShortName} & ${config.brideShortName}'s Wedding`);
  const details = encodeURIComponent(config.siteUrl ? `Details: ${config.siteUrl}` : '');
  const location = encodeURIComponent(
    [config.ceremonyVenue.name, config.ceremonyVenue.address, config.ceremonyVenue.city].filter(Boolean).join(', '),
  );
  const dates = `${dateOnly(config.weddingDate)}/${dateOnly(nextDate(config.weddingDate))}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function generateIcsFile(config: WeddingConfig): void {
  const weddingDay = dateOnly(config.weddingDate);
  const followingDay = dateOnly(nextDate(config.weddingDate));
  const escapeIcs = (value: string) => value.replaceAll('\\', '\\\\').replaceAll(',', '\\,').replaceAll(';', '\\;').replaceAll('\n', '\\n');
  const location = [config.ceremonyVenue.name, config.ceremonyVenue.address, config.ceremonyVenue.city]
    .filter(Boolean)
    .join(', ');
  const icsString = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cam and Abby Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${weddingDay}`,
    `DTEND;VALUE=DATE:${followingDay}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `UID:wedding-${weddingDay}@camandabbywedding`,
    `SUMMARY:${escapeIcs(`${config.groomShortName} & ${config.brideShortName}'s Wedding`)}`,
    `DESCRIPTION:${escapeIcs(config.siteUrl ? `Details: ${config.siteUrl}` : '')}`,
    `LOCATION:${escapeIcs(location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${config.brideShortName}_and_${config.groomShortName}_Wedding.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const compressImageForLocalPreview = async (
  file: File,
  maxDimension = 1920,
  targetQuality = 0.82,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image. Please ensure it is a valid JPG, PNG, or WebP.'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(String(reader.result));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL('image/webp', targetQuality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', targetQuality);
          }

          if (dataUrl.length > 800_000) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          }

          resolve(dataUrl);
        } catch {
          resolve(String(reader.result));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
};
