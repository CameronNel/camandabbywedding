export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  inviteCode: string;
  rsvpStatus: 'attending' | 'declined' | 'pending';
  partySize: number; // Max allowed
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
}

export interface StoryMilestone {
  year: string;
  title: string;
  description: string;
  location?: string;
}

export interface ScheduleEvent {
  time: string;
  title: string;
  location: string;
  description: string;
  icon: string;
  dressCode?: string;
}

export interface Accommodation {
  name: string;
  address: string;
  phone: string;
  bookingCode: string;
  distance: string;
  link: string;
  rate: string;
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
}

export interface WeddingConfig {
  brideName: string;
  brideShortName: string;
  groomName: string;
  groomShortName: string;
  weddingDate: string; // ISO date string
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
  adminPin: string;
  mealOptions: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    tags: string[];
  }>;
}
