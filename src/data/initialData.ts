import type {
  Accommodation,
  BridalPartyMember,
  FAQ,
  GalleryItem,
  Guest,
  GuestWish,
  InvitationDelivery,
  InvitationTemplate,
  RegistryItem,
  ScheduleEvent,
  StoryMilestone,
  WeddingConfig,
  WeddingService,
} from '../types/wedding';

/**
 * Only confirmed facts are present in the fallback data. All editable content
 * starts empty so a fresh browser cannot accidentally publish sample copy,
 * contact details, payment information, guest PII, or unconfirmed logistics.
 */
export const initialConfig: WeddingConfig = {
  brideName: 'Abby',
  brideShortName: 'Abby',
  groomName: 'Cameron Nel',
  groomShortName: 'Cam',
  weddingDate: '2027-01-04',
  timezone: 'Africa/Johannesburg',
  rsvpDeadline: '',
  contactEmail: '',
  siteUrl: 'https://cameronnel.github.io/camandabbywedding/',
  tbcFields: {
    weddingDate: false,
    rsvpDeadline: true,
    ceremonyVenue: true,
    receptionVenue: true,
    dressCode: true,
  },
  tagline: '',
  hashtag: '',
  quote: '',
  quoteAuthor: '',
  ceremonyVenue: {
    name: 'ArendsRus Country Lodge',
    address: 'Koesterbos Road, Geelhoutboom',
    city: 'George, Western Cape, South Africa',
    time: 'To be confirmed',
    mapUrl: 'https://maps.google.com/?q=ArendsRus+Country+Lodge+George+South+Africa',
    description: '',
  },
  receptionVenue: {
    name: 'ArendsRus Country Lodge',
    address: 'Koesterbos Road, Geelhoutboom',
    city: 'George, Western Cape, South Africa',
    time: 'To be confirmed',
    mapUrl: 'https://maps.google.com/?q=ArendsRus+Country+Lodge+George+South+Africa',
    description: '',
  },
  dressCode: {
    title: '',
    description: '',
    palette: [],
  },
  adminPin: '6385',
  mealOptions: [],
};

export const initialGuests: Guest[] = [];
export const initialStory: StoryMilestone[] = [];
export const initialSchedule: ScheduleEvent[] = [];
export const initialAccommodations: Accommodation[] = [];
export const initialServices: WeddingService[] = [];
export const initialFaqs: FAQ[] = [];
export const initialRegistry: RegistryItem[] = [];
export const initialBridalParty: BridalPartyMember[] = [];
export const initialWishes: GuestWish[] = [];
export const initialGallery: GalleryItem[] = [
  {
    id: 'bundled-couple',
    storagePath: 'bundled/images/couple.jpg',
    src: `${import.meta.env.BASE_URL}images/couple.jpg`,
    category: 'couple',
    title: 'Cam & Abby',
    altText: 'Cam and Abby',
    published: true,
    sortOrder: 0,
  },
  {
    id: 'bundled-arendsrus-hero',
    storagePath: 'bundled/images/hero-arendsrus.jpg',
    src: `${import.meta.env.BASE_URL}images/hero-arendsrus.jpg`,
    category: 'venue',
    title: 'ArendsRus Country Lodge',
    altText: 'ArendsRus Country Lodge',
    published: true,
    sortOrder: 1,
  },
  {
    id: 'bundled-arendsrus-venue',
    storagePath: 'bundled/images/venue.jpg',
    src: `${import.meta.env.BASE_URL}images/venue.jpg`,
    category: 'venue',
    title: 'ArendsRus Country Lodge',
    altText: 'ArendsRus Country Lodge venue',
    published: true,
    sortOrder: 2,
  },
  {
    id: 'bundled-arendsrus-chapel',
    storagePath: 'bundled/images/chapel.jpg',
    src: `${import.meta.env.BASE_URL}images/chapel.jpg`,
    category: 'venue',
    title: 'ArendsRus Country Lodge',
    altText: 'ArendsRus Country Lodge ceremony area',
    published: true,
    sortOrder: 3,
  },
];

export const initialInvitationTemplates: InvitationTemplate[] = [
  {
    id: 'save-the-date',
    kind: 'save_the_date',
    name: 'Save the date',
    subject: '',
    heading: '',
    body: '',
    design: {},
    isActive: true,
  },
  {
    id: 'official-invitation',
    kind: 'official_invitation',
    name: 'Official invitation',
    subject: '',
    heading: '',
    body: '',
    design: {},
    isActive: true,
  },
];

export const initialInvitationDeliveries: InvitationDelivery[] = [];
