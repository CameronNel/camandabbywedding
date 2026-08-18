import type { WeddingConfig, Guest, GuestWish } from '../types/wedding';
import { initialConfig, initialGuests, initialWishes } from '../data/initialData';

const CONFIG_KEY = 'wedding_app_config_v2_arendsrus';
const GUESTS_KEY = 'wedding_app_guests_v2_arendsrus';
const WISHES_KEY = 'wedding_app_wishes_v2_arendsrus';

export function loadConfig(): WeddingConfig {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return JSON.parse(saved);
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

// Generate an ICS calendar file download
export function generateIcsFile(config: WeddingConfig): void {
  const startDate = new Date(config.weddingDate);
  const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000); // 8 hours duration

  const formatIcsDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sophia & Alexander//Wedding RSVP//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:Wedding Celebration: ${config.brideShortName} & ${config.groomShortName}`,
    `DESCRIPTION:${config.tagline}\\n\\nCeremony: ${config.ceremonyVenue.name}\\nReception: ${config.receptionVenue.name}\\nDress Code: ${config.dressCode.title}`,
    `LOCATION:${config.ceremonyVenue.name}, ${config.ceremonyVenue.address}, ${config.ceremonyVenue.city}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Wedding Tomorrow!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${config.brideShortName}_and_${config.groomShortName}_Wedding.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate Google Calendar Link
export function getGoogleCalendarUrl(config: WeddingConfig): string {
  const startDate = new Date(config.weddingDate);
  const endDate = new Date(startDate.getTime() + 8 * 60 * 60 * 1000);

  const formatGCalDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const title = encodeURIComponent(`Wedding of ${config.brideShortName} & ${config.groomShortName}`);
  const details = encodeURIComponent(`${config.tagline}\n\nDress Code: ${config.dressCode.title}\nCeremony: ${config.ceremonyVenue.name}\nReception: ${config.receptionVenue.name}`);
  const location = encodeURIComponent(`${config.ceremonyVenue.name}, ${config.ceremonyVenue.address}, ${config.ceremonyVenue.city}`);
  const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

// Export guests to CSV
export function exportGuestsToCsv(guests: Guest[], config: WeddingConfig): void {
  const headers = [
    'Guest ID',
    'Full Name',
    'Email',
    'Phone',
    'Invite Code',
    'RSVP Status',
    'Party Size Max',
    'Attending Count',
    'Companion Names',
    'Meal Selection',
    'Dietary Restrictions',
    'Dietary Notes',
    'Song Request',
    'Table Assignment',
    'Response Date',
    'Guest Message'
  ];

  const rows = guests.map(g => [
    `"${g.id}"`,
    `"${(g.name || '').replace(/"/g, '""')}"`,
    `"${(g.email || '').replace(/"/g, '""')}"`,
    `"${(g.phone || '').replace(/"/g, '""')}"`,
    `"${g.inviteCode}"`,
    `"${g.rsvpStatus.toUpperCase()}"`,
    g.partySize,
    g.attendingCount,
    `"${(g.companionNames || []).join(', ').replace(/"/g, '""')}"`,
    `"${(g.mealSelection || 'None').replace(/"/g, '""')}"`,
    `"${(g.dietaryRestrictions || []).join(', ').replace(/"/g, '""')}"`,
    `"${(g.dietaryDetails || '').replace(/"/g, '""')}"`,
    `"${(g.songRequest || '').replace(/"/g, '""')}"`,
    `"${(g.tableNumber || 'Unassigned').replace(/"/g, '""')}"`,
    `"${g.respondedAt ? new Date(g.respondedAt).toLocaleDateString() : 'Pending'}"`,
    `"${(g.message || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${config.brideShortName}_${config.groomShortName}_Guest_RSVP_List.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
