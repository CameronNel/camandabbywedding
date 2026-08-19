export type RsvpStatus = 'attending' | 'declined' | 'pending';

export type GuestTag = 'free_venue_housing' | 'presence_is_our_gift';
export type DataMode = 'supabase' | 'local';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface AdminSession {
  userId: string;
  email: string;
  accessToken?: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  name: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  isInvited: boolean;
  attending: boolean | null;
  mealSelection?: string;
  dietaryRestrictions: string[];
  dietaryDetails?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HouseholdMemberRsvp {
  id?: string;
  name: string;
  attending: boolean;
  email?: string;
  phone?: string;
  mealSelection?: string;
  dietaryRestrictions?: string[];
  dietaryDetails?: string;
}

/**
 * Compatibility model used by the existing guest-management UI. A Guest is
 * one invitation/household; individual invitees live in `members`.
 */
export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  inviteCode: string;
  rsvpStatus: RsvpStatus;
  partySize: number;
  attendingCount: number;
  dietaryRestrictions: string[];
  dietaryDetails?: string;
  mealSelection?: string;
  songRequest?: string;
  message?: string;
  tableNumber?: string;
  isPlusOneAllowed: boolean;
  companionNames?: string[];
  respondedAt?: string;
  checkedIn?: boolean;
  tags?: GuestTag[];
  members?: HouseholdMember[];
  invitationUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HouseholdInvitation extends Guest {
  tags: GuestTag[];
  members: HouseholdMember[];
}

export interface HouseholdDraft {
  name: string;
  email?: string;
  phone?: string;
  partySize?: number;
  tableNumber?: string;
  isPlusOneAllowed?: boolean;
  tags?: GuestTag[];
  members?: Array<Partial<HouseholdMember> & Pick<HouseholdMember, 'name'>>;
}

export interface HouseholdRsvpInput {
  rsvpStatus: Exclude<RsvpStatus, 'pending'>;
  email?: string;
  phone?: string;
  attendingCount: number;
  members: HouseholdMemberRsvp[];
  dietaryRestrictions?: string[];
  dietaryDetails?: string;
  mealSelection?: string;
  songRequest?: string;
  message?: string;
}

export interface StoryMilestone {
  year: string;
  title: string;
  description: string;
  location?: string;
}

export interface ScheduleEvent {
  id?: string;
  time: string;
  title: string;
  location: string;
  description: string;
  icon: string;
  dressCode?: string;
  sortOrder?: number;
}

export type ContentVisibility = 'general' | 'free_venue_housing' | 'all';

export interface Accommodation {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email?: string;
  bookingCode: string;
  distance: string;
  link: string;
  rate: string;
  priceAmount?: number;
  currency: string;
  priceUnit: string;
  visibility: ContentVisibility;
  isVenueHousing: boolean;
  published: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeddingService {
  id: string;
  category: string;
  name: string;
  description?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  link?: string;
  priceAmount?: number;
  currency: string;
  priceUnit: string;
  visibility: ContentVisibility;
  published: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryItem {
  id: string;
  storagePath: string;
  src: string;
  category: string;
  title: string;
  subtitle?: string;
  altText: string;
  published: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Ceremony & Reception' | 'Travel & Stay' | 'Gifts';
}

export interface RegistryItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  type: 'honeymoon' | 'registry' | 'cash';
  icon: string;
  goalAmount?: number;
  currentAmount?: number;
  accountDetails?: string;
  published?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BridalPartyMember {
  id: string;
  name: string;
  role: string;
  relation: string;
  bio: string;
  image?: string;
}

export interface GuestWish {
  id: string;
  name: string;
  message: string;
  date: string;
  likes?: number;
  approved?: boolean;
}

export type InvitationTemplateKind = 'save_the_date' | 'official_invitation';
export type InvitationChannel = 'email' | 'sms' | 'whatsapp';
export type InvitationDeliveryStatus = 'draft' | 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';

export interface InvitationTemplate {
  id: string;
  kind: InvitationTemplateKind;
  name: string;
  subject: string;
  heading: string;
  body: string;
  emailHtml?: string;
  design: Record<string, unknown>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvitationDelivery {
  id: string;
  householdId: string;
  templateId: string;
  channel: InvitationChannel;
  recipient: string;
  status: InvitationDeliveryStatus;
  attemptNumber: number;
  providerMessageId?: string;
  errorMessage?: string;
  pdfPath?: string;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SendInvitationRequest {
  householdIds: string[];
  templateId: string;
  channels: InvitationChannel[];
  dryRun?: boolean;
  /** Stable for one deliberate send action so a network retry cannot duplicate it. */
  requestKey?: string;
}

export interface InvitationSendItemResult {
  householdId: string;
  channel: InvitationChannel;
  recipient?: string;
  status: 'preview' | 'sent' | 'failed' | 'skipped';
  invitationUrl: string;
  providerMessageId?: string;
  error?: string;
}

export interface SendInvitationResult {
  ok: boolean;
  dryRun: boolean;
  results: InvitationSendItemResult[];
  error?: string;
}

export interface WeddingConfig {
  brideName: string;
  brideShortName: string;
  groomName: string;
  groomShortName: string;
  weddingDate: string;
  timezone: string;
  rsvpDeadline: string;
  contactEmail: string;
  siteUrl: string;
  tbcFields: Partial<Record<
    'weddingDate' | 'rsvpDeadline' | 'ceremonyVenue' | 'receptionVenue' | 'dressCode',
    boolean
  >>;
  tagline: string;
  hashtag: string;
  quote: string;
  quoteAuthor: string;
  ceremonyVenue: {
    name: string;
    address: string;
    city: string;
    time: string;
    mapUrl: string;
    description: string;
  };
  receptionVenue: {
    name: string;
    address: string;
    city: string;
    time: string;
    mapUrl: string;
    description: string;
  };
  dressCode: {
    title: string;
    description: string;
    palette: string[];
  };
  /** Local-development fallback only. Production access uses Supabase Auth. */
  adminPin: string;
  mealOptions: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    tags: string[];
  }>;
}
