import type { WeddingConfig, Guest, GuestWish, RegistryItem, ScheduleEvent, Accommodation } from '../types/wedding';
import { initialConfig, initialGuests, initialWishes, initialRegistry, initialSchedule, initialAccommodations } from '../data/initialData';

const CONFIG_KEY = 'wedding_app_config_v5_camabby_real';
const GUESTS_KEY = 'wedding_app_guests_v5_camabby_real';
const WISHES_KEY = 'wedding_app_wishes_v5_camabby_real';
const REGISTRY_KEY = 'wedding_app_registry_v5_camabby_real';
const SCHEDULE_KEY = 'wedding_app_schedule_v5_camabby_real';
const ACCOMMODATIONS_KEY = 'wedding_app_accommodations_v5_camabby_real';

export function loadConfig(): WeddingConfig {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate old date if cached
      if (parsed.weddingDate && parsed.weddingDate.includes('2027-06-19')) {
        parsed.weddingDate = '2027-01-04T15:30:00';
        saveConfig(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load config from storage', e);
  }
  return initialConfig;
}

export function saveConfig(config: WeddingConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

export function loadGuests(): Guest[] {
  try {
    const saved = localStorage.getItem(GUESTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load guests from storage', e);
  }
  return initialGuests;
}

export function saveGuests(guests: Guest[]): void {
  try {
    localStorage.setItem(GUESTS_KEY, JSON.stringify(guests));
  } catch (e) {
    console.error('Failed to save guests', e);
  }
}

export function loadWishes(): GuestWish[] {
  try {
    const saved = localStorage.getItem(WISHES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load wishes from storage', e);
  }
  return initialWishes;
}

export function saveWishes(wishes: GuestWish[]): void {
  try {
    localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
  } catch (e) {
    console.error('Failed to save wishes', e);
  }
}

export function loadRegistry(): RegistryItem[] {
  try {
    const saved = localStorage.getItem(REGISTRY_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load registry from storage', e);
  }
  return initialRegistry;
}

export function saveRegistry(items: RegistryItem[]): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save registry', e);
  }
}

export function loadSchedule(): ScheduleEvent[] {
  try {
    const saved = localStorage.getItem(SCHEDULE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load schedule from storage', e);
  }
  return initialSchedule;
}

export function saveSchedule(events: ScheduleEvent[]): void {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save schedule', e);
  }
}

export function loadAccommodations(): Accommodation[] {
  try {
    const saved = localStorage.getItem(ACCOMMODATIONS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load accommodations from storage', e);
  }
  return initialAccommodations;
}

export function saveAccommodations(accommodations: Accommodation[]): void {
  try {
    localStorage.setItem(ACCOMMODATIONS_KEY, JSON.stringify(accommodations));
  } catch (e) {
    console.error('Failed to save accommodations', e);
  }
}

// Reset everything to factory defaults
export function resetAppToFactoryDefaults(): void {
  try {
    const keysToRemove = [
      CONFIG_KEY,
      GUESTS_KEY,
      WISHES_KEY,
      REGISTRY_KEY,
      SCHEDULE_KEY,
      ACCOMMODATIONS_KEY,
      'wedding_app_config_v1',
      'wedding_app_guests_v1',
      'wedding_app_wishes_v1',
      'wedding_app_config_v2_arendsrus',
      'wedding_app_guests_v2_arendsrus',
      'wedding_app_wishes_v2_arendsrus',
      'wedding_app_config_v3_camabby',
      'wedding_app_guests_v3_camabby',
      'wedding_app_wishes_v3_camabby',
      'wedding_app_registry_v3_camabby',
      'wedding_app_schedule_v3_camabby',
      'wedding_app_accommodations_v3_camabby'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  } catch (e) {
    console.error('Failed to reset app', e);
  }
}

export function exportGuestsToCsv(guests: Guest[]): void {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Invite Code',
    'RSVP Status',
    'Max Party Size',
    'Attending Count',
    'Dietary Restrictions',
    'Dietary Details',
    'Meal Selection',
    'Companion Names',
    'Song Request',
    'Table Number',
    'Message',
    'Checked In',
    'Responded At'
  ];

  const rows = guests.map(g => [
    `"${(g.name || '').replace(/"/g, '""')}"`,
    `"${(g.email || '').replace(/"/g, '""')}"`,
    `"${(g.phone || '').replace(/"/g, '""')}"`,
    `"${(g.inviteCode || '').replace(/"/g, '""')}"`,
    `"${(g.rsvpStatus || '').replace(/"/g, '""')}"`,
    g.partySize || 1,
    g.attendingCount || 0,
    `"${(g.dietaryRestrictions || []).join('; ').replace(/"/g, '""')}"`,
    `"${(g.dietaryDetails || '').replace(/"/g, '""')}"`,
    `"${(g.mealSelection || '').replace(/"/g, '""')}"`,
    `"${(g.companionNames || []).join('; ').replace(/"/g, '""')}"`,
    `"${(g.songRequest || '').replace(/"/g, '""')}"`,
    `"${(g.tableNumber || '').replace(/"/g, '""')}"`,
    `"${(g.message || '').replace(/"/g, '""')}"`,
    g.checkedIn ? 'Yes' : 'No',
    g.respondedAt ? `"${g.respondedAt}"` : '""'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Cam_and_Abby_Wedding_Guest_List_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getGoogleCalendarUrl(config: WeddingConfig): string {
  const startDate = new Date(config.weddingDate);
  const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000); // 8 hour event

  const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const title = encodeURIComponent(`${config.brideShortName} & ${config.groomShortName}'s Wedding`);
  const details = encodeURIComponent(
    `We can't wait to celebrate our wedding with you at ${config.ceremonyVenue.name}!\n\nDetails: https://cameronnel.github.io/camandabbywedding`
  );
  const location = encodeURIComponent(`${config.ceremonyVenue.name}, ${config.ceremonyVenue.address}, ${config.ceremonyVenue.city}`);
  const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function generateIcsFile(config: WeddingConfig): void {
  const startDate = new Date(config.weddingDate);
  const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);

  const formatIcsDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const icsString = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cam and Abby Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `UID:wedding-${startDate.getTime()}@camandabbywedding`,
    `SUMMARY:${config.brideShortName} & ${config.groomShortName}'s Wedding`,
    `DESCRIPTION:Join us for the wedding of ${config.brideName} and ${config.groomName} at ${config.ceremonyVenue.name}.`,
    `LOCATION:${config.ceremonyVenue.name}, ${config.ceremonyVenue.address}, ${config.ceremonyVenue.city}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${config.brideShortName}_and_${config.groomShortName}_Wedding.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
