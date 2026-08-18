import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { WeddingConfig, Guest, GuestWish, RegistryItem, ScheduleEvent, Accommodation } from '../types/wedding';
import {
  loadConfig,
  saveConfig,
  loadGuests,
  saveGuests,
  loadWishes,
  saveWishes,
  loadRegistry,
  saveRegistry,
  loadSchedule,
  saveSchedule,
  loadAccommodations,
  saveAccommodations,
  resetAppToFactoryDefaults
} from '../utils/storage';

interface WeddingContextType {
  config: WeddingConfig;
  updateConfig: (newConfig: Partial<WeddingConfig>) => void;
  guests: Guest[];
  wishes: GuestWish[];
  registryItems: RegistryItem[];
  scheduleEvents: ScheduleEvent[];
  accommodations: Accommodation[];
  activeGuest: Guest | null;
  setActiveGuest: (guest: Guest | null) => void;
  submitRsvp: (guestId: string, rsvpData: Partial<Guest>) => boolean;
  registerAndRsvp: (newGuest: {
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
  }) => Guest;
  addGuest: (guest: Partial<Guest>) => Guest;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  bulkAddGuests: (guestList: Array<Partial<Guest>>) => void;
  toggleCheckIn: (id: string) => void;
  addWish: (name: string, message: string) => void;
  likeWish: (id: string) => void;
  addRegistryItem: (item: Omit<RegistryItem, 'id'>) => void;
  updateRegistryItem: (id: string, item: Partial<RegistryItem>) => void;
  deleteRegistryItem: (id: string) => void;
  updateScheduleEvent: (index: number, event: Partial<ScheduleEvent>) => void;
  updateAccommodation: (index: number, acc: Partial<Accommodation>) => void;
  resetAllData: () => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  authenticateAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;
  searchGuest: (query: string) => Guest | null;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

export const WeddingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<WeddingConfig>(loadConfig);
  const [guests, setGuestsState] = useState<Guest[]>(loadGuests);
  const [wishes, setWishesState] = useState<GuestWish[]>(loadWishes);
  const [registryItems, setRegistryItemsState] = useState<RegistryItem[]>(loadRegistry);
  const [scheduleEvents, setScheduleEventsState] = useState<ScheduleEvent[]>(loadSchedule);
  const [accommodations, setAccommodationsState] = useState<Accommodation[]>(loadAccommodations);

  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wedding_admin_auth') === 'true';
  });

  // Persistent synchronizers
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    saveGuests(guests);
  }, [guests]);

  useEffect(() => {
    saveWishes(wishes);
  }, [wishes]);

  useEffect(() => {
    saveRegistry(registryItems);
  }, [registryItems]);

  useEffect(() => {
    saveSchedule(scheduleEvents);
  }, [scheduleEvents]);

  useEffect(() => {
    saveAccommodations(accommodations);
  }, [accommodations]);

  // URL query parameter invite lookup (e.g. ?code=CA-VIP01 or ?guest=Eleanor)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || params.get('c');
    const guestParam = params.get('guest') || params.get('g');

    if (code) {
      const match = guests.find(g => g.inviteCode.toUpperCase() === code.trim().toUpperCase());
      if (match) setActiveGuest(match);
    } else if (guestParam) {
      const match = guests.find(g => g.name.toLowerCase().includes(guestParam.trim().toLowerCase()));
      if (match) setActiveGuest(match);
    }
  }, [guests]);

  const updateConfig = (newConfig: Partial<WeddingConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  };

  const addGuest = (guestData: Partial<Guest>): Guest => {
    const id = `g-${Date.now()}`;
    const initials = (guestData.name || 'G')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const inviteCode = `CA-${initials}${randomDigits}`;

    const newGuest: Guest = {
      id,
      name: guestData.name || 'Guest',
      email: guestData.email || '',
      phone: guestData.phone || '',
      inviteCode,
      rsvpStatus: (guestData.rsvpStatus as 'attending' | 'declined' | 'pending') || 'pending',
      partySize: guestData.partySize || 2,
      attendingCount: guestData.attendingCount || 0,
      dietaryRestrictions: guestData.dietaryRestrictions || [],
      dietaryDetails: guestData.dietaryDetails || '',
      mealSelection: guestData.mealSelection || '',
      songRequest: guestData.songRequest || '',
      message: guestData.message || '',
      tableNumber: guestData.tableNumber || 'Unassigned',
      isPlusOneAllowed: guestData.isPlusOneAllowed ?? true,
      companionNames: guestData.companionNames || [],
      checkedIn: false
    };

    setGuestsState(prev => [newGuest, ...prev]);
    return newGuest;
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    setGuestsState(prev =>
      prev.map(g => (g.id === id ? { ...g, ...updates } : g))
    );
    if (activeGuest && activeGuest.id === id) {
      setActiveGuest(prev => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteGuest = (id: string) => {
    setGuestsState(prev => prev.filter(g => g.id !== id));
    if (activeGuest && activeGuest.id === id) {
      setActiveGuest(null);
    }
  };

  const bulkAddGuests = (guestList: Array<Partial<Guest>>) => {
    const created = guestList.map((g, idx) => {
      const id = `g-${Date.now()}-${idx}`;
      const initials = (g.name || 'G')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      const inviteCode = `CA-${initials}${Math.floor(1000 + Math.random() * 9000)}`;

      return {
        id,
        name: g.name || 'Guest',
        email: g.email || '',
        phone: g.phone || '',
        inviteCode,
        rsvpStatus: 'pending' as const,
        partySize: g.partySize || 2,
        attendingCount: 0,
        dietaryRestrictions: [],
        tableNumber: g.tableNumber || 'Unassigned',
        isPlusOneAllowed: g.isPlusOneAllowed ?? true,
        companionNames: []
      };
    });

    setGuestsState(prev => [...created, ...prev]);
  };

  const toggleCheckIn = (id: string) => {
    setGuestsState(prev =>
      prev.map(g => (g.id === id ? { ...g, checkedIn: !g.checkedIn } : g))
    );
  };

  const submitRsvp = (guestId: string, rsvpData: Partial<Guest>): boolean => {
    const target = guests.find(g => g.id === guestId);
    if (!target) return false;

    const updated: Guest = {
      ...target,
      ...rsvpData,
      respondedAt: new Date().toISOString()
    };

    setGuestsState(prev => prev.map(g => (g.id === guestId ? updated : g)));
    setActiveGuest(updated);

    // If guest left a blessing note, append to wishes wall
    if (rsvpData.message && rsvpData.message.trim().length > 3) {
      addWish(target.name, rsvpData.message.trim());
    }

    return true;
  };

  const registerAndRsvp = (newGuestData: {
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
  }): Guest => {
    const created = addGuest(newGuestData);
    const finalGuest: Guest = {
      ...created,
      ...newGuestData,
      respondedAt: new Date().toISOString()
    };
    updateGuest(created.id, finalGuest);
    setActiveGuest(finalGuest);

    if (newGuestData.message && newGuestData.message.trim().length > 3) {
      addWish(newGuestData.name, newGuestData.message.trim());
    }

    return finalGuest;
  };

  const searchGuest = (query: string): Guest | null => {
    if (!query || !query.trim()) return null;
    const clean = query.trim().toLowerCase();

    // Match exact code first
    const codeMatch = guests.find(g => g.inviteCode.toLowerCase() === clean);
    if (codeMatch) return codeMatch;

    // Match full name
    const exactNameMatch = guests.find(g => g.name.toLowerCase() === clean);
    if (exactNameMatch) return exactNameMatch;

    // Match partial name
    const partialMatch = guests.find(g => g.name.toLowerCase().includes(clean));
    if (partialMatch) return partialMatch;

    // Match email or phone
    const contactMatch = guests.find(
      g => (g.email && g.email.toLowerCase() === clean) || (g.phone && g.phone.includes(clean))
    );
    if (contactMatch) return contactMatch;

    return null;
  };

  const addWish = (name: string, message: string) => {
    const newWish: GuestWish = {
      id: `w-${Date.now()}`,
      name,
      message,
      date: new Date().toISOString().slice(0, 10),
      likes: 1
    };
    setWishesState(prev => [newWish, ...prev]);
  };

  const likeWish = (id: string) => {
    setWishesState(prev =>
      prev.map(w => (w.id === id ? { ...w, likes: (w.likes || 0) + 1 } : w))
    );
  };

  const addRegistryItem = (item: Omit<RegistryItem, 'id'>) => {
    const newItem: RegistryItem = {
      ...item,
      id: `reg-${Date.now()}`
    };
    setRegistryItemsState(prev => [...prev, newItem]);
  };

  const updateRegistryItem = (id: string, item: Partial<RegistryItem>) => {
    setRegistryItemsState(prev =>
      prev.map(r => (r.id === id ? { ...r, ...item } : r))
    );
  };

  const deleteRegistryItem = (id: string) => {
    setRegistryItemsState(prev => prev.filter(r => r.id !== id));
  };

  const updateScheduleEvent = (index: number, event: Partial<ScheduleEvent>) => {
    setScheduleEventsState(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], ...event };
      }
      return next;
    });
  };

  const updateAccommodation = (index: number, acc: Partial<Accommodation>) => {
    setAccommodationsState(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], ...acc };
      }
      return next;
    });
  };

  const resetAllData = () => {
    resetAppToFactoryDefaults();
  };

  const authenticateAdmin = (pin: string): boolean => {
    if (pin === config.adminPin) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('wedding_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('wedding_admin_auth');
  };

  return (
    <WeddingContext.Provider
      value={{
        config,
        updateConfig,
        guests,
        wishes,
        registryItems,
        scheduleEvents,
        accommodations,
        activeGuest,
        setActiveGuest,
        submitRsvp,
        registerAndRsvp,
        addGuest,
        updateGuest,
        deleteGuest,
        bulkAddGuests,
        toggleCheckIn,
        addWish,
        likeWish,
        addRegistryItem,
        updateRegistryItem,
        deleteRegistryItem,
        updateScheduleEvent,
        updateAccommodation,
        resetAllData,
        isAdminOpen,
        setIsAdminOpen,
        isAdminAuthenticated,
        authenticateAdmin,
        logoutAdmin,
        searchGuest
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = () => {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
};
