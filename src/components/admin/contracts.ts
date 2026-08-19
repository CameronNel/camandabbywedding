import type {
  Accommodation,
  ActionResult,
  AdminSession,
  DataMode,
  GalleryItem,
  Guest,
  HouseholdDraft,
  HouseholdInvitation,
  InvitationDelivery,
  InvitationTemplate,
  RegistryItem,
  SendInvitationRequest,
  SendInvitationResult,
  WeddingConfig,
  WeddingService,
} from '../../types/wedding';

export type MaybePromise<T> = T | Promise<T>;

export interface ProviderStatus {
  email?: boolean;
  sms?: boolean;
  whatsapp?: boolean;
  emailError?: string;
  smsError?: string;
  whatsappError?: string;
}

export interface AdminContextContract {
  config: WeddingConfig;
  siteConfig?: WeddingConfig;
  updateConfig: (updates: Partial<WeddingConfig>) => MaybePromise<void>;
  updateSiteConfig?: (updates: Partial<WeddingConfig> & Record<string, unknown>) => MaybePromise<void>;

  households?: HouseholdInvitation[];
  guests: Guest[];
  createHousehold?: (draft: HouseholdDraft) => Promise<HouseholdInvitation>;
  updateHousehold?: (id: string, updates: Partial<HouseholdInvitation>) => Promise<void>;
  deleteHousehold?: (id: string) => Promise<void>;
  addGuest?: (guest: Partial<Guest>) => Guest;
  updateGuest?: (id: string, updates: Partial<Guest>) => MaybePromise<void>;
  deleteGuest?: (id: string) => MaybePromise<void>;

  accommodations?: Accommodation[];
  addAccommodation?: (item: Omit<Accommodation, 'id'>) => Promise<Accommodation>;
  updateAccommodation?: (id: string | number, updates: Partial<Accommodation>) => MaybePromise<void>;
  deleteAccommodation?: (id: string) => Promise<void>;
  services?: WeddingService[];
  addService?: (item: Omit<WeddingService, 'id'>) => Promise<WeddingService>;
  updateService?: (id: string, updates: Partial<WeddingService>) => Promise<void>;
  deleteService?: (id: string) => Promise<void>;

  galleryItems?: GalleryItem[];
  uploadGalleryPhoto?: (file: File, metadata: Partial<GalleryItem>) => Promise<GalleryItem>;
  addGalleryItem?: (item: Omit<GalleryItem, 'id'>) => Promise<GalleryItem>;
  updateGalleryItem?: (id: string, updates: Partial<GalleryItem>) => Promise<void>;
  deleteGalleryItem?: (id: string) => Promise<void>;

  registryItems?: RegistryItem[];
  addRegistryItem?: (item: Omit<RegistryItem, 'id'>) => MaybePromise<void>;
  updateRegistryItem?: (id: string, item: Partial<RegistryItem>) => MaybePromise<void>;
  deleteRegistryItem?: (id: string) => MaybePromise<void>;

  invitationTemplates?: InvitationTemplate[];
  invitationDeliveries?: InvitationDelivery[];
  upsertInvitationTemplate?: (template: InvitationTemplate) => Promise<InvitationTemplate>;
  sendInvitations?: (request: SendInvitationRequest) => Promise<SendInvitationResult>;
  providerStatus?: ProviderStatus;

  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  adminSession?: AdminSession | null;
  dataMode?: DataMode;
  signInAdmin?: (email: string, password: string) => Promise<ActionResult>;
  sendAdminMagicLink?: (email: string) => Promise<ActionResult>;
  authenticateAdmin: (pin: string) => boolean;
  logoutAdmin: () => MaybePromise<void>;
}

export interface ToastState {
  tone: 'success' | 'error' | 'info';
  message: string;
}
