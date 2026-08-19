import type { Session } from '@supabase/supabase-js';
import type {
  Accommodation,
  AdminSession,
  GalleryItem,
  GuestTag,
  GuestWish,
  HouseholdDraft,
  HouseholdInvitation,
  HouseholdMember,
  HouseholdRsvpInput,
  InvitationDelivery,
  InvitationTemplate,
  RegistryItem,
  SendInvitationRequest,
  SendInvitationResult,
  WeddingConfig,
  WeddingService,
} from '../types/wedding';
import { initialConfig } from '../data/initialData';
import { buildInvitationUrl } from '../utils/storage';
import { isAllowedAdminEmail, requireSupabase, supabase } from './supabase';

type Row = Record<string, unknown>;

export interface PublicDataBundle {
  config: WeddingConfig;
  galleryItems: GalleryItem[];
  wishes: GuestWish[];
}

export interface AdminDataBundle extends PublicDataBundle {
  households: HouseholdInvitation[];
  accommodations: Accommodation[];
  services: WeddingService[];
  registryItems: RegistryItem[];
  invitationTemplates: InvitationTemplate[];
  invitationDeliveries: InvitationDelivery[];
}

export interface GuestDataBundle {
  household: HouseholdInvitation;
  accommodations: Accommodation[];
  services: WeddingService[];
  registryItems: RegistryItem[];
}

const text = (value: unknown, fallback = ''): string => typeof value === 'string' ? value : fallback;
const optionalText = (value: unknown): string | undefined => {
  const result = text(value).trim();
  return result || undefined;
};
const numeric = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const bool = (value: unknown, fallback = false): boolean => typeof value === 'boolean' ? value : fallback;
const stringArray = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string')
  : [];

function normalizeConfig(value: unknown): WeddingConfig {
  const saved = value && typeof value === 'object' ? value as Partial<WeddingConfig> : {};
  return {
    ...initialConfig,
    ...saved,
    ceremonyVenue: { ...initialConfig.ceremonyVenue, ...saved.ceremonyVenue },
    receptionVenue: { ...initialConfig.receptionVenue, ...saved.receptionVenue },
    dressCode: { ...initialConfig.dressCode, ...saved.dressCode },
    adminPin: '6385',
  };
}

function mapMember(value: unknown): HouseholdMember {
  const row = value && typeof value === 'object' ? value as Row : {};
  const attendingValue = row.attending;
  return {
    id: text(row.id),
    householdId: text(row.household_id),
    name: text(row.name),
    email: optionalText(row.email),
    phone: optionalText(row.phone),
    isPrimary: bool(row.is_primary),
    isInvited: bool(row.is_invited, true),
    attending: typeof attendingValue === 'boolean' ? attendingValue : null,
    mealSelection: optionalText(row.meal_selection),
    dietaryRestrictions: stringArray(row.dietary_restrictions),
    dietaryDetails: optionalText(row.dietary_details),
    createdAt: optionalText(row.created_at),
    updatedAt: optionalText(row.updated_at),
  };
}

function mapHousehold(value: unknown, config: WeddingConfig): HouseholdInvitation {
  const row = value && typeof value === 'object' ? value as Row : {};
  const rawMembers = Array.isArray(row.household_members)
    ? row.household_members
    : Array.isArray(row.members) ? row.members : [];
  const members = rawMembers.map(mapMember);
  const tags = stringArray(row.tags).filter(
    (tag): tag is GuestTag => tag === 'free_venue_housing' || tag === 'presence_is_our_gift',
  );
  const inviteCode = text(row.invite_code ?? row.inviteCode);
  return {
    id: text(row.id),
    name: text(row.display_name ?? row.name),
    email: optionalText(row.email),
    phone: optionalText(row.phone),
    inviteCode,
    rsvpStatus: row.rsvp_status === 'attending' || row.rsvp_status === 'declined'
      ? row.rsvp_status
      : 'pending',
    partySize: numeric(row.max_party_size ?? row.partySize, 1),
    attendingCount: numeric(row.attending_count),
    dietaryRestrictions: stringArray(row.dietary_restrictions),
    dietaryDetails: optionalText(row.dietary_details),
    mealSelection: optionalText(row.meal_selection),
    songRequest: optionalText(row.song_request),
    message: optionalText(row.message),
    tableNumber: optionalText(row.table_number),
    isPlusOneAllowed: bool(row.is_plus_one_allowed),
    companionNames: members.filter((member) => !member.isPrimary).map((member) => member.name),
    respondedAt: optionalText(row.responded_at),
    checkedIn: bool(row.checked_in),
    tags,
    members,
    invitationUrl: inviteCode ? buildInvitationUrl(config, inviteCode) : undefined,
    createdAt: optionalText(row.created_at),
    updatedAt: optionalText(row.updated_at),
  };
}

function mapAccommodation(value: unknown): Accommodation {
  const row = value as Row;
  const visibility = row.visibility === 'free_venue_housing' || row.visibility === 'all'
    ? row.visibility
    : 'general';
  return {
    id: text(row.id),
    name: text(row.name),
    description: optionalText(row.description),
    address: text(row.address),
    phone: text(row.phone),
    email: optionalText(row.email),
    bookingCode: text(row.booking_code ?? row.bookingCode),
    distance: text(row.distance),
    link: text(row.link),
    rate: text(row.rate),
    priceAmount: row.price_amount == null ? undefined : numeric(row.price_amount),
    currency: text(row.currency, 'ZAR'),
    priceUnit: text(row.price_unit, 'night'),
    visibility,
    isVenueHousing: bool(row.is_venue_housing),
    published: bool(row.published),
    sortOrder: numeric(row.sort_order),
    createdAt: optionalText(row.created_at),
    updatedAt: optionalText(row.updated_at),
  };
}

function mapService(value: unknown): WeddingService {
  const row = value as Row;
  const visibility = row.visibility === 'free_venue_housing' || row.visibility === 'all'
    ? row.visibility
    : 'general';
  return {
    id: text(row.id),
    category: text(row.category),
    name: text(row.name),
    description: optionalText(row.description),
    contactName: optionalText(row.contact_name),
    phone: optionalText(row.phone),
    email: optionalText(row.email),
    link: optionalText(row.link),
    priceAmount: row.price_amount == null ? undefined : numeric(row.price_amount),
    currency: text(row.currency, 'ZAR'),
    priceUnit: text(row.price_unit, 'service'),
    visibility,
    published: bool(row.published),
    sortOrder: numeric(row.sort_order),
    createdAt: optionalText(row.created_at),
    updatedAt: optionalText(row.updated_at),
  };
}

function mapGalleryItem(value: unknown): GalleryItem {
  const row = value as Row;
  return {
    id: text(row.id),
    storagePath: text(row.storage_path ?? row.storagePath),
    src: text(row.public_url ?? row.src),
    category: text(row.category, 'couple'),
    title: text(row.title),
    subtitle: optionalText(row.subtitle),
    altText: text(row.alt_text ?? row.altText, text(row.title)),
    published: bool(row.published),
    sortOrder: numeric(row.sort_order),
    width: row.width == null ? undefined : numeric(row.width),
    height: row.height == null ? undefined : numeric(row.height),
    createdAt: optionalText(row.created_at),
    updatedAt: optionalText(row.updated_at),
  };
}

function mapRegistryItem(value: unknown): RegistryItem {
  const row = value as Row;
  const type = row.type === 'honeymoon' || row.type === 'cash' ? row.type : 'registry';
  return {
    id: text(row.id),
    title: text(row.title),
    description: text(row.description),
    link: optionalText(row.link),
    type,
    icon: text(row.icon, 'Gift'),
    goalAmount: row.goal_amount == null ? undefined : numeric(row.goal_amount),
    currentAmount: row.current_amount == null ? undefined : numeric(row.current_amount),
    accountDetails: optionalText(row.account_details),
    published: bool(row.published),
    sortOrder: numeric(row.sort_order),
    createdAt: optionalText(row.created_at),
    updatedAt: optionalText(row.updated_at),
  };
}

function mapWish(value: unknown): GuestWish {
  const row = value as Row;
  return {
    id: text(row.id),
    name: text(row.name),
    message: text(row.message),
    date: text(row.created_at).slice(0, 10),
    likes: numeric(row.likes),
    approved: bool(row.approved),
  };
}

function mapTemplate(value: unknown): InvitationTemplate {
  const row = value as Row;
  return {
    id: text(row.id),
    kind: row.kind === 'save_the_date' ? 'save_the_date' : 'official_invitation',
    name: text(row.name),
    subject: text(row.subject),
    heading: text(row.heading),
    body: text(row.body),
    emailHtml: optionalText(row.email_html),
    design: row.design && typeof row.design === 'object' ? row.design as Record<string, unknown> : {},
    isActive: bool(row.is_active, true),
    createdAt: optionalText(row.created_at),
    updatedAt: optionalText(row.updated_at),
  };
}

function mapDelivery(value: unknown): InvitationDelivery {
  const row = value as Row;
  const channel = row.channel === 'sms' || row.channel === 'whatsapp' ? row.channel : 'email';
  const validStatuses = ['draft', 'queued', 'sent', 'delivered', 'failed', 'bounced'];
  const status = validStatuses.includes(text(row.status))
    ? text(row.status) as InvitationDelivery['status']
    : 'draft';
  return {
    id: text(row.id),
    householdId: text(row.household_id),
    templateId: text(row.template_id),
    channel,
    recipient: text(row.recipient),
    status,
    attemptNumber: numeric(row.attempt_number, 1),
    providerMessageId: optionalText(row.provider_message_id),
    errorMessage: optionalText(row.error_message),
    pdfPath: optionalText(row.pdf_path),
    sentAt: optionalText(row.sent_at),
    createdAt: optionalText(row.created_at),
    updatedAt: optionalText(row.updated_at),
  };
}

function adminSessionFromAuth(session: Session | null): AdminSession | null {
  const email = session?.user.email?.toLowerCase();
  if (!session || !email || !isAllowedAdminEmail(email)) return null;
  return { userId: session.user.id, email, accessToken: session.access_token };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return adminSessionFromAuth(data.session);
}

export function onAdminSessionChange(callback: (session: AdminSession | null) => void): () => void {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(adminSessionFromAuth(session)));
  return () => data.subscription.unsubscribe();
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  if (!isAllowedAdminEmail(email)) throw new Error('This email is not authorized for the couple dashboard.');
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  const session = adminSessionFromAuth(data.session);
  if (!session) {
    await client.auth.signOut();
    throw new Error('This account is not authorized for the couple dashboard.');
  }
  return session;
}

export async function sendAdminMagicLink(email: string): Promise<void> {
  if (!isAllowedAdminEmail(email)) throw new Error('This email is not authorized for the couple dashboard.');
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: false,
      emailRedirectTo: typeof window === 'undefined' ? initialConfig.siteUrl : window.location.href,
    },
  });
  if (error) throw error;
}

export async function signOutAdmin(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchPublicData(): Promise<PublicDataBundle> {
  const client = requireSupabase();
  const [configResult, galleryResult, wishesResult] = await Promise.all([
    client.from('site_config').select('config').eq('id', 'main').maybeSingle(),
    client.from('gallery_items').select('*').eq('published', true).order('sort_order'),
    client.from('wishes').select('*').eq('approved', true).order('created_at', { ascending: false }),
  ]);
  if (configResult.error) throw configResult.error;
  if (galleryResult.error) throw galleryResult.error;
  if (wishesResult.error) throw wishesResult.error;
  return {
    config: normalizeConfig((configResult.data as Row | null)?.config),
    galleryItems: (galleryResult.data ?? []).map(mapGalleryItem),
    wishes: (wishesResult.data ?? []).map(mapWish),
  };
}

export async function fetchAdminData(configOverride?: WeddingConfig): Promise<AdminDataBundle> {
  const client = requireSupabase();
  const publicData = await fetchPublicData();
  const config = configOverride ?? publicData.config;
  const [households, accommodations, services, registry, gallery, wishes, templates, deliveries] = await Promise.all([
    client.from('households').select('*, household_members(*)').order('display_name'),
    client.from('accommodations').select('*').order('sort_order'),
    client.from('wedding_services').select('*').order('sort_order'),
    client.from('registry_items').select('*').order('sort_order'),
    client.from('gallery_items').select('*').order('sort_order'),
    client.from('wishes').select('*').order('created_at', { ascending: false }),
    client.from('invitation_templates').select('*').order('kind'),
    client.from('invitation_deliveries').select('*').order('created_at', { ascending: false }),
  ]);
  for (const result of [households, accommodations, services, registry, gallery, wishes, templates, deliveries]) {
    if (result.error) throw result.error;
  }
  return {
    config,
    households: (households.data ?? []).map((row) => mapHousehold(row, config)),
    accommodations: (accommodations.data ?? []).map(mapAccommodation),
    services: (services.data ?? []).map(mapService),
    registryItems: (registry.data ?? []).map(mapRegistryItem),
    galleryItems: (gallery.data ?? []).map(mapGalleryItem),
    wishes: (wishes.data ?? []).map(mapWish),
    invitationTemplates: (templates.data ?? []).map(mapTemplate),
    invitationDeliveries: (deliveries.data ?? []).map(mapDelivery),
  };
}

export async function lookupInvitation(query: string, config: WeddingConfig): Promise<GuestDataBundle | null> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('lookup_invitation', { raw_token: query.trim() });
  if (error) throw error;
  if (!data) return null;
  const bundle = data as Row;
  return {
    household: mapHousehold(bundle.household, config),
    accommodations: Array.isArray(bundle.accommodations) ? bundle.accommodations.map(mapAccommodation) : [],
    services: Array.isArray(bundle.services) ? bundle.services.map(mapService) : [],
    registryItems: Array.isArray(bundle.registry_items) ? bundle.registry_items.map(mapRegistryItem) : [],
  };
}

export async function submitHouseholdRsvp(
  inviteCode: string,
  input: HouseholdRsvpInput,
  config: WeddingConfig,
): Promise<GuestDataBundle> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('submit_household_rsvp', {
    raw_token: inviteCode,
    response: input,
  });
  if (error) throw error;
  const bundle = data as Row;
  return {
    household: mapHousehold(bundle.household, config),
    accommodations: Array.isArray(bundle.accommodations) ? bundle.accommodations.map(mapAccommodation) : [],
    services: Array.isArray(bundle.services) ? bundle.services.map(mapService) : [],
    registryItems: Array.isArray(bundle.registry_items) ? bundle.registry_items.map(mapRegistryItem) : [],
  };
}

export async function updateSiteConfig(config: WeddingConfig): Promise<void> {
  const client = requireSupabase();
  const publicConfig: Partial<WeddingConfig> = { ...config };
  delete publicConfig.adminPin;
  const { error } = await client.from('site_config').upsert({ id: 'main', config: publicConfig });
  if (error) throw error;
}

export async function createHousehold(draft: HouseholdDraft, config: WeddingConfig): Promise<HouseholdInvitation> {
  const client = requireSupabase();
  const { data, error } = await client.from('households').insert({
    display_name: draft.name.trim(),
    email: draft.email?.trim() || null,
    phone: draft.phone?.trim() || null,
    max_party_size: Math.max(1, draft.partySize ?? draft.members?.length ?? 1),
    table_number: draft.tableNumber?.trim() || null,
    is_plus_one_allowed: draft.isPlusOneAllowed ?? false,
    tags: draft.tags ?? [],
  }).select('*').single();
  if (error) throw error;
  const row = data as Row;
  const householdId = text(row.id);
  const members = draft.members?.length
    ? draft.members
    : [{ name: draft.name, email: draft.email, phone: draft.phone, isPrimary: true }];
  const memberRows = members.map((member, index) => ({
    household_id: householdId,
    name: member.name.trim(),
    email: member.email?.trim() || null,
    phone: member.phone?.trim() || null,
    is_primary: member.isPrimary ?? index === 0,
    is_invited: member.isInvited ?? true,
    dietary_restrictions: member.dietaryRestrictions ?? [],
  }));
  const memberResult = await client.from('household_members').insert(memberRows).select('*');
  if (memberResult.error) {
    await client.from('households').delete().eq('id', householdId);
    throw memberResult.error;
  }
  return mapHousehold({ ...row, household_members: memberResult.data }, config);
}

function householdUpdatePayload(updates: Partial<HouseholdInvitation>): Row {
  const payload: Row = {};
  if (updates.name !== undefined) payload.display_name = updates.name.trim();
  if (updates.email !== undefined) payload.email = updates.email?.trim() || null;
  if (updates.phone !== undefined) payload.phone = updates.phone?.trim() || null;
  if (updates.partySize !== undefined) payload.max_party_size = Math.max(1, updates.partySize);
  if (updates.rsvpStatus !== undefined) payload.rsvp_status = updates.rsvpStatus;
  if (updates.attendingCount !== undefined) payload.attending_count = updates.attendingCount;
  if (updates.tableNumber !== undefined) payload.table_number = updates.tableNumber?.trim() || null;
  if (updates.isPlusOneAllowed !== undefined) payload.is_plus_one_allowed = updates.isPlusOneAllowed;
  if (updates.checkedIn !== undefined) payload.checked_in = updates.checkedIn;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.dietaryRestrictions !== undefined) payload.dietary_restrictions = updates.dietaryRestrictions;
  if (updates.dietaryDetails !== undefined) payload.dietary_details = updates.dietaryDetails || null;
  if (updates.mealSelection !== undefined) payload.meal_selection = updates.mealSelection || null;
  if (updates.songRequest !== undefined) payload.song_request = updates.songRequest || null;
  if (updates.message !== undefined) payload.message = updates.message || null;
  return payload;
}

export async function updateHousehold(id: string, updates: Partial<HouseholdInvitation>): Promise<void> {
  const client = requireSupabase();
  const payload = householdUpdatePayload(updates);
  if (Object.keys(payload).length > 0) {
    const { error } = await client.from('households').update(payload).eq('id', id);
    if (error) throw error;
  }
  if (updates.members) {
    const incomingIds = updates.members.map((member) => member.id).filter(Boolean);
    const existing = await client.from('household_members').select('id').eq('household_id', id);
    if (existing.error) throw existing.error;
    const removedIds = (existing.data ?? []).map((row) => row.id).filter((memberId) => !incomingIds.includes(memberId));
    if (removedIds.length > 0) {
      const deleteResult = await client.from('household_members').delete().in('id', removedIds);
      if (deleteResult.error) throw deleteResult.error;
    }
    for (const member of updates.members) {
      const memberPayload = {
        household_id: id,
        name: member.name.trim(),
        email: member.email?.trim() || null,
        phone: member.phone?.trim() || null,
        is_primary: member.isPrimary,
        is_invited: member.isInvited,
        attending: member.attending,
        meal_selection: member.mealSelection || null,
        dietary_restrictions: member.dietaryRestrictions,
        dietary_details: member.dietaryDetails || null,
      };
      const result = member.id
        ? await client.from('household_members').update(memberPayload).eq('id', member.id).eq('household_id', id)
        : await client.from('household_members').insert(memberPayload);
      if (result.error) throw result.error;
    }
  }
}

export async function deleteHousehold(id: string): Promise<void> {
  const { error } = await requireSupabase().from('households').delete().eq('id', id);
  if (error) throw error;
}

export async function setHouseholdCheckedIn(id: string, checkedIn: boolean): Promise<void> {
  const { error } = await requireSupabase().from('households').update({ checked_in: checkedIn }).eq('id', id);
  if (error) throw error;
}

function accommodationPayload(item: Partial<Accommodation>): Row {
  return {
    ...(item.name !== undefined && { name: item.name }),
    ...(item.description !== undefined && { description: item.description || null }),
    ...(item.address !== undefined && { address: item.address }),
    ...(item.phone !== undefined && { phone: item.phone }),
    ...(item.email !== undefined && { email: item.email || null }),
    ...(item.bookingCode !== undefined && { booking_code: item.bookingCode }),
    ...(item.distance !== undefined && { distance: item.distance }),
    ...(item.link !== undefined && { link: item.link }),
    ...(item.rate !== undefined && { rate: item.rate }),
    ...(item.priceAmount !== undefined && { price_amount: item.priceAmount }),
    ...(item.currency !== undefined && { currency: item.currency }),
    ...(item.priceUnit !== undefined && { price_unit: item.priceUnit }),
    ...(item.visibility !== undefined && { visibility: item.visibility }),
    ...(item.isVenueHousing !== undefined && { is_venue_housing: item.isVenueHousing }),
    ...(item.published !== undefined && { published: item.published }),
    ...(item.sortOrder !== undefined && { sort_order: item.sortOrder }),
  };
}

export async function createAccommodation(item: Omit<Accommodation, 'id'>): Promise<Accommodation> {
  const { data, error } = await requireSupabase().from('accommodations').insert(accommodationPayload(item)).select('*').single();
  if (error) throw error;
  return mapAccommodation(data);
}

export async function updateAccommodation(id: string, updates: Partial<Accommodation>): Promise<void> {
  const { error } = await requireSupabase().from('accommodations').update(accommodationPayload(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteAccommodation(id: string): Promise<void> {
  const { error } = await requireSupabase().from('accommodations').delete().eq('id', id);
  if (error) throw error;
}

function servicePayload(item: Partial<WeddingService>): Row {
  return {
    ...(item.category !== undefined && { category: item.category }),
    ...(item.name !== undefined && { name: item.name }),
    ...(item.description !== undefined && { description: item.description || null }),
    ...(item.contactName !== undefined && { contact_name: item.contactName || null }),
    ...(item.phone !== undefined && { phone: item.phone || null }),
    ...(item.email !== undefined && { email: item.email || null }),
    ...(item.link !== undefined && { link: item.link || null }),
    ...(item.priceAmount !== undefined && { price_amount: item.priceAmount }),
    ...(item.currency !== undefined && { currency: item.currency }),
    ...(item.priceUnit !== undefined && { price_unit: item.priceUnit }),
    ...(item.visibility !== undefined && { visibility: item.visibility }),
    ...(item.published !== undefined && { published: item.published }),
    ...(item.sortOrder !== undefined && { sort_order: item.sortOrder }),
  };
}

export async function createService(item: Omit<WeddingService, 'id'>): Promise<WeddingService> {
  const { data, error } = await requireSupabase().from('wedding_services').insert(servicePayload(item)).select('*').single();
  if (error) throw error;
  return mapService(data);
}

export async function updateService(id: string, updates: Partial<WeddingService>): Promise<void> {
  const { error } = await requireSupabase().from('wedding_services').update(servicePayload(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await requireSupabase().from('wedding_services').delete().eq('id', id);
  if (error) throw error;
}

function galleryPayload(item: Partial<GalleryItem>): Row {
  return {
    ...(item.storagePath !== undefined && { storage_path: item.storagePath }),
    ...(item.src !== undefined && { public_url: item.src }),
    ...(item.category !== undefined && { category: item.category }),
    ...(item.title !== undefined && { title: item.title }),
    ...(item.subtitle !== undefined && { subtitle: item.subtitle || null }),
    ...(item.altText !== undefined && { alt_text: item.altText }),
    ...(item.published !== undefined && { published: item.published }),
    ...(item.sortOrder !== undefined && { sort_order: item.sortOrder }),
    ...(item.width !== undefined && { width: item.width }),
    ...(item.height !== undefined && { height: item.height }),
  };
}

export async function createGalleryItem(item: Omit<GalleryItem, 'id'>): Promise<GalleryItem> {
  const { data, error } = await requireSupabase().from('gallery_items').insert(galleryPayload(item)).select('*').single();
  if (error) throw error;
  return mapGalleryItem(data);
}

export async function uploadGalleryPhoto(
  file: File,
  metadata: Pick<GalleryItem, 'title' | 'altText'> & Partial<GalleryItem>,
): Promise<GalleryItem> {
  const client = requireSupabase();
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const storagePath = `${crypto.randomUUID()}-${safeName}`;
  const upload = await client.storage.from('wedding-gallery').upload(storagePath, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) throw upload.error;
  const { data: publicUrl } = client.storage.from('wedding-gallery').getPublicUrl(storagePath);
  try {
    return await createGalleryItem({
      storagePath,
      src: publicUrl.publicUrl,
      category: metadata.category ?? 'couple',
      title: metadata.title,
      subtitle: metadata.subtitle,
      altText: metadata.altText,
      published: metadata.published ?? true,
      sortOrder: metadata.sortOrder ?? 0,
      width: metadata.width,
      height: metadata.height,
    });
  } catch (error) {
    await client.storage.from('wedding-gallery').remove([storagePath]);
    throw error;
  }
}

export async function updateGalleryItem(id: string, updates: Partial<GalleryItem>): Promise<void> {
  const { error } = await requireSupabase().from('gallery_items').update(galleryPayload(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteGalleryItem(item: GalleryItem): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('gallery_items').delete().eq('id', item.id);
  if (error) throw error;
  if (item.storagePath && !item.storagePath.startsWith('bundled/')) {
    const remove = await client.storage.from('wedding-gallery').remove([item.storagePath]);
    if (remove.error) throw remove.error;
  }
}

function registryPayload(item: Partial<RegistryItem>): Row {
  return {
    ...(item.title !== undefined && { title: item.title }),
    ...(item.description !== undefined && { description: item.description }),
    ...(item.link !== undefined && { link: item.link || null }),
    ...(item.type !== undefined && { type: item.type }),
    ...(item.icon !== undefined && { icon: item.icon }),
    ...(item.goalAmount !== undefined && { goal_amount: item.goalAmount }),
    ...(item.currentAmount !== undefined && { current_amount: item.currentAmount }),
    ...(item.accountDetails !== undefined && { account_details: item.accountDetails || null }),
    ...(item.published !== undefined && { published: item.published }),
    ...(item.sortOrder !== undefined && { sort_order: item.sortOrder }),
  };
}

export async function createRegistryItem(item: Omit<RegistryItem, 'id'>): Promise<RegistryItem> {
  const { data, error } = await requireSupabase().from('registry_items').insert(registryPayload(item)).select('*').single();
  if (error) throw error;
  return mapRegistryItem(data);
}

export async function updateRegistryItem(id: string, updates: Partial<RegistryItem>): Promise<void> {
  const { error } = await requireSupabase().from('registry_items').update(registryPayload(updates)).eq('id', id);
  if (error) throw error;
}

export async function deleteRegistryItem(id: string): Promise<void> {
  const { error } = await requireSupabase().from('registry_items').delete().eq('id', id);
  if (error) throw error;
}

export async function createWish(name: string, message: string): Promise<GuestWish> {
  const { data, error } = await requireSupabase().from('wishes').insert({ name, message, approved: false }).select('*').single();
  if (error) throw error;
  return mapWish(data);
}

function templatePayload(item: Partial<InvitationTemplate>): Row {
  return {
    ...(item.kind !== undefined && { kind: item.kind }),
    ...(item.name !== undefined && { name: item.name }),
    ...(item.subject !== undefined && { subject: item.subject }),
    ...(item.heading !== undefined && { heading: item.heading }),
    ...(item.body !== undefined && { body: item.body }),
    ...(item.emailHtml !== undefined && { email_html: item.emailHtml || null }),
    ...(item.design !== undefined && { design: item.design }),
    ...(item.isActive !== undefined && { is_active: item.isActive }),
  };
}

export async function upsertInvitationTemplate(item: InvitationTemplate): Promise<InvitationTemplate> {
  const client = requireSupabase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id);
  const query = isUuid
    ? client.from('invitation_templates').update(templatePayload(item)).eq('id', item.id)
    : client.from('invitation_templates').upsert(templatePayload(item), { onConflict: 'kind' });
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return mapTemplate(data);
}

export async function sendInvitations(request: SendInvitationRequest): Promise<SendInvitationResult> {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke<SendInvitationResult>('send-invitation', { body: request });
  if (error) throw error;
  if (!data) throw new Error('The invitation service returned no result.');
  return data;
}
