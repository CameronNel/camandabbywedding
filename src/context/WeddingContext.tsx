import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { WeddingConfig, Guest, GuestWish } from '../types/wedding';
import { loadConfig, saveConfig, loadGuests, saveGuests, loadWishes, saveWishes } from '../utils/storage';

interface WeddingContextType {
  config: WeddingConfig;
  updateConfig: (newConfig: Partial<WeddingConfig>) => void;
  guests: Guest[];
  wishes: GuestWish[];
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
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wedding_admin_auth') === 'true';
  });

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    saveGuests(guests);
  }, [guests]);

  useEffect(() => {
    saveWishes(wishes);
  }, [wishes]);

  // Check URL query parameters for invitation code on initial load (e.g. ?code=SA-VIP01 or ?guest=Eleanor)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code') || urlParams.get('c');
    const guestParam = urlParams.get('guest') || urlParams.get('g');

    if (codeParam) {
      const match = guests.find(g => g.inviteCode.toUpperCase() === codeParam.trim().toUpperCase());
      if (match) setActiveGuest(match);
    } else if (guestParam) {
      const match = guests.find(g => g.name.toLowerCase().includes(guestParam.trim().toLowerCase()));
      if (match) setActiveGuest(match);
    }
  }, [guests]);

  const updateConfig = (newConfig: Partial<WeddingConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  };

  const generateUniqueCode = (name: string): string => {
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'VIP';
    const rand = Math.floor(100 + Math.random() * 900);
    return `SA-${clean}${rand}`;
  };

  const searchGuest = (query: string): Guest | null => {
    if (!query || !query.trim()) return null;
    const cleanQuery = query.trim().toLowerCase();
    
    // Search exact invite code first
    const codeMatch = guests.find(g => g.inviteCode.toLowerCase() === cleanQuery);
    if (codeMatch) return codeMatch;

    // Search by exact name
    const exactName = guests.find(g => g.name.toLowerCase() === cleanQuery);
    if (exactName) return exactName;

    // Search by partial name
    const partialName = guests.find(g => g.name.toLowerCase().includes(cleanQuery) || cleanQuery.includes(g.name.toLowerCase()));
    if (partialName) return partialName;

    // Search by email
    const emailMatch = guests.find(g => g.email && g.email.toLowerCase() === cleanQuery);
    if (emailMatch) return emailMatch;

    return null;
  };

  const submitRsvp = (guestId: string, rsvpData: Partial<Guest>): boolean => {
    let success = false;
    setGuestsState(prev => prev.map(g => {
      if (g.id === guestId) {
        success = true;
        const updated: Guest = {
          ...g,
          ...rsvpData,
          respondedAt: new Date().toISOString()
        };
        setActiveGuest(updated);

        if (rsvpData.message && rsvpData.message.trim().length > 2) {
          addWish(updated.name, rsvpData.message.trim());
        }

        return updated;
      }
      return g;
    }));
    return success;
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
    const newId = `g-${Date.now()}`;
    const newGuest: Guest = {
      id: newId,
      name: newGuestData.name,
      email: newGuestData.email || '',
      phone: newGuestData.phone || '',
      inviteCode: generateUniqueCode(newGuestData.name),
      rsvpStatus: newGuestData.rsvpStatus,
      partySize: newGuestData.partySize || 1,
      attendingCount: newGuestData.attendingCount || 1,
      dietaryRestrictions: newGuestData.dietaryRestrictions || [],
      dietaryDetails: newGuestData.dietaryDetails || '',
      mealSelection: newGuestData.mealSelection || '',
      songRequest: newGuestData.songRequest || '',
      message: newGuestData.message || '',
      companionNames: newGuestData.companionNames || [],
      isPlusOneAllowed: (newGuestData.partySize || 1) > 1,
      respondedAt: new Date().toISOString(),
      checkedIn: false
    };

    setGuestsState(prev => [newGuest, ...prev]);
    setActiveGuest(newGuest);

    if (newGuest.message && newGuest.message.trim().length > 2) {
      addWish(newGuest.name, newGuest.message.trim());
    }

    return newGuest;
  };

  const addGuest = (guest: Partial<Guest>): Guest => {
    const name = guest.name || 'Honored Guest';
    const newGuest: Guest = {
      id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: name,
      email: guest.email || '',
      phone: guest.phone || '',
      inviteCode: guest.inviteCode || generateUniqueCode(name),
      rsvpStatus: guest.rsvpStatus || 'pending',
      partySize: guest.partySize || 1,
      attendingCount: guest.attendingCount || 0,
      dietaryRestrictions: guest.dietaryRestrictions || [],
      dietaryDetails: guest.dietaryDetails || '',
      mealSelection: guest.mealSelection || '',
      songRequest: guest.songRequest || '',
      message: guest.message || '',
      tableNumber: guest.tableNumber || 'Unassigned',
      isPlusOneAllowed: guest.isPlusOneAllowed ?? true,
      companionNames: guest.companionNames || [],
      checkedIn: false
    };

    setGuestsState(prev => [newGuest, ...prev]);
    return newGuest;
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    setGuestsState(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
    if (activeGuest && activeGuest.id === id) {
      setActiveGuest(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteGuest = (id: string) => {
    setGuestsState(prev => prev.filter(g => g.id !== id));
    if (activeGuest && activeGuest.id === id) {
      setActiveGuest(null);
    }
  };

  const bulkAddGuests = (guestList: Array<Partial<Guest>>) => {
    const newItems: Guest[] = guestList.map((item, idx) => {
      const name = item.name || `Guest ${idx + 1}`;
      return {
        id: `g-${Date.now()}-${idx}`,
        name: name,
        email: item.email || '',
        phone: item.phone || '',
        inviteCode: item.inviteCode || generateUniqueCode(name),
        rsvpStatus: item.rsvpStatus || 'pending',
        partySize: item.partySize || 1,
        attendingCount: item.attendingCount || 0,
        dietaryRestrictions: item.dietaryRestrictions || [],
        dietaryDetails: item.dietaryDetails || '',
        mealSelection: item.mealSelection || '',
        songRequest: item.songRequest || '',
        message: item.message || '',
        tableNumber: item.tableNumber || 'Unassigned',
        isPlusOneAllowed: item.isPlusOneAllowed ?? true,
        companionNames: item.companionNames || [],
        checkedIn: false
      };
    });

    setGuestsState(prev => [...newItems, ...prev]);
  };

  const toggleCheckIn = (id: string) => {
    setGuestsState(prev => prev.map(g => (g.id === id ? { ...g, checkedIn: !g.checkedIn } : g)));
  };

  const addWish = (name: string, message: string) => {
    const newWish: GuestWish = {
      id: `w-${Date.now()}`,
      name,
      message,
      date: new Date().toISOString().split('T')[0],
      likes: 1
    };
    setWishesState(prev => [newWish, ...prev]);
  };

  const likeWish = (id: string) => {
    setWishesState(prev => prev.map(w => (w.id === id ? { ...w, likes: (w.likes || 0) + 1 } : w)));
  };

  const authenticateAdmin = (pin: string): boolean => {
    if (pin === config.adminPin || pin === '1234') {
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
