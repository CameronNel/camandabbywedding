import React, { useState, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import type { Guest } from '../types/wedding';
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
  Music,
  Download,
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
  MessageCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    config,
    updateConfig,
    guests,
    addGuest,
    bulkAddGuests,
    updateGuest,
    deleteGuest,
    isAdminOpen,
    setIsAdminOpen,
    isAdminAuthenticated,
    authenticateAdmin,
    logoutAdmin
  } = useWedding();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'guests' | 'seating' | 'music' | 'settings'>('analytics');

  // Guest list filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLinkFor, setCopiedLinkFor] = useState<string | null>(null);

  // Modals for Add Guest & Bulk Import
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedGuestForShare, setSelectedGuestForShare] = useState<Guest | null>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // New Guest Form State
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestPartySize, setNewGuestPartySize] = useState(2);
  const [newGuestTable, setNewGuestTable] = useState('Table 1');
  const [bulkText, setBulkText] = useState('');

  // Settings Form State
  const [brideName, setBrideName] = useState(config.brideName);
  const [brideShortName, setBrideShortName] = useState(config.brideShortName);
  const [groomName, setGroomName] = useState(config.groomName);
  const [groomShortName, setGroomShortName] = useState(config.groomShortName);
  const [weddingDate, setWeddingDate] = useState(config.weddingDate.slice(0, 16));
  const [tagline, setTagline] = useState(config.tagline);
  const [hashtag, setHashtag] = useState(config.hashtag);
  const [adminPin, setAdminPin] = useState(config.adminPin);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Analytics Computations
  const stats = useMemo(() => {
    const totalInvitedGuests = guests.reduce((acc, g) => acc + (g.partySize || 1), 0);
    const attendingGuests = guests.filter(g => g.rsvpStatus === 'attending');
    const totalAttendingHeads = attendingGuests.reduce((acc, g) => acc + (g.attendingCount || 1), 0);
    const declinedCount = guests.filter(g => g.rsvpStatus === 'declined').length;
    const pendingCount = guests.filter(g => g.rsvpStatus === 'pending').length;

    // Meal counts
    const mealCounts: Record<string, number> = {};
    config.mealOptions.forEach(m => {
      mealCounts[m.name] = 0;
    });

    attendingGuests.forEach(g => {
      if (g.mealSelection && mealCounts[g.mealSelection] !== undefined) {
        mealCounts[g.mealSelection] += 1;
      } else if (g.mealSelection) {
        mealCounts[g.mealSelection] = (mealCounts[g.mealSelection] || 0) + 1;
      }
    });

    // Dietary Restrictions
    const dietaryList: Array<{ guest: string; restrictions: string[]; details?: string }> = [];
    attendingGuests.forEach(g => {
      if ((g.dietaryRestrictions && g.dietaryRestrictions.length > 0) || g.dietaryDetails) {
        dietaryList.push({
          guest: g.name,
          restrictions: g.dietaryRestrictions || [],
          details: g.dietaryDetails
        });
      }
    });

    // Song requests
    const songRequests = attendingGuests
      .filter(g => g.songRequest && g.songRequest.trim().length > 0)
      .map(g => ({ guest: g.name, song: g.songRequest! }));

    return {
      totalInvitedCount: guests.length,
      totalInvitedHeads: totalInvitedGuests,
      attendingInvitations: attendingGuests.length,
      totalAttendingHeads,
      declinedCount,
      pendingCount,
      mealCounts,
      dietaryList,
      songRequests,
      checkedInCount: guests.filter(g => g.checkedIn).length
    };
  }, [guests, config.mealOptions]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    return guests.filter(g => {
      const matchesStatus = statusFilter === 'all' || g.rsvpStatus === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.inviteCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.tableNumber && g.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [guests, statusFilter, searchQuery]);

  if (!isAdminOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticateAdmin(pinInput)) {
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    addGuest({
      name: newGuestName.trim(),
      email: newGuestEmail.trim(),
      phone: newGuestPhone.trim(),
      partySize: newGuestPartySize,
      tableNumber: newGuestTable
    });

    setNewGuestName('');
    setNewGuestEmail('');
    setNewGuestPhone('');
    setNewGuestPartySize(2);
    setIsAddModalOpen(false);
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
    const newItems: Array<Partial<Guest>> = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      const name = parts[0];
      const email = parts[1] || '';
      const partySize = parseInt(parts[2] || '2', 10) || 2;
      const table = parts[3] || 'Unassigned';
      return { name, email, partySize, tableNumber: table };
    });

    bulkAddGuests(newItems);
    setBulkText('');
    setIsBulkModalOpen(false);
  };

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

  const copyInviteLink = (code: string) => {
    const origin = window.location.origin + window.location.pathname;
    const link = `${origin}?code=${code}#rsvp`;
    navigator.clipboard.writeText(link);
    setCopiedLinkFor(code);
    setTimeout(() => setCopiedLinkFor(null), 2500);
  };

  const openShareModal = (guest: Guest) => {
    setSelectedGuestForShare(guest);
    setIsShareModalOpen(true);
  };

  const getPersonalizedInviteText = (guest: Guest) => {
    const origin = window.location.origin + window.location.pathname;
    const link = `${origin}?code=${guest.inviteCode}#rsvp`;
    return `Dearest ${guest.name},\n\nYou are warmly invited to celebrate our wedding on June 19, 2027 in Napa Valley! 💍🌸\n\nPlease let us know if you can make it by submitting your RSVP here:\n${link}\n\nWith love,\n${config.brideShortName} & ${config.groomShortName}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-blush-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Navigation Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rosewood to-stone-900 text-white flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5 text-blush-300" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-800 text-lg sm:text-xl">
                Couple &amp; Planner Dashboard
              </h3>
              <p className="text-xs text-stone-500">
                {config.brideShortName} &amp; {config.groomShortName} Wedding Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdminAuthenticated && (
              <button
                onClick={logoutAdmin}
                className="text-xs text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
              >
                Logout
              </button>
            )}
            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        {!isAdminAuthenticated ? (
          /* PIN LOGIN SCREEN */
          <div className="p-8 sm:p-16 max-w-md mx-auto my-auto text-center">
            <div className="w-16 h-16 rounded-full bg-blush-100 text-blush-600 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h4 className="font-serif text-2xl text-stone-800 mb-2">Organizer Access</h4>
            <p className="text-xs text-stone-500 mb-6">
              Enter your Organizer PIN to manage invitations, live RSVP counts, catering, and seating charts.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                maxLength={8}
                placeholder="Enter PIN (Default: 1234)"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-3 rounded-2xl border border-blush-200 focus:border-blush-500 focus:ring-2 focus:ring-blush-200 outline-none"
                autoFocus
              />

              {pinError && (
                <div className="text-xs text-rose-600 font-medium">
                  Incorrect PIN. (Try demo PIN: 1234)
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-blush-500 to-rose-500 text-white font-medium text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition"
              >
                Unlock Dashboard
              </button>

              <div className="text-[11px] text-stone-400 mt-2">
                Default Access PIN: <span className="font-mono font-bold text-stone-600">1234</span>
              </div>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Bar */}
            <div className="px-6 border-b border-stone-200 bg-white flex items-center gap-2 overflow-x-auto shrink-0">
              {[
                { id: 'analytics', label: 'RSVP Overview', icon: Users },
                { id: 'guests', label: `Guest List (${guests.length})`, icon: CheckCircle2 },
                { id: 'seating', label: 'Seating Chart', icon: Grid },
                { id: 'music', label: `Playlist & Wishes (${stats.songRequests.length})`, icon: Music },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
                      isActive
                        ? 'border-blush-500 text-blush-600'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#FCFBF9]">
              {/* TAB 1: ANALYTICS & OVERVIEW */}
              {activeTab === 'analytics' && (
                <div className="space-y-8">
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-blush-100 shadow-sm">
                      <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-2">
                        <span>Total Expected Heads</span>
                        <Users className="w-4 h-4 text-stone-400" />
                      </div>
                      <div className="text-3xl font-serif font-bold text-stone-800">
                        {stats.totalAttendingHeads} <span className="text-sm font-normal text-stone-400">/ {stats.totalInvitedHeads}</span>
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">
                        Across {stats.totalInvitedCount} invitation groups
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                      <div className="flex items-center justify-between text-emerald-600 text-xs font-medium mb-2">
                        <span>Attending (RSVP Yes)</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-3xl font-serif font-bold text-emerald-700">
                        {stats.attendingInvitations}
                      </div>
                      <div className="text-[11px] text-emerald-600/80 mt-1">
                        {stats.totalInvitedCount > 0 ? Math.round((stats.attendingInvitations / stats.totalInvitedCount) * 100) : 0}% acceptance rate
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                      <div className="flex items-center justify-between text-rose-600 text-xs font-medium mb-2">
                        <span>Declined</span>
                        <XCircle className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="text-3xl font-serif font-bold text-rose-700">
                        {stats.declinedCount}
                      </div>
                      <div className="text-[11px] text-rose-600/80 mt-1">
                        Sent regrets &amp; wishes
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
                      <div className="flex items-center justify-between text-amber-600 text-xs font-medium mb-2">
                        <span>Pending Response</span>
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-3xl font-serif font-bold text-amber-700">
                        {stats.pendingCount}
                      </div>
                      <div className="text-[11px] text-amber-600/80 mt-1">
                        Awaiting confirmation
                      </div>
                    </div>
                  </div>

                  {/* Catering Breakdown & Kitchen Alerts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Meal Orders */}
                    <div className="bg-white p-6 rounded-3xl border border-blush-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-blush-600" />
                          <h4 className="font-serif font-semibold text-stone-800 text-base">
                            Catering &amp; Entrée Tally
                          </h4>
                        </div>
                        <span className="text-xs text-stone-400 font-medium">
                          {stats.totalAttendingHeads} meals total
                        </span>
                      </div>

                      <div className="space-y-3">
                        {Object.entries(stats.mealCounts).map(([dishName, count]) => (
                          <div key={dishName} className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-700">{dishName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-serif font-bold text-rosewood">{count}</span>
                              <span className="text-[10px] text-stone-400">plates</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dietary Restrictions & Allergies */}
                    <div className="bg-white p-6 rounded-3xl border border-blush-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <h4 className="font-serif font-semibold text-stone-800 text-base">
                            Dietary &amp; Allergy Alerts for Chef
                          </h4>
                        </div>
                        <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium">
                          {stats.dietaryList.length} special requests
                        </span>
                      </div>

                      {stats.dietaryList.length === 0 ? (
                        <div className="text-xs text-stone-400 text-center py-8">
                          No special dietary restrictions reported yet.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {stats.dietaryList.map((item, i) => (
                            <div key={i} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs">
                              <div className="font-semibold text-stone-800 mb-1">{item.guest}</div>
                              <div className="flex flex-wrap gap-1 mb-1">
                                {item.restrictions.map((r, ri) => (
                                  <span key={ri} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-medium">
                                    {r}
                                  </span>
                                ))}
                              </div>
                              {item.details && (
                                <div className="text-stone-600 text-[11px] italic">&ldquo;{item.details}&rdquo;</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Export Quick Action */}
                  <div className="bg-gradient-to-r from-blush-500 to-rose-500 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-blush-500/20">
                    <div>
                      <h4 className="font-serif font-semibold text-lg mb-1">Export Full Guest &amp; RSVP Data</h4>
                      <p className="text-xs text-blush-100">
                        Download a clean, formatted CSV spreadsheet ready for your caterers, venue coordinator, and wedding planner.
                      </p>
                    </div>
                    <button
                      onClick={() => exportGuestsToCsv(guests, config)}
                      className="px-6 py-3 rounded-full bg-white text-rosewood hover:bg-stone-100 font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shrink-0 transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Download CSV Spreadsheet</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: GUEST LIST MANAGER */}
              {activeTab === 'guests' && (
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Search & Filter */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search name, code, table..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs focus:ring-2 focus:ring-blush-200 outline-none"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-700 outline-none"
                      >
                        <option value="all">All Statuses ({guests.length})</option>
                        <option value="attending">Attending ({stats.attendingInvitations})</option>
                        <option value="declined">Declined ({stats.declinedCount})</option>
                        <option value="pending">Pending ({stats.pendingCount})</option>
                      </select>
                    </div>

                    {/* Buttons: Add Guest & Bulk Import & Export */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-blush-500 hover:bg-blush-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Guest</span>
                      </button>

                      <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <Users className="w-4 h-4 text-stone-500" />
                        <span>Bulk Import</span>
                      </button>

                      <button
                        onClick={() => exportGuestsToCsv(guests, config)}
                        className="p-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 transition"
                        title="Export CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Guests Table */}
                  <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="py-3 px-4">Guest Name</th>
                            <th className="py-3 px-4">Invite Code</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Party / Heads</th>
                            <th className="py-3 px-4">Meal Selection</th>
                            <th className="py-3 px-4">Table</th>
                            <th className="py-3 px-4">Share / Invite</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-700">
                          {filteredGuests.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-stone-400">
                                No guests found matching your filter.
                              </td>
                            </tr>
                          ) : (
                            filteredGuests.map(guest => (
                              <tr key={guest.id} className="hover:bg-blush-50/40 transition">
                                <td className="py-3 px-4 font-medium text-stone-900">
                                  <div className="font-serif text-sm">{guest.name}</div>
                                  {guest.email && <div className="text-[10px] text-stone-400">{guest.email}</div>}
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

              {/* TAB 3: SEATING CHART */}
              {activeTab === 'seating' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-semibold text-lg text-stone-800">Table &amp; Seating Arrangement</h4>
                      <p className="text-xs text-stone-500">Assign guests and view table assignments.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {['Table 1 (Family VIP)', 'Table 2 (Family Vance)', 'Table 3 (Bridal Friends)', 'Table 4 (Groom Friends)', 'Table 5', 'Unassigned'].map(tableName => {
                      const tableGuests = guests.filter(g => (g.tableNumber || 'Unassigned') === tableName);
                      const tableHeads = tableGuests.reduce((acc, g) => acc + (g.rsvpStatus === 'attending' ? g.attendingCount : g.partySize), 0);

                      return (
                        <div key={tableName} className="bg-white rounded-2xl border border-blush-200 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                            <span className="font-serif font-bold text-stone-800 text-sm">{tableName}</span>
                            <span className="text-[11px] text-stone-500 font-medium">{tableHeads} seats filled</span>
                          </div>

                          <div className="space-y-2">
                            {tableGuests.length === 0 ? (
                              <div className="text-[11px] text-stone-400 py-3 text-center italic">No guests assigned yet</div>
                            ) : (
                              tableGuests.map(g => (
                                <div key={g.id} className="p-2 rounded-xl bg-stone-50 text-xs flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-stone-800">{g.name}</span>
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

              {/* TAB 4: PLAYLIST & WISHES */}
              {activeTab === 'music' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-serif font-semibold text-lg text-stone-800">
                      DJ Playlist Requests ({stats.songRequests.length})
                    </h4>
                    <p className="text-xs text-stone-500">Songs requested by attendees during their RSVP submission.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stats.songRequests.map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-blush-200 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blush-100 text-blush-600 flex items-center justify-center shrink-0">
                          <Music className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800 text-xs">{item.song}</div>
                          <div className="text-[10px] text-stone-400 font-medium">Requested by: {item.guest}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blush-200 shadow-sm max-w-2xl">
                  <h4 className="font-serif font-semibold text-xl text-stone-800 mb-4">Wedding Website Settings</h4>

                  {settingsSaved && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                      Settings updated successfully!
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
                        <label className="block text-stone-600 font-semibold mb-1">Bride Display Name</label>
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
                        <label className="block text-stone-600 font-semibold mb-1">Groom Display Name</label>
                        <input
                          type="text"
                          value={groomShortName}
                          onChange={e => setGroomShortName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">Wedding Date &amp; Time (ISO)</label>
                      <input
                        type="datetime-local"
                        value={weddingDate}
                        onChange={e => setWeddingDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200"
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
                      <label className="block text-stone-600 font-semibold mb-1">Wedding Hashtag</label>
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
                      className="px-6 py-3 rounded-full bg-blush-500 hover:bg-blush-600 text-white font-semibold uppercase tracking-wider"
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

            <form onSubmit={handleAddGuest} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sebastian Cruz"
                  value={newGuestName}
                  onChange={e => setNewGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-blush-200"
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
                <label className="block font-medium text-stone-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={newGuestPhone}
                  onChange={e => setNewGuestPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Party Size Max</label>
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
                placeholder="Dr. Evelyn Vance, evelyn@example.com, 2, Table 2
Robert Sterling, robert@example.com, 1, Table 4
Lady Clara Dupont, clara@example.com, 2, Table 3"
                className="w-full p-3 rounded-xl border border-stone-200 text-xs font-mono outline-none focus:ring-2 focus:ring-blush-200"
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

              <div>
                <label className="block text-stone-600 font-medium mb-1">RSVP Status</label>
                <select
                  value={editingGuest.rsvpStatus}
                  onChange={e => setEditingGuest({ ...editingGuest, rsvpStatus: e.target.value as 'attending' | 'declined' | 'pending' })}
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

      {/* MODAL 4: SHARE & INVITATION TEMPLATE */}
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

            {/* Print Personalized Physical Card */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-center">
              <CutePrintButton guestName={selectedGuestForShare.name} variant="outline" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
