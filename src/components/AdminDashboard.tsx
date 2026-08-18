import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWedding } from '../context/WeddingContext';
import type { Guest, RegistryItem } from '../types/wedding';
import { exportGuestsToCsv } from '../utils/storage';
import { CutePrintButton } from './PrintInvitationModal';
import {
  X,
  Lock,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Utensils,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Edit2,
  Share2,
  FileSpreadsheet,
  Settings,
  Grid,
  AlertTriangle,
  MessageCircle,
  Gift,
  RefreshCw,
  UserPlus
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    config,
    updateConfig,
    guests = [],
    addGuest,
    updateGuest,
    deleteGuest,
    bulkAddGuests,
    registryItems = [],
    addRegistryItem,
    updateRegistryItem,
    deleteRegistryItem,
    resetAllData,
    isAdminOpen,
    setIsAdminOpen,
    isAdminAuthenticated,
    authenticateAdmin,
    logoutAdmin
  } = useWedding();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'seating' | 'wishlist' | 'settings'>('overview');

  // Search & Filter for Guests
  const [guestSearch, setGuestSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all');

  // Modals inside Admin
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedGuestForShare, setSelectedGuestForShare] = useState<Guest | null>(null);

  // Wishlist Item Modal
  const [isAddWishlistOpen, setIsAddWishlistOpen] = useState(false);
  const [editingWishlistItem, setEditingWishlistItem] = useState<RegistryItem | null>(null);
  const [wishlistTitle, setWishlistTitle] = useState('');
  const [wishlistDescription, setWishlistDescription] = useState('');
  const [wishlistType, setWishlistType] = useState<'honeymoon' | 'registry' | 'cash'>('registry');
  const [wishlistIcon, setWishlistIcon] = useState('Gift');
  const [wishlistGoal, setWishlistGoal] = useState<number | undefined>(undefined);
  const [wishlistCurrent, setWishlistCurrent] = useState<number | undefined>(undefined);
  const [wishlistLink, setWishlistLink] = useState('');
  const [wishlistAccount, setWishlistAccount] = useState('');

  // 5-Step "Are You Sure Bro" Reset Gate
  const [isResetGateOpen, setIsResetGateOpen] = useState(false);
  const [resetStep, setResetStep] = useState<number>(1);
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  // Form fields for single guest add
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestPartySize, setNewGuestPartySize] = useState(2);
  const [newGuestTable, setNewGuestTable] = useState('Table 1');
  const [newGuestPlusOne, setNewGuestPlusOne] = useState(true);

  // Bulk input
  const [bulkText, setBulkText] = useState('');

  // Copy Feedback
  const [copiedLinkFor, setCopiedLinkFor] = useState<string | null>(null);

  // Settings form state (safely populated from config)
  const [brideName, setBrideName] = useState('');
  const [brideShortName, setBrideShortName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [groomShortName, setGroomShortName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [tagline, setTagline] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Keep settings form synced with config
  useEffect(() => {
    if (config) {
      setBrideName(config.brideName || 'Abby');
      setBrideShortName(config.brideShortName || 'Abby');
      setGroomName(config.groomName || 'Cameron Liam Nel');
      setGroomShortName(config.groomShortName || 'Cam');
      setWeddingDate(config.weddingDate || '2027-01-04T15:30:00');
      setTagline(config.tagline || '');
      setHashtag(config.hashtag || '#CamAndAbbyWedding');
      setAdminPin(config.adminPin || '1234');
    }
  }, [config, isAdminOpen]);

  // Lock body scroll and handle ESC key when open
  useEffect(() => {
    if (!isAdminOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAdminOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminOpen, setIsAdminOpen]);

  // Analytics Stats Calculation (Safe with null-guards)
  const safeGuests = Array.isArray(guests) ? guests.filter(Boolean) : [];

  const stats = useMemo(() => {
    const totalGuestsOnList = safeGuests.length;
    const totalAllocatedSeats = safeGuests.reduce((acc, g) => acc + (g?.partySize || 1), 0);

    const attendingGuests = safeGuests.filter(g => g?.rsvpStatus === 'attending');
    const confirmedHeads = attendingGuests.reduce((acc, g) => acc + (g?.attendingCount || 1), 0);

    const declinedGuests = safeGuests.filter(g => g?.rsvpStatus === 'declined');
    const pendingGuests = safeGuests.filter(g => g?.rsvpStatus === 'pending');

    // Meal counts
    const mealCounts: Record<string, number> = {};
    attendingGuests.forEach(g => {
      if (g?.mealSelection) {
        mealCounts[g.mealSelection] = (mealCounts[g.mealSelection] || 0) + (g.attendingCount || 1);
      }
    });

    // Dietary requirements list
    const dietaryList = attendingGuests
      .filter(g => g && ((g.dietaryRestrictions && g.dietaryRestrictions.length > 0) || g.dietaryDetails))
      .map(g => ({
        name: g.name || 'Guest',
        restrictions: g.dietaryRestrictions || [],
        details: g.dietaryDetails || ''
      }));

    // Song requests
    const songRequests = attendingGuests
      .filter(g => g && g.songRequest && g.songRequest.trim().length > 0)
      .map(g => ({ guest: g.name || 'Guest', song: g.songRequest }));

    return {
      totalGuestsOnList,
      totalAllocatedSeats,
      attendingCount: attendingGuests.length,
      confirmedHeads,
      declinedCount: declinedGuests.length,
      pendingCount: pendingGuests.length,
      mealCounts,
      dietaryList,
      songRequests
    };
  }, [safeGuests]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    return safeGuests.filter(g => {
      if (!g) return false;
      const matchesStatus = statusFilter === 'all' || g.rsvpStatus === statusFilter;
      const q = (guestSearch || '').toLowerCase().trim();
      const matchesQuery =
        !q ||
        (g.name && g.name.toLowerCase().includes(q)) ||
        (g.inviteCode && g.inviteCode.toLowerCase().includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q)) ||
        (g.phone && g.phone.includes(q)) ||
        (g.tableNumber && g.tableNumber.toLowerCase().includes(q));

      return matchesStatus && Boolean(matchesQuery);
    });
  }, [safeGuests, guestSearch, statusFilter]);

  if (!isAdminOpen) return null;

  // Handle Login PIN
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticateAdmin(pinInput.trim())) {
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  // Handle single guest creation
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    addGuest({
      name: newGuestName.trim(),
      email: newGuestEmail.trim() || undefined,
      phone: newGuestPhone.trim() || undefined,
      partySize: Number(newGuestPartySize) || 2,
      tableNumber: newGuestTable.trim() || 'Table 1',
      isPlusOneAllowed: newGuestPlusOne
    });

    setNewGuestName('');
    setNewGuestEmail('');
    setNewGuestPhone('');
    setNewGuestPartySize(2);
    setNewGuestTable('Table 1');
    setIsAddModalOpen(false);
  };

  // Handle bulk add
  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      return {
        name: parts[0] || 'Guest',
        email: parts[1] || undefined,
        partySize: parseInt(parts[2], 10) || 2,
        tableNumber: parts[3] || 'Table 1'
      };
    });

    if (parsed.length > 0) {
      bulkAddGuests(parsed);
      setBulkText('');
      setIsBulkModalOpen(false);
    }
  };

  // Handle Wishlist Save
  const handleSaveWishlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistTitle.trim()) return;

    if (editingWishlistItem) {
      updateRegistryItem(editingWishlistItem.id, {
        title: wishlistTitle.trim(),
        description: wishlistDescription.trim(),
        type: wishlistType,
        icon: wishlistIcon,
        goalAmount: wishlistGoal,
        currentAmount: wishlistCurrent,
        link: wishlistLink.trim() || undefined,
        accountDetails: wishlistAccount.trim() || undefined
      });
    } else {
      addRegistryItem({
        title: wishlistTitle.trim(),
        description: wishlistDescription.trim(),
        type: wishlistType,
        icon: wishlistIcon,
        goalAmount: wishlistGoal,
        currentAmount: wishlistCurrent || 0,
        link: wishlistLink.trim() || undefined,
        accountDetails: wishlistAccount.trim() || undefined
      });
    }

    setIsAddWishlistOpen(false);
    setEditingWishlistItem(null);
    setWishlistTitle('');
    setWishlistDescription('');
    setWishlistLink('');
    setWishlistAccount('');
  };

  const openEditWishlist = (item: RegistryItem) => {
    setEditingWishlistItem(item);
    setWishlistTitle(item.title || '');
    setWishlistDescription(item.description || '');
    setWishlistType(item.type || 'registry');
    setWishlistIcon(item.icon || 'Gift');
    setWishlistGoal(item.goalAmount);
    setWishlistCurrent(item.currentAmount);
    setWishlistLink(item.link || '');
    setWishlistAccount(item.accountDetails || '');
    setIsAddWishlistOpen(true);
  };

  // Copy guest invite link
  const copyInviteLink = (inviteCode: string) => {
    const url = `${window.location.origin}${window.location.pathname}?code=${inviteCode}#rsvp`;
    navigator.clipboard.writeText(url);
    setCopiedLinkFor(inviteCode);
    setTimeout(() => setCopiedLinkFor(null), 2500);
  };

  // Open share template modal
  const openShareModal = (guest: Guest) => {
    setSelectedGuestForShare(guest);
    setIsShareModalOpen(true);
  };

  const getPersonalizedInviteText = (guest: Guest) => {
    const url = `${window.location.origin}${window.location.pathname}?code=${guest.inviteCode}#rsvp`;
    const formattedDate = new Date(config?.weddingDate || '2027-01-04T15:30:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return `Dear ${guest.name},\n\n` +
      `We are thrilled to invite you to celebrate our wedding at ArendsRus Country Lodge in George on ${formattedDate}!\n\n` +
      `Your personal invite code is: ${guest.inviteCode}\n\n` +
      `Please view the schedule and RSVP online here:\n${url}\n\n` +
      `With all our love,\n${config?.groomShortName || 'Cam'} & ${config?.brideShortName || 'Abby'} 💕`;
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      brideName,
      brideShortName,
      groomName,
      groomShortName,
      weddingDate,
      tagline,
      hashtag,
      adminPin
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[99999] bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={() => setIsAdminOpen(false)}
    >
      <div
        className="bg-stone-50 rounded-3xl shadow-2xl border border-blush-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-blush-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rosewood to-blush-700 text-white flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-stone-900 text-lg">
                Cam &amp; Abby Organizer Portal
              </h3>
              <p className="text-xs text-stone-500">
                ArendsRus Country Lodge • 4 January 2027
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminAuthenticated && (
              <button
                onClick={logoutAdmin}
                className="text-xs text-stone-500 hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition font-medium"
              >
                Log Out
              </button>
            )}
            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LOGIN SCREEN */}
        {!isAdminAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-full bg-blush-100 text-blush-600 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h4 className="font-serif font-semibold text-2xl text-stone-800 mb-2">
              Organizer Login
            </h4>
            <p className="text-xs text-stone-500 mb-6">
              Enter your 4-digit PIN to manage guests, view catering tallies, edit wishlist, and update wedding settings.
            </p>

            <form onSubmit={handlePinSubmit} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={8}
                  placeholder="Enter PIN (Default: 1234)"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  className="w-full text-center tracking-[0.4em] font-mono text-2xl px-4 py-3 rounded-2xl border border-blush-300 focus:outline-none focus:ring-2 focus:ring-blush-400 bg-white"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-600 mt-2 font-medium">
                    Incorrect PIN. Please try again or use default: 1234
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-r from-blush-500 to-rose-500 text-white font-semibold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition"
              >
                Access Dashboard
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD CONTENT */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Bar */}
            <div className="px-6 py-2 bg-white border-b border-blush-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {[
                  { id: 'overview', name: 'Overview & RSVP Stats', icon: Grid },
                  { id: 'guests', name: `Guest List (${safeGuests.length})`, icon: Users },
                  { id: 'seating', name: 'Seating Arrangement', icon: Users },
                  { id: 'wishlist', name: `Wishlist & Registry (${registryItems.length})`, icon: Gift },
                  { id: 'settings', name: 'Website Settings', icon: Settings },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                        isActive
                          ? 'bg-rosewood text-white shadow-sm'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportGuestsToCsv(safeGuests)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition"
                  title="Export guest list to Excel CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                {/* 5-Step "Are You Sure Bro" Factory Reset Button */}
                <button
                  onClick={() => {
                    setResetStep(1);
                    setResetConfirmationText('');
                    setIsResetGateOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition"
                  title="Reset app data to default"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset App</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top 4 KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-blush-200 shadow-sm">
                      <div className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-1">
                        Confirmed Attending
                      </div>
                      <div className="text-3xl font-serif font-bold text-emerald-700">
                        {stats.confirmedHeads} <span className="text-xs font-sans text-stone-400 font-normal">seats</span>
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{stats.attendingCount} party(ies)</span>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-blush-200 shadow-sm">
                      <div className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-1">
                        Awaiting Response
                      </div>
                      <div className="text-3xl font-serif font-bold text-amber-600">
                        {stats.pendingCount}
                      </div>
                      <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending response</span>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-blush-200 shadow-sm">
                      <div className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-1">
                        Declined Invitations
                      </div>
                      <div className="text-3xl font-serif font-bold text-rose-600">
                        {stats.declinedCount}
                      </div>
                      <div className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cannot attend</span>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-blush-200 shadow-sm">
                      <div className="text-xs uppercase tracking-wider text-stone-400 font-medium mb-1">
                        Total Guest List
                      </div>
                      <div className="text-3xl font-serif font-bold text-rosewood">
                        {stats.totalGuestsOnList}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5" />
                        <span>Max {stats.totalAllocatedSeats} capacity</span>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column: Catering Meal Tallies & Dietary Alert Board */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Catering Dishes */}
                    <div className="bg-white p-6 rounded-3xl border border-blush-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Utensils className="w-4 h-4 text-blush-600" />
                        <h4 className="font-serif font-semibold text-stone-800 text-base">
                          ArendsRus Catering Menu Tallies
                        </h4>
                      </div>

                      {Object.keys(stats.mealCounts).length === 0 ? (
                        <p className="text-xs text-stone-400 italic py-4 text-center">
                          No meal selections recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(stats.mealCounts).map(([meal, count]) => (
                            <div key={meal} className="flex items-center justify-between text-xs p-3 rounded-2xl bg-stone-50">
                              <span className="font-medium text-stone-800">{meal}</span>
                              <span className="font-bold text-rosewood font-mono text-sm px-2.5 py-0.5 bg-blush-100 rounded-lg">
                                {count} portions
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dietary Requirements */}
                    <div className="bg-white p-6 rounded-3xl border border-blush-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h4 className="font-serif font-semibold text-stone-800 text-base">
                          Chef Dietary &amp; Allergy Alert Board
                        </h4>
                      </div>

                      {stats.dietaryList.length === 0 ? (
                        <p className="text-xs text-stone-400 italic py-4 text-center">
                          No special dietary requirements reported.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto">
                          {stats.dietaryList.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs">
                              <div className="font-semibold text-amber-900 mb-0.5">{item.name}</div>
                              <div className="text-[11px] text-amber-800 flex flex-wrap gap-1">
                                {item.restrictions.map((r, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                                    {r}
                                  </span>
                                ))}
                                {item.details && <span className="italic text-stone-600">&ldquo;{item.details}&rdquo;</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GUESTS LIST MANAGER */}
              {activeTab === 'guests' && (
                <div className="space-y-4">
                  {/* Guest Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-blush-200 shadow-sm">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search guests by name, email, phone, code, table..."
                        value={guestSearch}
                        onChange={e => setGuestSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-blush-400"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700"
                      >
                        <option value="all">All RSVP Statuses</option>
                        <option value="attending">Attending</option>
                        <option value="declined">Declined</option>
                        <option value="pending">Pending</option>
                      </select>

                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blush-500 hover:bg-blush-600 text-white text-xs font-semibold shadow-md transition shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Guest</span>
                      </button>

                      <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Bulk Import</span>
                      </button>
                    </div>
                  </div>

                  {/* Guests Table */}
                  <div className="bg-white rounded-3xl border border-blush-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-stone-700">
                        <thead className="bg-stone-50 border-b border-blush-100 text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                          <tr>
                            <th className="py-3 px-4">Guest Name</th>
                            <th className="py-3 px-4">Invite Code</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Heads</th>
                            <th className="py-3 px-4">Meal &amp; Diet</th>
                            <th className="py-3 px-4">Table</th>
                            <th className="py-3 px-4">Share / Invite</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredGuests.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-stone-400 italic">
                                No guests found matching your search.
                              </td>
                            </tr>
                          ) : (
                            filteredGuests.map(guest => (
                              <tr key={guest.id} className="hover:bg-blush-50/40 transition">
                                <td className="py-3 px-4 font-medium text-stone-900">
                                  <div className="font-serif text-sm font-semibold">{guest.name}</div>
                                  <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                                    {guest.email && <span>{guest.email}</span>}
                                    {guest.phone && <span>{guest.phone}</span>}
                                  </div>
                                  {guest.companionNames && guest.companionNames.length > 0 && (
                                    <div className="text-[10px] text-blush-600 mt-0.5">
                                      + {guest.companionNames.join(', ')}
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-4 font-mono font-semibold text-rosewood">
                                  {guest.inviteCode}
                                </td>

                                <td className="py-3 px-4">
                                  {guest.rsvpStatus === 'attending' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Attending ({guest.attendingCount})
                                    </span>
                                  )}
                                  {guest.rsvpStatus === 'declined' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                      <XCircle className="w-3 h-3" />
                                      Declined
                                    </span>
                                  )}
                                  {guest.rsvpStatus === 'pending' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock className="w-3 h-3" />
                                      Pending
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4">
                                  <span className="font-medium">
                                    {guest.rsvpStatus === 'attending' ? guest.attendingCount : 0}
                                  </span>
                                  <span className="text-stone-400"> / {guest.partySize} max</span>
                                </td>

                                <td className="py-3 px-4">
                                  {guest.mealSelection ? (
                                    <div>
                                      <span className="font-medium">{guest.mealSelection}</span>
                                      {guest.dietaryRestrictions && guest.dietaryRestrictions.length > 0 && (
                                        <div className="text-[10px] text-amber-600 font-medium">
                                          {guest.dietaryRestrictions.join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-stone-400">—</span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-stone-600">
                                  {guest.tableNumber || 'Unassigned'}
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => copyInviteLink(guest.inviteCode)}
                                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-blush-100 text-stone-600 text-xs transition"
                                      title="Copy RSVP Link"
                                    >
                                      {copiedLinkFor === guest.inviteCode ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => openShareModal(guest)}
                                      className="p-1.5 rounded-lg bg-blush-50 hover:bg-blush-100 text-blush-700 text-xs transition"
                                      title="Share Invitation via WhatsApp / Email"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingGuest(guest);
                                        setIsEditModalOpen(true);
                                      }}
                                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
                                      title="Edit Guest"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Remove ${guest.name} from guest list?`)) {
                                          deleteGuest(guest.id);
                                        }
                                      }}
                                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                      title="Delete Guest"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SEATING ARRANGEMENT */}
              {activeTab === 'seating' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-serif font-semibold text-lg text-stone-800">
                      Table &amp; Seating Arrangement
                    </h4>
                    <p className="text-xs text-stone-500">
                      View guest assignments per table for the ArendsRus Barn Yard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {['Table 1 (Bridal Party & VIP)', 'Table 2 (Family Nel)', 'Table 3 (Friends)', 'Table 4 (Friends)', 'Table 5', 'Unassigned'].map(tableName => {
                      const tableGuests = safeGuests.filter(g => (g.tableNumber || 'Unassigned') === tableName);
                      const tableHeads = tableGuests.reduce((acc, g) => acc + (g.rsvpStatus === 'attending' ? g.attendingCount : g.partySize), 0);

                      return (
                        <div key={tableName} className="bg-white rounded-3xl border border-blush-200 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                            <span className="font-serif font-bold text-stone-800 text-sm">{tableName}</span>
                            <span className="text-[11px] text-stone-500 font-medium">{tableHeads} seats filled</span>
                          </div>

                          <div className="space-y-2">
                            {tableGuests.length === 0 ? (
                              <div className="text-[11px] text-stone-400 py-3 text-center italic">No guests assigned yet</div>
                            ) : (
                              tableGuests.map(g => (
                                <div key={g.id} className="p-2.5 rounded-2xl bg-stone-50 text-xs flex items-center justify-between">
                                  <div>
                                    <span className="font-semibold text-stone-800">{g.name}</span>
                                    {g.companionNames && g.companionNames.length > 0 && (
                                      <span className="text-stone-500 text-[10px] block">
                                        + {g.companionNames.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    g.rsvpStatus === 'attending' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                                  }`}>
                                    {g.rsvpStatus}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: WISHLIST & REGISTRY MANAGER */}
              {activeTab === 'wishlist' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-semibold text-lg text-stone-800">
                        Wishlist &amp; Registry Items
                      </h4>
                      <p className="text-xs text-stone-500">
                        Add, edit, and manage your gift wishlist and honeymoon funds. Persists automatically.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingWishlistItem(null);
                        setWishlistTitle('');
                        setWishlistDescription('');
                        setWishlistType('registry');
                        setWishlistIcon('Gift');
                        setWishlistGoal(undefined);
                        setWishlistCurrent(undefined);
                        setWishlistLink('');
                        setWishlistAccount('');
                        setIsAddWishlistOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blush-500 hover:bg-blush-600 text-white text-xs font-semibold shadow-md transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Wishlist Item</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {registryItems.map(item => (
                      <div key={item.id} className="bg-white rounded-3xl p-6 border border-blush-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-blush-100 text-rosewood">
                              {item.type}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditWishlist(item)}
                                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
                                title="Edit item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteRegistryItem(item.id)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h5 className="font-serif font-semibold text-base text-stone-800 mb-1">
                            {item.title}
                          </h5>
                          <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                            {item.description}
                          </p>

                          {item.goalAmount && (
                            <div className="p-3 rounded-2xl bg-stone-50 text-xs mb-3 font-mono">
                              <div>Goal: R{item.goalAmount.toLocaleString()}</div>
                              <div>Current: R{(item.currentAmount || 0).toLocaleString()}</div>
                            </div>
                          )}

                          {item.accountDetails && (
                            <div className="text-[11px] font-mono text-stone-600 bg-stone-50 p-2.5 rounded-xl truncate mb-3">
                              {item.accountDetails}
                            </div>
                          )}
                        </div>

                        {item.link && (
                          <div className="text-[11px] text-blush-600 truncate underline pt-2 border-t border-stone-100">
                            {item.link}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: WEBSITE SETTINGS */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blush-200 shadow-sm max-w-2xl">
                  <h4 className="font-serif font-semibold text-xl text-stone-800 mb-4">
                    Wedding Configuration &amp; Details
                  </h4>

                  {settingsSaved && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                      ✓ Settings saved and persisted successfully!
                    </div>
                  )}

                  <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">Bride Full Name</label>
                        <input
                          type="text"
                          value={brideName}
                          onChange={e => setBrideName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">Bride Short / Display Name</label>
                        <input
                          type="text"
                          value={brideShortName}
                          onChange={e => setBrideShortName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">Groom Full Name</label>
                        <input
                          type="text"
                          value={groomName}
                          onChange={e => setGroomName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-600 font-semibold mb-1">Groom Short / Display Name</label>
                        <input
                          type="text"
                          value={groomShortName}
                          onChange={e => setGroomShortName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Wedding Date &amp; Time</label>
                      <input
                        type="datetime-local"
                        value={weddingDate ? weddingDate.slice(0, 16) : '2027-01-04T15:30'}
                        onChange={e => setWeddingDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Tagline</label>
                      <input
                        type="text"
                        value={tagline}
                        onChange={e => setTagline(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Hashtag</label>
                      <input
                        type="text"
                        value={hashtag}
                        onChange={e => setHashtag(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Admin Dashboard PIN</label>
                      <input
                        type="text"
                        value={adminPin}
                        onChange={e => setAdminPin(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-full bg-blush-500 hover:bg-blush-600 text-white font-semibold uppercase tracking-wider shadow-md transition"
                    >
                      Save Configuration
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD SINGLE GUEST */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-blush-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif font-semibold text-lg text-stone-800">Add New Guest</h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGuest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newGuestName}
                  onChange={e => setNewGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none focus:ring-1 focus:ring-blush-400"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={newGuestEmail}
                  onChange={e => setNewGuestEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Phone / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+27 (082) 000-0000"
                  value={newGuestPhone}
                  onChange={e => setNewGuestPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Max Party Size</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newGuestPartySize}
                    onChange={e => setNewGuestPartySize(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Table Assigned</label>
                  <input
                    type="text"
                    value={newGuestTable}
                    onChange={e => setNewGuestTable(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newGuestPlusOne}
                  onChange={e => setNewGuestPlusOne(e.target.checked)}
                  className="rounded text-blush-500 focus:ring-blush-400"
                />
                <span className="text-stone-700">Allow guest to bring companion/plus-one</span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-blush-500 hover:bg-blush-600 text-white font-medium shadow-md transition"
                >
                  Create Guest
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK IMPORT */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-blush-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif font-semibold text-lg text-stone-800">Bulk Import Guests</h4>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 mb-3">
              Paste one guest per line in the format: <br />
              <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-[11px]">Name, Email, MaxParty, Table</code>
            </p>

            <form onSubmit={handleBulkImport} className="space-y-4">
              <textarea
                rows={6}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder="Uncle James, james@example.com, 2, Table 2
Aunt Sarah, sarah@example.com, 2, Table 2
Michael Smith, michael@example.com, 1, Table 4"
                className="w-full p-3 rounded-xl border border-stone-200 text-xs font-mono outline-none focus:ring-1 focus:ring-blush-400"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-blush-500 hover:bg-blush-600 text-white font-medium text-xs shadow-md transition"
                >
                  Import All Guests
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT GUEST */}
      {isEditModalOpen && editingGuest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-blush-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif font-semibold text-lg text-stone-800">Edit Guest Details</h4>
              <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                updateGuest(editingGuest.id, editingGuest);
                setIsEditModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-stone-600 font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingGuest.name}
                  onChange={e => setEditingGuest({ ...editingGuest, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={editingGuest.email || ''}
                    onChange={e => setEditingGuest({ ...editingGuest, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingGuest.phone || ''}
                    onChange={e => setEditingGuest({ ...editingGuest, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">RSVP Status</label>
                <select
                  value={editingGuest.rsvpStatus}
                  onChange={e => setEditingGuest({ ...editingGuest, rsvpStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                >
                  <option value="attending">Attending</option>
                  <option value="declined">Declined</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Attending Count</label>
                  <input
                    type="number"
                    value={editingGuest.attendingCount}
                    onChange={e => setEditingGuest({ ...editingGuest, attendingCount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Table Assigned</label>
                  <input
                    type="text"
                    value={editingGuest.tableNumber || ''}
                    onChange={e => setEditingGuest({ ...editingGuest, tableNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-blush-500 hover:bg-blush-600 text-white font-medium shadow-md transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SHARE INVITATION MODAL */}
      {isShareModalOpen && selectedGuestForShare && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-blush-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blush-500" />
                <h4 className="font-serif font-semibold text-lg text-stone-800">
                  Invite {selectedGuestForShare.name}
                </h4>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 mb-4">
              Copy this personalized message to send via WhatsApp, SMS, or Email:
            </p>

            <textarea
              readOnly
              rows={6}
              value={getPersonalizedInviteText(selectedGuestForShare)}
              className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700 mb-4 select-all"
            />

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getPersonalizedInviteText(selectedGuestForShare));
                  alert('Copied invitation message to clipboard!');
                }}
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-blush-500 to-rose-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Full Message &amp; Link</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(getPersonalizedInviteText(selectedGuestForShare))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-center">
              <CutePrintButton guestName={selectedGuestForShare.name} variant="outline" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD / EDIT WISHLIST ITEM */}
      {isAddWishlistOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-blush-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif font-semibold text-lg text-stone-800">
                {editingWishlistItem ? 'Edit Wishlist Item' : 'Add Wishlist Item'}
              </h4>
              <button onClick={() => setIsAddWishlistOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWishlist} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Honeymoon Safari Fund or Le Creuset Cookware"
                  value={wishlistTitle}
                  onChange={e => setWishlistTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details or notes about the gift..."
                  value={wishlistDescription}
                  onChange={e => setWishlistDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Type</label>
                  <select
                    value={wishlistType}
                    onChange={e => setWishlistType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  >
                    <option value="registry">Store Registry</option>
                    <option value="honeymoon">Honeymoon Fund</option>
                    <option value="cash">Direct Bank / EFT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">Icon</label>
                  <select
                    value={wishlistIcon}
                    onChange={e => setWishlistIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  >
                    <option value="Gift">Gift Box 🎁</option>
                    <option value="Plane">Plane / Travel ✈️</option>
                    <option value="Wine">Wine / Dining 🍷</option>
                  </select>
                </div>
              </div>

              {wishlistType === 'honeymoon' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">Goal Amount (R)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={wishlistGoal || ''}
                      onChange={e => setWishlistGoal(parseInt(e.target.value, 10) || undefined)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-1">Current Amount (R)</label>
                    <input
                      type="number"
                      placeholder="e.g. 10000"
                      value={wishlistCurrent || ''}
                      onChange={e => setWishlistCurrent(parseInt(e.target.value, 10) || undefined)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-stone-600 font-medium mb-1">Store / Registry URL</label>
                <input
                  type="url"
                  placeholder="https://www.yuppiechef.com/..."
                  value={wishlistLink}
                  onChange={e => setWishlistLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Banking / EFT Reference Details</label>
                <input
                  type="text"
                  placeholder="Capitec Acc: 123456789 | Ref: CamAbby"
                  value={wishlistAccount}
                  onChange={e => setWishlistAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-blush-500 hover:bg-blush-600 text-white font-medium shadow-md transition"
                >
                  {editingWishlistItem ? 'Save Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddWishlistOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: 5-STEP "ARE YOU SURE BRO" FACTORY RESET GATE */}
      {isResetGateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-rose-400 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-3">
              Confirmation Gate: Step {resetStep} of 5
            </div>

            {/* Step 1 */}
            {resetStep === 1 && (
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-xl text-stone-900">
                  Are you sure bro?
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  This will reset all saved guests, wishlist items, RSVPs, and settings back to default.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setResetStep(2)}
                    className="flex-1 py-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold uppercase tracking-wider shadow-md transition"
                  >
                    Yes, I&apos;m sure bro →
                  </button>
                  <button
                    onClick={() => setIsResetGateOpen(false)}
                    className="px-5 py-3 rounded-full bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {resetStep === 2 && (
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-xl text-stone-900">
                  Are you really sure bro?
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Any guest list your partner or you added during testing will be permanently deleted!
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setResetStep(3)}
                    className="flex-1 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider shadow-md transition"
                  >
                    Yes bro, I know what I&apos;m doing →
                  </button>
                  <button
                    onClick={() => setIsResetGateOpen(false)}
                    className="px-5 py-3 rounded-full bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    Nevermind
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {resetStep === 3 && (
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-xl text-stone-900">
                  Bro... serious question: are you 1000% sure?
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  There is literally no undo button. Once wiped, it&apos;s gone to the shadow realm.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setResetStep(4)}
                    className="flex-1 py-3 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold uppercase tracking-wider shadow-md transition"
                  >
                    Bro, please just let me reset it →
                  </button>
                  <button
                    onClick={() => setIsResetGateOpen(false)}
                    className="px-5 py-3 rounded-full bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {resetStep === 4 && (
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-xl text-stone-900">
                  Almost nuked! Last warning, bro! 🚨
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Are you prepared to rebuild your guest list from scratch if you change your mind?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setResetStep(5)}
                    className="flex-1 py-3 rounded-full bg-rose-800 hover:bg-rose-900 text-white text-xs font-semibold uppercase tracking-wider shadow-md transition"
                  >
                    Nuke it, bro →
                  </button>
                  <button
                    onClick={() => setIsResetGateOpen(false)}
                    className="px-5 py-3 rounded-full bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    Abort!
                  </button>
                </div>
              </div>
            )}

            {/* Step 5 */}
            {resetStep === 5 && (
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-xl text-stone-900">
                  Final Gate: Type &ldquo;RESET&rdquo; below
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Type <strong className="font-mono text-rose-600">RESET</strong> to execute the full factory wipe:
                </p>

                <input
                  type="text"
                  placeholder="Type RESET"
                  value={resetConfirmationText}
                  onChange={e => setResetConfirmationText(e.target.value)}
                  className="w-full text-center font-mono font-bold text-base px-3 py-2 rounded-xl border-2 border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                  autoFocus
                />

                <div className="flex gap-2 pt-2">
                  <button
                    disabled={resetConfirmationText.trim().toUpperCase() !== 'RESET'}
                    onClick={() => {
                      resetAllData();
                    }}
                    className="flex-1 py-3 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider shadow-lg transition"
                  >
                    💥 Permanently Wipe &amp; Reset Everything
                  </button>
                  <button
                    onClick={() => setIsResetGateOpen(false)}
                    className="px-5 py-3 rounded-full bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalNode, document.body);
};
