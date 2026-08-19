import { useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import type {
  Accommodation,
  HouseholdInvitation,
  HouseholdRsvpInput,
  WeddingService,
} from '../types/wedding';

export type RsvpState = 'pending' | 'attending' | 'declined';

export interface HouseholdMemberView {
  id: string;
  name: string;
  attending: boolean;
}

export interface HouseholdView {
  id: string;
  name: string;
  inviteCode?: string;
  status: RsvpState;
  members: HouseholdMemberView[];
  maxGuests: number;
  email: string;
  phone: string;
  tags: string[];
  complimentaryVenueStay: boolean;
  presenceIsOurGift: boolean;
}

export interface ListingView {
  id: string;
  name: string;
  description: string;
  address: string;
  price: number;
  priceLabel: string;
  link: string;
  bookingCode: string;
  category: string;
  complimentary: boolean;
  visibility: string;
  isVenueHousing: boolean;
}

export interface GalleryItemView {
  id: string;
  src: string;
  alt: string;
  title: string;
  caption: string;
}

export interface RegistryItemView {
  id: string;
  title: string;
  description: string;
  link: string;
  accountDetails: string;
  type: string;
}

function normalizeHousehold(household: HouseholdInvitation | null): HouseholdView | null {
  if (!household) return null;
  const members = household.members.length
    ? household.members.map(member => ({
        id: member.id,
        name: member.name,
        attending: member.attending === true,
      }))
    : [{ id: household.id, name: household.name, attending: household.rsvpStatus === 'attending' }];

  return {
    id: household.id,
    name: household.name,
    inviteCode: household.inviteCode,
    status: household.rsvpStatus,
    members,
    maxGuests: Math.max(household.partySize, members.length, 1),
    email: household.email || '',
    phone: household.phone || '',
    tags: household.tags,
    complimentaryVenueStay: household.tags.includes('free_venue_housing'),
    presenceIsOurGift: household.tags.includes('presence_is_our_gift'),
  };
}

function accommodationListing(item: Accommodation): ListingView {
  const amount = item.priceAmount;
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    address: item.address,
    price: amount ?? Number.POSITIVE_INFINITY,
    priceLabel: item.rate || (amount === undefined
      ? 'Price on request'
      : amount === 0
        ? 'Complimentary'
        : `${item.currency === 'ZAR' ? 'R' : `${item.currency} `}${amount.toLocaleString('en-ZA')}${item.priceUnit ? ` / ${item.priceUnit}` : ''}`),
    link: item.link,
    bookingCode: item.bookingCode,
    category: 'Accommodation',
    complimentary: item.visibility === 'free_venue_housing' || amount === 0,
    visibility: item.visibility,
    isVenueHousing: item.isVenueHousing,
  };
}

function serviceListing(item: WeddingService): ListingView {
  const amount = item.priceAmount;
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    address: '',
    price: amount ?? Number.POSITIVE_INFINITY,
    priceLabel: amount === undefined
      ? 'Price on request'
      : amount === 0
        ? 'Complimentary'
        : `${item.currency === 'ZAR' ? 'R' : `${item.currency} `}${amount.toLocaleString('en-ZA')}${item.priceUnit ? ` / ${item.priceUnit}` : ''}`,
    link: item.link || '',
    bookingCode: '',
    category: item.category,
    complimentary: false,
    visibility: item.visibility,
    isVenueHousing: false,
  };
}

export function useGuestExperience() {
  const context = useWedding();
  const activeHousehold = useMemo(
    () => normalizeHousehold(context.activeHousehold),
    [context.activeHousehold],
  );

  const site = {
    brideName: context.siteConfig.brideShortName || context.siteConfig.brideName,
    groomName: context.siteConfig.groomShortName || context.siteConfig.groomName,
    weddingDate: context.siteConfig.weddingDate,
    dateIsTbc: Boolean(context.siteConfig.tbcFields?.weddingDate),
    venueName: context.siteConfig.ceremonyVenue.name,
    venueAddress: context.siteConfig.ceremonyVenue.address,
    venueCity: context.siteConfig.ceremonyVenue.city,
    mapUrl: context.siteConfig.ceremonyVenue.mapUrl,
    ceremonyTime: context.siteConfig.ceremonyVenue.time,
    ceremonyIsTbc: Boolean(context.siteConfig.tbcFields?.ceremonyVenue),
    receptionTime: context.siteConfig.receptionVenue.time,
    receptionIsTbc: Boolean(context.siteConfig.tbcFields?.receptionVenue),
  };

  const accommodations = context.accommodations
    .filter(item => item.published)
    .map(accommodationListing);
  const services = context.services
    .filter(item => item.published)
    .map(serviceListing);
  const publishedGallery = context.galleryItems
    .filter(item => item.published)
    .map(item => ({
      id: item.id,
      src: item.src,
      alt: item.altText || item.title,
      title: item.title,
      caption: item.subtitle || '',
    }));
  const registryItems = context.registryItems
    .filter(item => item.published !== false)
    .map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      link: item.link || '',
      accountDetails: item.accountDetails || '',
      type: item.type,
    }));

  const lookupInvitation = async (code: string): Promise<HouseholdView | null> =>
    normalizeHousehold(await context.lookupInvitation(code));

  const submitHouseholdRsvp = async (_householdId: string, payload: HouseholdRsvpInput): Promise<boolean> =>
    context.submitHouseholdRsvp(payload);

  return {
    site,
    activeHousehold,
    accommodations,
    services,
    galleryItems: publishedGallery,
    registryItems,
    loading: context.isLoading,
    adminOpen: context.isAdminOpen,
    lookupInvitation,
    submitHouseholdRsvp,
    clearInvitation: () => context.setActiveHousehold(null),
    openAdmin: () => context.setIsAdminOpen(true),
  };
}
