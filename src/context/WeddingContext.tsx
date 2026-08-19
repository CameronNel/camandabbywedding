import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Accommodation,
  ActionResult,
  AdminSession,
  GalleryItem,
  Guest,
  GuestWish,
  HouseholdDraft,
  HouseholdInvitation,
  HouseholdRsvpInput,
  InvitationDelivery,
  InvitationTemplate,
  RegistryItem,
  ScheduleEvent,
  SendInvitationRequest,
  SendInvitationResult,
  WeddingConfig,
  WeddingService,
} from '../types/wedding';
import {
  buildInvitationUrl,
  createSecureInviteCode,
  loadAccommodations,
  loadConfig,
  loadGallery,
  loadGuests,
  loadInvitationDeliveries,
  loadInvitationTemplates,
  loadRegistry,
  loadSchedule,
  loadServices,
  loadWishes,
  resetAppToFactoryDefaults,
  saveAccommodations,
  saveConfig,
  saveGallery,
  saveGuests,
  saveInvitationDeliveries,
  saveInvitationTemplates,
  saveRegistry,
  saveSchedule,
  saveServices,
  saveWishes,
} from '../utils/storage';
import { isSupabaseConfigured } from '../lib/supabase';
import * as repository from '../lib/weddingRepository';

export interface WeddingContextType {
  config: WeddingConfig;
  siteConfig: WeddingConfig;
  updateConfig: (updates: Partial<WeddingConfig>) => void;
  updateSiteConfig: (updates: Partial<WeddingConfig>) => Promise<void>;
  dataMode: 'supabase' | 'local';
  isLoading: boolean;
  dataError: string | null;
  refreshData: () => Promise<void>;

  households: HouseholdInvitation[];
  guests: Guest[];
  activeHousehold: HouseholdInvitation | null;
  setActiveHousehold: (household: HouseholdInvitation | null) => void;
  activeGuest: Guest | null;
  setActiveGuest: (guest: Guest | null) => void;
  lookupInvitation: (query: string) => Promise<HouseholdInvitation | null>;
  submitHouseholdRsvp: (input: HouseholdRsvpInput) => Promise<boolean>;
  createHousehold: (draft: HouseholdDraft) => Promise<HouseholdInvitation>;
  updateHousehold: (id: string, updates: Partial<HouseholdInvitation>) => Promise<void>;
  deleteHousehold: (id: string) => Promise<void>;

  submitRsvp: (guestId: string, updates: Partial<Guest>) => boolean;
  registerAndRsvp: (guest: RegisterGuestInput) => Guest;
  addGuest: (guest: Partial<Guest>) => Guest;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  bulkAddGuests: (guests: Array<Partial<Guest>>) => void;
  toggleCheckIn: (id: string) => void;
  searchGuest: (query: string) => Guest | null;

  wishes: GuestWish[];
  addWish: (name: string, message: string) => void;
  likeWish: (id: string) => void;
  registryItems: RegistryItem[];
  addRegistryItem: (item: Omit<RegistryItem, 'id'>) => Promise<RegistryItem>;
  updateRegistryItem: (id: string, item: Partial<RegistryItem>) => Promise<void>;
  deleteRegistryItem: (id: string) => Promise<void>;
  scheduleEvents: ScheduleEvent[];
  updateScheduleEvent: (index: number, event: Partial<ScheduleEvent>) => void;

  accommodations: Accommodation[];
  addAccommodation: (item: Omit<Accommodation, 'id'>) => Promise<Accommodation>;
  updateAccommodation: (id: string | number, item: Partial<Accommodation>) => Promise<void>;
  deleteAccommodation: (id: string) => Promise<void>;
  services: WeddingService[];
  addService: (item: Omit<WeddingService, 'id'>) => Promise<WeddingService>;
  updateService: (id: string, item: Partial<WeddingService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  galleryItems: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => Promise<GalleryItem>;
  uploadGalleryPhoto: (
    file: File,
    metadata: Pick<GalleryItem, 'title' | 'altText'> & Partial<GalleryItem>,
  ) => Promise<GalleryItem>;
  updateGalleryItem: (id: string, item: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;

  invitationTemplates: InvitationTemplate[];
  invitationDeliveries: InvitationDelivery[];
  upsertInvitationTemplate: (template: InvitationTemplate) => Promise<InvitationTemplate>;
  sendInvitations: (request: SendInvitationRequest) => Promise<SendInvitationResult>;

  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  adminSession: AdminSession | null;
  isAdminAuthenticated: boolean;
  signInAdmin: (email: string, password: string) => Promise<ActionResult>;
  sendAdminMagicLink: (email: string) => Promise<ActionResult>;
  authenticateAdmin: (pin: string) => boolean;
  logoutAdmin: () => Promise<void>;
  resetAllData: () => void;
}

interface RegisterGuestInput {
  name: string;
  email?: string;
  phone?: string;
  rsvpStatus: 'attending' | 'declined';
  partySize: number;
  attendingCount: number;
  dietaryRestrictions: string[];
  dietaryDetails?: string;
  mealSelection?: string;
  songRequest?: string;
  message?: string;
  companionNames?: string[];
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function normalizeHousehold(guest: Guest, config: WeddingConfig): HouseholdInvitation {
  return {
    ...guest,
    tags: guest.tags ?? [],
    members: guest.members ?? [],
    invitationUrl: guest.inviteCode ? buildInvitationUrl(config, guest.inviteCode) : undefined,
  };
}

function createLocalHousehold(draft: HouseholdDraft, config: WeddingConfig): HouseholdInvitation {
  const id = crypto.randomUUID();
  const inviteCode = createSecureInviteCode();
  const memberDrafts = draft.members?.length
    ? draft.members
    : [{ name: draft.name, email: draft.email, phone: draft.phone, isPrimary: true }];
  const members = memberDrafts.map((member, index) => ({
    id: crypto.randomUUID(),
    householdId: id,
    name: member.name.trim(),
    email: member.email,
    phone: member.phone,
    isPrimary: member.isPrimary ?? index === 0,
    isInvited: member.isInvited ?? true,
    attending: member.attending ?? null,
    mealSelection: member.mealSelection,
    dietaryRestrictions: member.dietaryRestrictions ?? [],
    dietaryDetails: member.dietaryDetails,
  }));
  return {
    id,
    name: draft.name.trim(),
    email: draft.email?.trim(),
    phone: draft.phone?.trim(),
    inviteCode,
    rsvpStatus: 'pending',
    partySize: Math.max(1, draft.partySize ?? members.length),
    attendingCount: 0,
    dietaryRestrictions: [],
    tableNumber: draft.tableNumber?.trim(),
    isPlusOneAllowed: draft.isPlusOneAllowed ?? false,
    companionNames: members.filter((member) => !member.isPrimary).map((member) => member.name),
    checkedIn: false,
    tags: draft.tags ?? [],
    members,
    invitationUrl: buildInvitationUrl(config, inviteCode),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function WeddingProvider({ children }: { children: ReactNode }) {
  const dataMode = isSupabaseConfigured ? 'supabase' : 'local';
  const [config, setConfig] = useState<WeddingConfig>(loadConfig);
  const [households, setHouseholds] = useState<HouseholdInvitation[]>(() =>
    loadGuests().map((guest) => normalizeHousehold(guest, loadConfig())),
  );
  const [wishes, setWishes] = useState<GuestWish[]>(loadWishes);
  const [registryItems, setRegistryItems] = useState<RegistryItem[]>(loadRegistry);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(loadSchedule);
  const [accommodations, setAccommodations] = useState<Accommodation[]>(loadAccommodations);
  const [services, setServices] = useState<WeddingService[]>(loadServices);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(loadGallery);
  const [invitationTemplates, setInvitationTemplates] = useState<InvitationTemplate[]>(loadInvitationTemplates);
  const [invitationDeliveries, setInvitationDeliveries] = useState<InvitationDelivery[]>(loadInvitationDeliveries);
  const [activeHousehold, setActiveHouseholdState] = useState<HouseholdInvitation | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    if (dataMode === 'supabase' || typeof window === 'undefined') return null;
    return window.sessionStorage.getItem('wedding_admin_auth') === 'true'
      ? { userId: 'local-admin', email: 'local-fallback' }
      : null;
  });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(dataMode === 'supabase');
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (dataMode !== 'local') return;
    saveConfig(config);
  }, [config, dataMode]);
  useEffect(() => { if (dataMode === 'local') saveGuests(households); }, [households, dataMode]);
  useEffect(() => { if (dataMode === 'local') saveWishes(wishes); }, [wishes, dataMode]);
  useEffect(() => { if (dataMode === 'local') saveRegistry(registryItems); }, [registryItems, dataMode]);
  useEffect(() => { if (dataMode === 'local') saveSchedule(scheduleEvents); }, [scheduleEvents, dataMode]);
  useEffect(() => { if (dataMode === 'local') saveAccommodations(accommodations); }, [accommodations, dataMode]);
  useEffect(() => { if (dataMode === 'local') saveServices(services); }, [services, dataMode]);
  useEffect(() => { if (dataMode === 'local') saveGallery(galleryItems); }, [galleryItems, dataMode]);
  useEffect(() => { if (dataMode === 'local') saveInvitationTemplates(invitationTemplates); }, [invitationTemplates, dataMode]);
  useEffect(() => { if (dataMode === 'local') saveInvitationDeliveries(invitationDeliveries); }, [invitationDeliveries, dataMode]);

  const applyPublicBundle = useCallback((bundle: repository.PublicDataBundle) => {
    setConfig(bundle.config);
    setGalleryItems(bundle.galleryItems);
    setWishes(bundle.wishes);
    if (!adminSession && !activeHousehold) {
      setHouseholds([]);
      setAccommodations([]);
      setServices([]);
      setRegistryItems([]);
      setInvitationTemplates([]);
      setInvitationDeliveries([]);
    }
  }, [activeHousehold, adminSession]);

  const applyAdminBundle = useCallback((bundle: repository.AdminDataBundle) => {
    setConfig(bundle.config);
    setHouseholds(bundle.households);
    setAccommodations(bundle.accommodations);
    setServices(bundle.services);
    setRegistryItems(bundle.registryItems);
    setGalleryItems(bundle.galleryItems);
    setWishes(bundle.wishes);
    setInvitationTemplates(bundle.invitationTemplates);
    setInvitationDeliveries(bundle.invitationDeliveries);
  }, []);

  const refreshData = useCallback(async () => {
    if (dataMode === 'local') return;
    setIsLoading(true);
    setDataError(null);
    try {
      if (adminSession) applyAdminBundle(await repository.fetchAdminData());
      else applyPublicBundle(await repository.fetchPublicData());
    } catch (error) {
      setDataError(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [adminSession, applyAdminBundle, applyPublicBundle, dataMode]);

  useEffect(() => {
    if (dataMode === 'local') return;
    let mounted = true;
    repository.getAdminSession().then((session) => {
      if (!mounted) return;
      setAdminSession(session);
      setIsLoading(false);
    }).catch((error) => {
      if (mounted) setDataError(errorMessage(error));
    });
    const unsubscribe = repository.onAdminSessionChange((session) => {
      if (mounted) setAdminSession(session);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [dataMode]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const setActiveHousehold = useCallback((household: HouseholdInvitation | null) => {
    setActiveHouseholdState(household);
  }, []);

  const setActiveGuest = useCallback((guest: Guest | null) => {
    setActiveHouseholdState(guest ? normalizeHousehold(guest, config) : null);
  }, [config]);

  const lookupInvitation = useCallback(async (query: string): Promise<HouseholdInvitation | null> => {
    const normalized = query.trim();
    if (!normalized) return null;
    setDataError(null);
    try {
      if (dataMode === 'supabase') {
        const bundle = await repository.lookupInvitation(normalized, config);
        if (!bundle) return null;
        setActiveHouseholdState(bundle.household);
        setAccommodations(bundle.accommodations);
        setServices(bundle.services);
        setRegistryItems(bundle.registryItems);
        return bundle.household;
      }
      const match = households.find((household) =>
        household.inviteCode.toLowerCase() === normalized.toLowerCase(),
      ) ?? null;
      setActiveHouseholdState(match);
      return match;
    } catch (error) {
      setDataError(errorMessage(error));
      return null;
    }
  }, [config, dataMode, households]);

  const createHousehold = useCallback(async (draft: HouseholdDraft): Promise<HouseholdInvitation> => {
    setDataError(null);
    try {
      const household = dataMode === 'supabase'
        ? await repository.createHousehold(draft, config)
        : createLocalHousehold(draft, config);
      setHouseholds((current) => [household, ...current]);
      return household;
    } catch (error) {
      setDataError(errorMessage(error));
      throw error;
    }
  }, [config, dataMode]);

  const updateHousehold = useCallback(async (
    id: string,
    updates: Partial<HouseholdInvitation>,
  ): Promise<void> => {
    const previous = households;
    setHouseholds((current) => current.map((household) =>
      household.id === id ? { ...household, ...updates, updatedAt: new Date().toISOString() } : household,
    ));
    setActiveHouseholdState((current) => current?.id === id ? { ...current, ...updates } : current);
    if (dataMode === 'supabase') {
      try {
        await repository.updateHousehold(id, updates);
      } catch (error) {
        setHouseholds(previous);
        setDataError(errorMessage(error));
        throw error;
      }
    }
  }, [dataMode, households]);

  const deleteHousehold = useCallback(async (id: string): Promise<void> => {
    if (dataMode === 'supabase') await repository.deleteHousehold(id);
    setHouseholds((current) => current.filter((household) => household.id !== id));
    setActiveHouseholdState((current) => current?.id === id ? null : current);
  }, [dataMode]);

  const submitHouseholdRsvp = useCallback(async (input: HouseholdRsvpInput): Promise<boolean> => {
    if (!activeHousehold) return false;
    setDataError(null);
    try {
      if (dataMode === 'supabase') {
        const bundle = await repository.submitHouseholdRsvp(activeHousehold.inviteCode, input, config);
        setActiveHouseholdState(bundle.household);
        setAccommodations(bundle.accommodations);
        setServices(bundle.services);
        setRegistryItems(bundle.registryItems);
        return true;
      }
      const updated: HouseholdInvitation = {
        ...activeHousehold,
        email: input.email,
        phone: input.phone,
        rsvpStatus: input.rsvpStatus,
        attendingCount: input.rsvpStatus === 'attending' ? input.attendingCount : 0,
        members: activeHousehold.members.map((member) => {
          const response = input.members.find((item) => item.id === member.id)
            ?? input.members.find((item) => item.name.trim().toLowerCase() === member.name.trim().toLowerCase());
          return response ? {
            ...member,
            ...response,
            dietaryRestrictions: response.dietaryRestrictions ?? [],
          } : member;
        }),
        dietaryRestrictions: input.dietaryRestrictions ?? [],
        dietaryDetails: input.dietaryDetails,
        mealSelection: input.mealSelection,
        songRequest: input.songRequest,
        message: input.message,
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setHouseholds((current) => current.map((household) => household.id === updated.id ? updated : household));
      setActiveHouseholdState(updated);
      if (input.message?.trim()) {
        setWishes((current) => [{
          id: crypto.randomUUID(),
          name: updated.name,
          message: input.message!.trim(),
          date: new Date().toISOString().slice(0, 10),
          likes: 0,
          approved: true,
        }, ...current]);
      }
      return true;
    } catch (error) {
      setDataError(errorMessage(error));
      return false;
    }
  }, [activeHousehold, config, dataMode]);

  const addGuest = useCallback((guest: Partial<Guest>): Guest => {
    const local = createLocalHousehold({
      name: guest.name || 'Guest',
      email: guest.email,
      phone: guest.phone,
      partySize: guest.partySize,
      tableNumber: guest.tableNumber,
      isPlusOneAllowed: guest.isPlusOneAllowed,
      tags: guest.tags,
      members: guest.members,
    }, config);
    const optimistic: HouseholdInvitation = { ...local, ...guest, tags: guest.tags ?? [], members: guest.members ?? local.members };
    setHouseholds((current) => [optimistic, ...current]);
    if (dataMode === 'supabase') {
      void repository.createHousehold({
        name: optimistic.name,
        email: optimistic.email,
        phone: optimistic.phone,
        partySize: optimistic.partySize,
        tableNumber: optimistic.tableNumber,
        isPlusOneAllowed: optimistic.isPlusOneAllowed,
        tags: optimistic.tags,
        members: optimistic.members,
      }, config).then((saved) => {
        setHouseholds((current) => current.map((item) => item.id === optimistic.id ? saved : item));
      }).catch((error) => {
        setHouseholds((current) => current.filter((item) => item.id !== optimistic.id));
        setDataError(errorMessage(error));
      });
    }
    return optimistic;
  }, [config, dataMode]);

  const updateGuest = useCallback((id: string, updates: Partial<Guest>) => {
    void updateHousehold(id, updates as Partial<HouseholdInvitation>);
  }, [updateHousehold]);

  const deleteGuest = useCallback((id: string) => {
    void deleteHousehold(id).catch((error) => setDataError(errorMessage(error)));
  }, [deleteHousehold]);

  const bulkAddGuests = useCallback((guestList: Array<Partial<Guest>>) => {
    for (const guest of guestList) addGuest(guest);
  }, [addGuest]);

  const toggleCheckIn = useCallback((id: string) => {
    const current = households.find((household) => household.id === id);
    if (!current) return;
    updateGuest(id, { checkedIn: !current.checkedIn });
  }, [households, updateGuest]);

  const submitRsvp = useCallback((id: string, updates: Partial<Guest>): boolean => {
    const target = households.find((household) => household.id === id);
    if (!target) return false;
    updateGuest(id, { ...updates, respondedAt: new Date().toISOString() });
    return true;
  }, [households, updateGuest]);

  const registerAndRsvp = useCallback((input: RegisterGuestInput): Guest => {
    if (dataMode === 'supabase') {
      throw new Error('Direct registration is disabled. Please use the secure code on the invitation.');
    }
    const household = addGuest(input);
    const completed = { ...household, ...input, respondedAt: new Date().toISOString() };
    updateGuest(household.id, completed);
    return completed;
  }, [addGuest, dataMode, updateGuest]);

  const searchGuest = useCallback((query: string): Guest | null => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return null;
    return households.find((household) => household.inviteCode.toLowerCase() === normalized)
      ?? (adminSession ? households.find((household) => household.name.toLowerCase() === normalized) : undefined)
      ?? null;
  }, [adminSession, households]);

  const updateConfig = useCallback((updates: Partial<WeddingConfig>) => {
    setConfig((current) => {
      const next = { ...current, ...updates, adminPin: '6385' };
      if (dataMode === 'supabase' && adminSession) {
        void repository.updateSiteConfig(next).catch((error) => setDataError(errorMessage(error)));
      }
      return next;
    });
  }, [adminSession, dataMode]);

  const updateSiteConfig = useCallback(async (updates: Partial<WeddingConfig>) => {
    const next = { ...config, ...updates, adminPin: '6385' };
    if (dataMode === 'supabase') await repository.updateSiteConfig(next);
    setConfig(next);
  }, [config, dataMode]);

  const addWish = useCallback((name: string, message: string) => {
    const localWish: GuestWish = {
      id: crypto.randomUUID(),
      name,
      message,
      date: new Date().toISOString().slice(0, 10),
      likes: 0,
      approved: dataMode === 'local',
    };
    setWishes((current) => [localWish, ...current]);
    if (dataMode === 'supabase') {
      void repository.createWish(name, message).then((saved) => {
        setWishes((current) => current.map((wish) => wish.id === localWish.id ? saved : wish));
      }).catch((error) => {
        setWishes((current) => current.filter((wish) => wish.id !== localWish.id));
        setDataError(errorMessage(error));
      });
    }
  }, [dataMode]);

  const likeWish = useCallback((id: string) => {
    if (dataMode === 'supabase') return;
    setWishes((current) => current.map((wish) => wish.id === id ? { ...wish, likes: (wish.likes ?? 0) + 1 } : wish));
  }, [dataMode]);

  const addRegistryItem = useCallback(async (item: Omit<RegistryItem, 'id'>) => {
    const saved = dataMode === 'supabase'
      ? await repository.createRegistryItem(item)
      : { ...item, id: crypto.randomUUID() };
    setRegistryItems((current) => [...current, saved]);
    return saved;
  }, [dataMode]);

  const updateRegistryItem = useCallback(async (id: string, updates: Partial<RegistryItem>) => {
    if (dataMode === 'supabase') await repository.updateRegistryItem(id, updates);
    setRegistryItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  }, [dataMode]);

  const deleteRegistryItem = useCallback(async (id: string) => {
    if (dataMode === 'supabase') await repository.deleteRegistryItem(id);
    setRegistryItems((current) => current.filter((item) => item.id !== id));
  }, [dataMode]);

  const updateScheduleEvent = useCallback((index: number, event: Partial<ScheduleEvent>) => {
    setScheduleEvents((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...event } : item));
  }, []);

  const addAccommodation = useCallback(async (item: Omit<Accommodation, 'id'>) => {
    const saved = dataMode === 'supabase'
      ? await repository.createAccommodation(item)
      : { ...item, id: crypto.randomUUID() };
    setAccommodations((current) => [...current, saved]);
    return saved;
  }, [dataMode]);

  const updateAccommodation = useCallback(async (id: string | number, updates: Partial<Accommodation>) => {
    const resolved = typeof id === 'number' ? accommodations[id]?.id : id;
    if (!resolved) return;
    if (dataMode === 'supabase') await repository.updateAccommodation(resolved, updates);
    setAccommodations((current) => current.map((item) => item.id === resolved ? { ...item, ...updates } : item));
  }, [accommodations, dataMode]);

  const deleteAccommodation = useCallback(async (id: string) => {
    if (dataMode === 'supabase') await repository.deleteAccommodation(id);
    setAccommodations((current) => current.filter((item) => item.id !== id));
  }, [dataMode]);

  const addService = useCallback(async (item: Omit<WeddingService, 'id'>) => {
    const saved = dataMode === 'supabase'
      ? await repository.createService(item)
      : { ...item, id: crypto.randomUUID() };
    setServices((current) => [...current, saved]);
    return saved;
  }, [dataMode]);

  const updateService = useCallback(async (id: string, updates: Partial<WeddingService>) => {
    if (dataMode === 'supabase') await repository.updateService(id, updates);
    setServices((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  }, [dataMode]);

  const deleteService = useCallback(async (id: string) => {
    if (dataMode === 'supabase') await repository.deleteService(id);
    setServices((current) => current.filter((item) => item.id !== id));
  }, [dataMode]);

  const addGalleryItem = useCallback(async (item: Omit<GalleryItem, 'id'>) => {
    const saved = dataMode === 'supabase'
      ? await repository.createGalleryItem(item)
      : { ...item, id: crypto.randomUUID() };
    setGalleryItems((current) => [...current, saved]);
    return saved;
  }, [dataMode]);

  const uploadGalleryPhoto = useCallback(async (
    file: File,
    metadata: Pick<GalleryItem, 'title' | 'altText'> & Partial<GalleryItem>,
  ) => {
    if (dataMode !== 'supabase') throw new Error('Photo uploads require Supabase Storage.');
    const saved = await repository.uploadGalleryPhoto(file, metadata);
    setGalleryItems((current) => [...current, saved]);
    return saved;
  }, [dataMode]);

  const updateGalleryItem = useCallback(async (id: string, updates: Partial<GalleryItem>) => {
    if (dataMode === 'supabase') await repository.updateGalleryItem(id, updates);
    setGalleryItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  }, [dataMode]);

  const deleteGalleryItem = useCallback(async (id: string) => {
    const item = galleryItems.find((entry) => entry.id === id);
    if (!item) return;
    if (dataMode === 'supabase') await repository.deleteGalleryItem(item);
    setGalleryItems((current) => current.filter((entry) => entry.id !== id));
  }, [dataMode, galleryItems]);

  const upsertInvitationTemplate = useCallback(async (template: InvitationTemplate) => {
    const saved = dataMode === 'supabase' ? await repository.upsertInvitationTemplate(template) : template;
    setInvitationTemplates((current) => {
      const exists = current.some((item) => item.id === saved.id || item.kind === saved.kind);
      return exists
        ? current.map((item) => item.id === saved.id || item.kind === saved.kind ? saved : item)
        : [...current, saved];
    });
    return saved;
  }, [dataMode]);

  const sendInvitations = useCallback(async (request: SendInvitationRequest) => {
    if (dataMode !== 'supabase') {
      const results = request.householdIds.flatMap((householdId) => {
        const household = households.find((item) => item.id === householdId);
        if (!household) return [];
        return request.channels.map((channel) => ({
          householdId,
          channel,
          recipient: channel === 'email' ? household.email : household.phone,
          status: 'preview' as const,
          invitationUrl: household.invitationUrl ?? buildInvitationUrl(config, household.inviteCode),
        }));
      });
      return { ok: true, dryRun: true, results };
    }
    const maxChunkSize = Math.min(10, Math.max(1, Math.floor(24 / Math.max(request.channels.length, 1))));
    const chunks: string[][] = [];
    for (let index = 0; index < request.householdIds.length; index += maxChunkSize) {
      chunks.push(request.householdIds.slice(index, index + maxChunkSize));
    }
    const baseRequestKey = request.requestKey || crypto.randomUUID();
    const responses: SendInvitationResult[] = [];
    for (let index = 0; index < chunks.length; index += 1) {
      responses.push(await repository.sendInvitations({
        ...request,
        householdIds: chunks[index],
        requestKey: `${baseRequestKey}-${index + 1}`,
      }));
    }
    const result: SendInvitationResult = {
      ok: responses.every((response) => response.ok),
      dryRun: Boolean(request.dryRun),
      results: responses.flatMap((response) => response.results),
      error: responses.find((response) => response.error)?.error,
    };
    if (!request.dryRun) {
      void repository.fetchAdminData(config).then((bundle) => {
        setInvitationDeliveries(bundle.invitationDeliveries);
      }).catch((error) => setDataError(`Invitations were submitted, but send history could not refresh: ${errorMessage(error)}`));
    }
    return result;
  }, [config, dataMode, households]);

  const signInAdmin = useCallback(async (email: string, password: string): Promise<ActionResult> => {
    try {
      const session = await repository.signInAdmin(email, password);
      setAdminSession(session);
      applyAdminBundle(await repository.fetchAdminData());
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }
  }, [applyAdminBundle]);

  const sendAdminMagicLink = useCallback(async (email: string): Promise<ActionResult> => {
    try {
      await repository.sendAdminMagicLink(email);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }
  }, []);

  const authenticateAdmin = useCallback((pin: string): boolean => {
    if (dataMode === 'supabase' || pin !== '6385') return false;
    setAdminSession({ userId: 'local-admin', email: 'local-fallback' });
    window.sessionStorage.setItem('wedding_admin_auth', 'true');
    return true;
  }, [dataMode]);

  const logoutAdmin = useCallback(async () => {
    if (dataMode === 'supabase') await repository.signOutAdmin();
    else window.sessionStorage.removeItem('wedding_admin_auth');
    setAdminSession(null);
    setActiveHouseholdState(null);
  }, [dataMode]);

  const value = useMemo<WeddingContextType>(() => ({
    config,
    siteConfig: config,
    updateConfig,
    updateSiteConfig,
    dataMode,
    isLoading,
    dataError,
    refreshData,
    households,
    guests: households,
    activeHousehold,
    setActiveHousehold,
    activeGuest: activeHousehold,
    setActiveGuest,
    lookupInvitation,
    submitHouseholdRsvp,
    createHousehold,
    updateHousehold,
    deleteHousehold,
    submitRsvp,
    registerAndRsvp,
    addGuest,
    updateGuest,
    deleteGuest,
    bulkAddGuests,
    toggleCheckIn,
    searchGuest,
    wishes,
    addWish,
    likeWish,
    registryItems,
    addRegistryItem,
    updateRegistryItem,
    deleteRegistryItem,
    scheduleEvents,
    updateScheduleEvent,
    accommodations,
    addAccommodation,
    updateAccommodation,
    deleteAccommodation,
    services,
    addService,
    updateService,
    deleteService,
    galleryItems,
    addGalleryItem,
    uploadGalleryPhoto,
    updateGalleryItem,
    deleteGalleryItem,
    invitationTemplates,
    invitationDeliveries,
    upsertInvitationTemplate,
    sendInvitations,
    isAdminOpen,
    setIsAdminOpen,
    adminSession,
    isAdminAuthenticated: Boolean(adminSession),
    signInAdmin,
    sendAdminMagicLink,
    authenticateAdmin,
    logoutAdmin,
    resetAllData: resetAppToFactoryDefaults,
  }), [
    accommodations, activeHousehold, addAccommodation, addGalleryItem, addGuest, addRegistryItem,
    addService, addWish, adminSession, authenticateAdmin, bulkAddGuests, config, createHousehold,
    dataError, dataMode, deleteAccommodation, deleteGalleryItem, deleteGuest, deleteHousehold,
    deleteRegistryItem, deleteService, galleryItems, households, invitationDeliveries,
    invitationTemplates, isAdminOpen, isLoading, likeWish, logoutAdmin, lookupInvitation,
    refreshData, registerAndRsvp, registryItems, scheduleEvents, searchGuest, sendAdminMagicLink,
    sendInvitations, services, setActiveGuest, setActiveHousehold, signInAdmin, submitHouseholdRsvp,
    submitRsvp, toggleCheckIn, updateAccommodation, updateConfig, updateGalleryItem, updateGuest,
    updateHousehold, updateRegistryItem, updateScheduleEvent, updateService, updateSiteConfig,
    uploadGalleryPhoto, upsertInvitationTemplate, wishes,
  ]);

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWedding(): WeddingContextType {
  const context = useContext(WeddingContext);
  if (!context) throw new Error('useWedding must be used within a WeddingProvider');
  return context;
}
