import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Gift,
  Heart,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  Users,
  Utensils,
  Wine,
} from 'lucide-react';
import type { GuestTag, HouseholdInvitation, WeddingConfig } from '../../types/wedding';
import {
  TABLES,
  WEDDING_FAVOUR_OPTIONS,
  parseSeatsFromTableNumber,
} from '../../utils/seatingConstants';
import { exportGuestsToCsv } from '../../utils/storage';
import { normalizeDietary, type NormalizedDietary } from '../../utils/dietary';
import { getTagMeta, isWeddingRoleTag } from '../../utils/guestTags';
import { Button, inputClass } from './AdminPrimitives';

interface RsvpManagerProps {
  config: WeddingConfig;
  households: HouseholdInvitation[];
  onOpenReport?: () => void;
  notify: (toast: { tone: 'success' | 'error' | 'info'; message: string }) => void;
}

type RsvpSubTab = 'seating' | 'dietary' | 'favours' | 'all';

interface SeatDetail {
  tableId: number;
  tableName: string;
  tableTheme: string;
  seatNumber: number;
  seatId: string;
  isOccupied: boolean;
  isBridal: boolean;
  occupantName?: string;
  householdName?: string;
  householdId?: string;
  dietary?: string;
  dietaryNormalized?: NormalizedDietary;
  favour?: string;
  tags?: GuestTag[];
}

const DIETARY_CATEGORIES = [
  { id: 'all', label: 'All Special Diets' },
  { id: 'veg', label: 'Vegetarian', keywords: ['veg', 'vegetarian'] },
  { id: 'vegan', label: 'Vegan', keywords: ['vegan'] },
  { id: 'gluten', label: 'Gluten-Free / Coeliac', keywords: ['gluten', 'coeliac', 'celiac', 'wheat'] },
  { id: 'nut', label: 'Nut Allergy', keywords: ['nut', 'peanut', 'almond', 'tree nut'] },
  { id: 'dairy', label: 'Dairy / Lactose', keywords: ['dairy', 'lactose', 'milk'] },
  { id: 'halal', label: 'Halal', keywords: ['halal'] },
  { id: 'seafood', label: 'Seafood / Shellfish', keywords: ['fish', 'seafood', 'shellfish', 'prawn'] },
];

export const RsvpManager: React.FC<RsvpManagerProps> = ({
  config: _config,
  households,
  onOpenReport,
  notify,
}) => {
  const [activeTab, setActiveTab] = useState<RsvpSubTab>('seating');
  const [search, setSearch] = useState('');
  const [seatingViewMode, setSeatingViewMode] = useState<'floorplan' | 'roster'>('floorplan');
  const [selectedTableFilter, setSelectedTableFilter] = useState<number | 'all'>('all');
  const [dietaryCategoryFilter, setDietaryCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all');
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);

  const [hoveredSeat, setHoveredSeat] = useState<{
    seatId: string;
    tableId: number;
    tableName: string;
    seatNumber: number;
    occupantName: string;
    householdName: string;
    dietary?: string;
    dietaryNormalized?: NormalizedDietary;
    favour?: string;
    tags?: GuestTag[];
    x: number;
    y: number;
  } | null>(null);

  // 1. Overall RSVP Statistics
  const stats = useMemo(() => {
    const totalHouseholds = households.length;
    const totalInvited = households.reduce((sum, h) => sum + (h.members?.length || h.partySize || 1), 0);

    const attendingHouseholds = households.filter(h => h.rsvpStatus === 'attending');
    const declinedHouseholds = households.filter(h => h.rsvpStatus === 'declined');
    const pendingHouseholds = households.filter(h => h.rsvpStatus === 'pending');

    const totalAttendingGuests = attendingHouseholds.reduce(
      (sum, h) => sum + (h.attendingCount || h.members?.filter(m => m.attending !== false).length || h.partySize || 1),
      0,
    );
    const totalDeclinedGuests = declinedHouseholds.reduce(
      (sum, h) => sum + (h.members?.length || h.partySize || 1),
      0,
    );
    const totalPendingGuests = pendingHouseholds.reduce(
      (sum, h) => sum + (h.members?.length || h.partySize || 1),
      0,
    );

    // Seating calculations
    const seatedAttendingHouseholds = attendingHouseholds.filter(h => Boolean(h.tableNumber && h.tableNumber.trim()));
    const unseatedAttendingHouseholds = attendingHouseholds.filter(h => !h.tableNumber || !h.tableNumber.trim());

    // Count seated guests
    let seatedGuestsCount = 2; // Cam & Abby at Sweetheart table
    seatedAttendingHouseholds.forEach(h => {
      const parsed = parseSeatsFromTableNumber(h.tableNumber, h.attendingCount || 1);
      const seatsCount = parsed.reduce((count, item) => count + item.seatNumbers.length, 0);
      seatedGuestsCount += seatsCount;
    });

    // Dietary count
    const dietaryHouseholds = attendingHouseholds.filter(
      h =>
        Boolean(h.dietaryDetails && h.dietaryDetails.trim()) ||
        (h.dietaryRestrictions && h.dietaryRestrictions.length > 0) ||
        (h.members && h.members.some(m => Boolean(m.dietaryDetails?.trim()) || (m.dietaryRestrictions && m.dietaryRestrictions.length > 0))),
    );

    // Favours count
    const favoursChosenHouseholds = attendingHouseholds.filter(
      h => Boolean(h.songRequest && h.songRequest.trim() && h.songRequest !== 'Nothing'),
    );

    return {
      totalHouseholds,
      totalInvited,
      attendingHouseholds: attendingHouseholds.length,
      declinedHouseholds: declinedHouseholds.length,
      pendingHouseholds: pendingHouseholds.length,
      totalAttendingGuests,
      totalDeclinedGuests,
      totalPendingGuests,
      seatedGuestsCount,
      unseatedAttendingCount: unseatedAttendingHouseholds.length,
      unseatedAttendingGuests: unseatedAttendingHouseholds.reduce((sum, h) => sum + (h.attendingCount || 1), 0),
      unseatedAttendingHouseholds,
      dietaryCount: dietaryHouseholds.length,
      favoursChosenCount: favoursChosenHouseholds.length,
    };
  }, [households]);

  // 2. Map of occupied seats with occupant names and dietary notes
  const occupiedSeatsMap = useMemo(() => {
    const map = new Map<string, SeatDetail>();

    // Permanent Bride & Groom seats at Sweetheart table (T0)
    map.set('T0-S1', {
      tableId: 0,
      tableName: 'C & A Sweetheart Table',
      tableTheme: 'Bride & Groom',
      seatNumber: 1,
      seatId: 'T0-S1',
      isOccupied: true,
      isBridal: true,
      occupantName: 'Cameron Nel (Groom)',
      householdName: 'Cameron & Abby',
      householdId: 'household-cam-abby',
      favour: 'Stroopwaffels',
    });
    map.set('T0-S2', {
      tableId: 0,
      tableName: 'C & A Sweetheart Table',
      tableTheme: 'Bride & Groom',
      seatNumber: 2,
      seatId: 'T0-S2',
      isOccupied: true,
      isBridal: true,
      occupantName: 'Abby (Bride)',
      householdName: 'Cameron & Abby',
      householdId: 'household-cam-abby',
      favour: 'Something from the netherlands',
    });

    for (const h of households) {
      if (h.id === 'household-cam-abby') continue;
      if (h.rsvpStatus !== 'attending') continue;
      if (!h.tableNumber || !h.tableNumber.trim()) continue;

      const parsed = parseSeatsFromTableNumber(h.tableNumber, h.attendingCount || 1);
      const guestNames = h.members && h.members.length > 0
        ? h.members.filter(m => m.attending !== false).map(m => m.name)
        : [h.name];

      // Add companion name if allowed
      if (h.companionNames && h.companionNames.length > 0) {
        guestNames.push(...h.companionNames);
      }

      let guestIdx = 0;
      for (const item of parsed) {
        const tableObj = TABLES.find(t => t.id === item.tableId);
        const tableName = item.tableId === 0 ? 'C & A Sweetheart Table' : `Table ${item.tableId}`;
        const tableTheme = tableObj ? tableObj.theme : item.tableId === 0 ? 'Bride & Groom' : 'Banquet';

        for (const seatNum of item.seatNumbers) {
          const key = `T${item.tableId}-S${seatNum}`;
          const occupantName = guestNames[guestIdx] || `${h.name} Guest ${guestIdx + 1}`;
          guestIdx++;

          const memberObj = h.members?.find(m => m.name.toLowerCase() === occupantName.toLowerCase());
          const memberRestrictions = memberObj?.dietaryRestrictions || (memberObj ? [] : h.dietaryRestrictions);
          const memberDetails = memberObj?.dietaryDetails || h.dietaryDetails;
          const dietaryNormalized = normalizeDietary(memberRestrictions, memberDetails);
          const dietarySummary = dietaryNormalized.tags.map(t => t.label).concat(dietaryNormalized.notes ? [dietaryNormalized.notes] : []).join(', ');

          map.set(key, {
            tableId: item.tableId,
            tableName,
            tableTheme,
            seatNumber: seatNum,
            seatId: key,
            isOccupied: true,
            isBridal: item.tableId === 0,
            occupantName,
            householdName: h.name,
            householdId: h.id,
            dietary: dietarySummary,
            dietaryNormalized,
            favour: h.songRequest,
            tags: h.tags,
          });
        }
      }
    }

    return map;
  }, [households]);

  // 3. Dietary Records list
  const dietaryRecords = useMemo(() => {
    const list: Array<{
      id: string;
      householdName: string;
      guestName: string;
      dietaryNormalized: NormalizedDietary;
      dietary: string;
      preferences?: string;
      table: string;
      tableId?: number;
      seatNumber?: number;
    }> = [];

    households.forEach(h => {
      if (h.rsvpStatus !== 'attending') return;

      const parsed = parseSeatsFromTableNumber(h.tableNumber, h.attendingCount || 1);
      const firstSeat = parsed[0]?.seatNumbers[0];
      const tableId = parsed[0]?.tableId;
      const tableLabel = h.tableNumber && h.tableNumber.trim() ? h.tableNumber : 'Unassigned';

      // Member level dietary
      if (h.members && h.members.length > 0) {
        h.members.forEach((m, mIdx) => {
          if (m.attending === false) return;
          const restrictions = (m.dietaryRestrictions && m.dietaryRestrictions.length > 0)
            ? m.dietaryRestrictions
            : (h.dietaryRestrictions || []);
          const details = m.dietaryDetails || h.dietaryDetails;
          const normalized = normalizeDietary(restrictions, details);

          if (normalized.tags.length > 0 || normalized.notes || (h.mealSelection && h.mealSelection.trim())) {
            const summaryText = normalized.tags.map(t => t.label).concat(normalized.notes ? [normalized.notes] : []).join(', ');
            list.push({
              id: `${h.id}-${m.id || mIdx}`,
              householdName: h.name,
              guestName: m.name,
              dietaryNormalized: normalized,
              dietary: summaryText || 'None specified',
              preferences: h.mealSelection,
              table: tableLabel,
              tableId,
              seatNumber: firstSeat,
            });
          }
        });
      } else {
        // Household level only
        const normalized = normalizeDietary(h.dietaryRestrictions, h.dietaryDetails);
        if (normalized.tags.length > 0 || normalized.notes || (h.mealSelection && h.mealSelection.trim())) {
          const summaryText = normalized.tags.map(t => t.label).concat(normalized.notes ? [normalized.notes] : []).join(', ');
          list.push({
            id: h.id,
            householdName: h.name,
            guestName: h.name,
            dietaryNormalized: normalized,
            dietary: summaryText || 'None specified',
            preferences: h.mealSelection,
            table: tableLabel,
            tableId,
            seatNumber: firstSeat,
          });
        }
      }
    });

    return list;
  }, [households]);

  // Filtered dietary records
  const filteredDietaryRecords = useMemo(() => {
    return dietaryRecords.filter(item => {
      if (dietaryCategoryFilter !== 'all') {
        const cat = DIETARY_CATEGORIES.find(c => c.id === dietaryCategoryFilter);
        if (cat?.keywords) {
          const match = cat.keywords.some(kw => {
            const lowerKw = kw.toLowerCase();
            const tagMatch = item.dietaryNormalized.tags.some(t =>
              t.id.toLowerCase().includes(lowerKw) || t.label.toLowerCase().includes(lowerKw)
            );
            const notesMatch = item.dietaryNormalized.notes?.toLowerCase().includes(lowerKw);
            return tagMatch || notesMatch || item.dietary.toLowerCase().includes(lowerKw);
          });
          if (!match) return false;
        }
      }
      if (selectedTableFilter !== 'all') {
        if (item.tableId !== selectedTableFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.guestName.toLowerCase().includes(q) ||
          item.householdName.toLowerCase().includes(q) ||
          item.dietary.toLowerCase().includes(q) ||
          (item.dietaryNormalized.notes && item.dietaryNormalized.notes.toLowerCase().includes(q)) ||
          (item.preferences && item.preferences.toLowerCase().includes(q)) ||
          item.table.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dietaryRecords, dietaryCategoryFilter, selectedTableFilter, search]);

  // 4. Wedding Favours Poll Breakdown
  const favourPollData = useMemo(() => {
    const totalAttending = households.filter(h => h.rsvpStatus === 'attending');

    const poll = WEDDING_FAVOUR_OPTIONS.map(opt => {
      const voters = totalAttending.filter(h => {
        if (!h.songRequest) return false;
        return (
          h.songRequest === opt.id ||
          h.songRequest.toLowerCase() === opt.label.toLowerCase() ||
          h.songRequest.toLowerCase().includes(opt.id.toLowerCase())
        );
      });

      const totalGuests = voters.reduce((sum, h) => sum + (h.attendingCount || 1), 0);
      const percentage = totalAttending.length > 0 ? Math.round((voters.length / totalAttending.length) * 100) : 0;

      return {
        ...opt,
        voters,
        householdCount: voters.length,
        guestCount: totalGuests,
        percentage,
      };
    });

    // Unselected / Not specified
    const unselected = totalAttending.filter(h => !h.songRequest || !h.songRequest.trim());
    const unselectedGuests = unselected.reduce((sum, h) => sum + (h.attendingCount || 1), 0);
    const unselectedPercentage = totalAttending.length > 0 ? Math.round((unselected.length / totalAttending.length) * 100) : 0;

    return {
      options: poll,
      unselected: {
        id: 'unselected',
        label: 'Not yet selected',
        description: 'Attending households who have not made a choice',
        emoji: '⏳',
        voters: unselected,
        householdCount: unselected.length,
        guestCount: unselectedGuests,
        percentage: unselectedPercentage,
      },
      totalAttendingCount: totalAttending.length,
    };
  }, [households]);

  // 5. Filtered Master Records
  const filteredMasterRecords = useMemo(() => {
    return households.filter(h => {
      if (statusFilter !== 'all' && h.rsvpStatus !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const memberNames = h.members?.map(m => m.name.toLowerCase()).join(' ') || '';
        const companions = h.companionNames?.join(' ').toLowerCase() || '';
        const match =
          h.name.toLowerCase().includes(q) ||
          h.inviteCode.toLowerCase().includes(q) ||
          memberNames.includes(q) ||
          companions.includes(q) ||
          (h.email && h.email.toLowerCase().includes(q)) ||
          (h.phone && h.phone.toLowerCase().includes(q)) ||
          (h.tableNumber && h.tableNumber.toLowerCase().includes(q)) ||
          (h.songRequest && h.songRequest.toLowerCase().includes(q)) ||
          (h.dietaryDetails && h.dietaryDetails.toLowerCase().includes(q)) ||
          (h.mealSelection && h.mealSelection.toLowerCase().includes(q)) ||
          (h.message && h.message.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [households, statusFilter, search]);

  // Export CSV handler
  const handleExportCsv = () => {
    try {
      exportGuestsToCsv(households);
      notify({ tone: 'success', message: 'Master guest and RSVP list exported to CSV.' });
    } catch {
      notify({ tone: 'error', message: 'Failed to export CSV.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45d72]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Guest RSVP &amp; Seating Portal</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-stone-900 mt-1">
            RSVP Details, Seating &amp; Favours Hub
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-500">
            Live overview of all guest responses: inspect who is sitting where, catering dietary requirements, and wedding favour poll votes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenReport && (
            <Button onClick={onOpenReport} size="sm" className="gap-1.5 border-[#ddbdc7] bg-[#fff8fa] text-[#7f2540] hover:bg-[#ffeef3]">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Master Report</span>
            </Button>
          )}
          <Button onClick={handleExportCsv} tone="primary" size="sm" className="gap-1.5 !bg-[#7f2540] !text-white">
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Attending */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Attending</span>
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-serif text-xl sm:text-2xl font-bold text-stone-900">
            {stats.totalAttendingGuests}{' '}
            <span className="text-xs font-normal text-stone-500">guests</span>
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            {stats.attendingHouseholds} of {stats.totalHouseholds} households
          </p>
        </div>

        {/* Seated */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Seating Status</span>
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-pink-50 text-[#8a2947]">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-serif text-xl sm:text-2xl font-bold text-stone-900">
            {stats.seatedGuestsCount}{' '}
            <span className="text-xs font-normal text-stone-500">seated</span>
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            {stats.unseatedAttendingCount > 0 ? (
              <span className="text-amber-600 font-semibold">{stats.unseatedAttendingCount} households unassigned</span>
            ) : (
              <span className="text-emerald-600 font-medium">All attending guests seated</span>
            )}
          </p>
        </div>

        {/* Dietary */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Special Diets</span>
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Utensils className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-serif text-xl sm:text-2xl font-bold text-stone-900">
            {dietaryRecords.length}{' '}
            <span className="text-xs font-normal text-stone-500">requests</span>
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            {stats.dietaryCount} households with dietary notes
          </p>
        </div>

        {/* Favours */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Favours Picked</span>
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-purple-50 text-purple-700">
              <Gift className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-serif text-xl sm:text-2xl font-bold text-stone-900">
            {stats.favoursChosenCount}{' '}
            <span className="text-xs font-normal text-stone-500">favours</span>
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Across {stats.attendingHouseholds} attending parties
          </p>
        </div>
      </div>

      {/* Unassigned Warning Banner (if any attending guest is not seated) */}
      {stats.unseatedAttendingCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-900">
              {stats.unseatedAttendingCount} attending {stats.unseatedAttendingCount === 1 ? 'party' : 'parties'} ({stats.unseatedAttendingGuests} guests) have not selected seats yet:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {stats.unseatedAttendingHouseholds.map(h => (
                <span key={h.id} className="rounded-lg border border-amber-300 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-amber-900 shadow-2xs">
                  {h.name} ({h.attendingCount || 1} {h.attendingCount === 1 ? 'guest' : 'guests'})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-stone-200">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('seating')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'seating'
                ? 'border-[#7f2540] text-[#7f2540]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Seating Chart &amp; Floor Plan</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
              {stats.seatedGuestsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dietary')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'dietary'
                ? 'border-[#7f2540] text-[#7f2540]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Utensils className="h-4 w-4" />
            <span>Dietary &amp; Catering Needs</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
              {dietaryRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('favours')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'favours'
                ? 'border-[#7f2540] text-[#7f2540]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Gift className="h-4 w-4" />
            <span>Wedding Favours Poll</span>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-800">
              {stats.favoursChosenCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'all'
                ? 'border-[#7f2540] text-[#7f2540]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            <span>All RSVP Responses</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
              {households.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SEATING CHART & FLOOR PLAN */}
      {/* ========================================================================= */}
      {activeTab === 'seating' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500">View:</span>
              <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
                <button
                  type="button"
                  onClick={() => setSeatingViewMode('floorplan')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    seatingViewMode === 'floorplan'
                      ? 'bg-white text-[#7f2540] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Floor Plan Map
                </button>
                <button
                  type="button"
                  onClick={() => setSeatingViewMode('roster')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    seatingViewMode === 'roster'
                      ? 'bg-white text-[#7f2540] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Table Rosters (Seats 1–8)
                </button>
              </div>
            </div>

            {/* Quick Table Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500">Focus Table:</span>
              <select
                value={selectedTableFilter}
                onChange={e => setSelectedTableFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 outline-none focus:border-[#7f2540]"
              >
                <option value="all">All 8 Tables</option>
                <option value="0">C &amp; A Sweetheart Table</option>
                {TABLES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}: {t.theme}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VIEW: VISUAL FLOOR PLAN */}
          {seatingViewMode === 'floorplan' && (
            <div className="relative overflow-hidden rounded-3xl border border-[#e8d5d9] bg-gradient-to-br from-[#faf6f7] via-[#fffdfd] to-[#f8f2f4] p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3">
                <div>
                  <h4 className="font-display text-base font-bold text-stone-800">
                    Arendsrus Dining Room Seating Chart
                  </h4>
                  <p className="text-xs text-stone-500">
                    Hover or click any seat circle to inspect occupant names, dietary requirements, and party details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullscreenMap(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-[#7f2540] shadow-xs cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-[#7f2540]" />
                  <span>Full Screen Map</span>
                </button>
              </div>

              {/* Map Legend */}
              <div className="flex flex-wrap items-center gap-4 py-2 text-xs text-stone-600 border-b border-stone-200/60 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-[#c97a8b] border border-[#8a384b]" />
                  <span>Bride &amp; Groom (C &amp; A)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 border border-emerald-700" />
                  <span>Reserved by Guest</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-white border-2 border-stone-300" />
                  <span>Available Seat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-600 font-bold">⚠️</span>
                  <span>Special Diet Requested</span>
                </div>
              </div>

              {/* SVG Floor Plan Container */}
              <div className="relative mx-auto w-full max-w-5xl select-none">
                <svg viewBox="0 0 1000 730" className="w-full h-auto drop-shadow-xs" style={{ maxHeight: '760px' }}>
                  <defs>
                    {TABLES.map(t => (
                      <radialGradient key={t.id} id={`org-table-grad-${t.id}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="55%" stopColor={t.bgTint} />
                        <stop offset="100%" stopColor={t.color} />
                      </radialGradient>
                    ))}
                    <linearGradient id="org-bar-wood" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8d6255" />
                      <stop offset="100%" stopColor="#6e473b" />
                    </linearGradient>
                    <linearGradient id="org-buffet-wood" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#7a554a" />
                      <stop offset="100%" stopColor="#5d3b32" />
                    </linearGradient>
                    <linearGradient id="org-ca-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#EDC9D4" />
                      <stop offset="50%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#FFD3C9" />
                    </linearGradient>
                  </defs>

                  {/* Room Boundary */}
                  <rect x="18" y="18" width="964" height="662" rx="24" fill="none" stroke="#e2cbd1" strokeWidth="2" strokeDasharray="6 4" />

                  {/* Top-Left Bar */}
                  <g className="cursor-default">
                    <rect x="28" y="24" width="148" height="56" rx="10" fill="url(#org-bar-wood)" stroke="#57362c" strokeWidth="2" />
                    <rect x="33" y="29" width="138" height="46" rx="7" fill="#faf2ee" stroke="#c7a79a" strokeWidth="1.2" />
                    <foreignObject x="34" y="30" width="136" height="44">
                      <div className="flex h-full flex-col items-center justify-center text-center text-[#57362c]">
                        <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-wide text-[#3b231c]">
                          <Wine className="h-3.5 w-3.5 text-[#8d6255]" />
                          <span>Bar</span>
                        </div>
                        <span className="text-[9.5px] uppercase font-bold text-[#5c382d] tracking-wider">Drinks &amp; Refreshments</span>
                      </div>
                    </foreignObject>
                  </g>

                  {/* Bridal Sweetheart Table (C & A) */}
                  <g className="cursor-default">
                    <path d="M 390 40 Q 480 14, 570 40" fill="none" stroke="#d8bfc6" strokeWidth="2" strokeDasharray="4 2" />
                    <rect x="395" y="28" width="170" height="48" rx="24" fill="url(#org-ca-grad)" stroke="#c97a8b" strokeWidth="2.5" />
                    <text x="480" y="60" textAnchor="middle" fill="#8a384b" fontSize="22" fontWeight="bold" className="font-display tracking-widest select-none">
                      C &amp; A
                    </text>

                    {/* Seat 1: Cam */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredSeat({
                          seatId: 'T0-S1',
                          tableId: 0,
                          tableName: 'C & A Sweetheart Table',
                          seatNumber: 1,
                          occupantName: 'Cameron Nel (Groom)',
                          householdName: 'Cameron & Abby',
                          favour: 'Stroopwaffels',
                          x: 445,
                          y: 100,
                        })
                      }
                      onMouseLeave={() => setHoveredSeat(null)}
                    >
                      <circle cx="445" cy="100" r="14" fill="#c97a8b" stroke="#8a384b" strokeWidth="2" />
                      <text x="445" y="104.5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" className="select-none font-display">C</text>
                    </g>

                    {/* Seat 2: Abby */}
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredSeat({
                          seatId: 'T0-S2',
                          tableId: 0,
                          tableName: 'C & A Sweetheart Table',
                          seatNumber: 2,
                          occupantName: 'Abby (Bride)',
                          householdName: 'Cameron & Abby',
                          favour: 'Something from the netherlands',
                          x: 515,
                          y: 100,
                        })
                      }
                      onMouseLeave={() => setHoveredSeat(null)}
                    >
                      <circle cx="515" cy="100" r="14" fill="#c97a8b" stroke="#8a384b" strokeWidth="2" />
                      <text x="515" y="104.5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" className="select-none font-display">A</text>
                    </g>
                  </g>

                  {/* Food Buffet (Right Wall) */}
                  <g className="cursor-default">
                    <rect x="925" y="26" width="48" height="605" rx="12" fill="url(#org-buffet-wood)" stroke="#4e3128" strokeWidth="2" />
                    <rect x="930" y="31" width="38" height="595" rx="8" fill="#faf2ee" stroke="#cfb0a3" strokeWidth="1.2" />
                    <text x="949" y="328" fill="#3b231c" fontSize="17" fontWeight="bold" letterSpacing="6" textAnchor="middle" transform="rotate(90, 949, 328)" className="font-display select-none uppercase">
                      FOOD
                    </text>
                  </g>

                  {/* Dance Floor */}
                  <g opacity="0.85" pointerEvents="none">
                    <ellipse cx="480" cy="335" rx="105" ry="68" fill="none" stroke="#c97a8b" strokeWidth="1.8" strokeDasharray="5 5" />
                    <text x="480" y="330" textAnchor="middle" fill="#9e475a" fontSize="13" fontWeight="bold" letterSpacing="4" className="font-display select-none uppercase">
                      DANCE FLOOR
                    </text>
                    <Heart className="h-4 w-4 text-[#b8697a]" x="472" y="342" />
                  </g>

                  {/* 7 Guest Tables */}
                  {TABLES.map(table => {
                    const radiusOrbit = 66;
                    const tableRadius = 43;
                    const seatRadius = 14;

                    const occupiedCount = Array.from({ length: table.capacity }).filter((_, i) =>
                      occupiedSeatsMap.has(`T${table.id}-S${i + 1}`),
                    ).length;

                    const isHighlighted = selectedTableFilter === 'all' || selectedTableFilter === table.id;

                    return (
                      <g key={table.id} opacity={isHighlighted ? 1 : 0.35} className="transition-opacity">
                        {/* Table Circle */}
                        <circle
                          cx={table.cx}
                          cy={table.cy}
                          r={tableRadius}
                          fill={`url(#org-table-grad-${table.id})`}
                          stroke={isHighlighted ? '#8a384b' : table.borderTint}
                          strokeWidth={isHighlighted ? '2.5' : '2'}
                          className="drop-shadow-xs cursor-pointer"
                          onClick={() => setSelectedTableFilter(selectedTableFilter === table.id ? 'all' : table.id)}
                        />

                        {/* Table Info */}
                        <text x={table.cx} y={table.cy - 9} textAnchor="middle" fill="#1c1917" fontSize="14" fontWeight="bold" className="font-display select-none pointer-events-none">
                          {table.name}
                        </text>
                        <text x={table.cx} y={table.cy + 6} textAnchor="middle" fill={table.textTint} fontSize="11" fontWeight="bold" letterSpacing="0.5" className="select-none pointer-events-none">
                          {table.theme}
                        </text>
                        <text x={table.cx} y={table.cy + 20} textAnchor="middle" fill="#57534e" fontSize="10" fontWeight="600" className="select-none pointer-events-none">
                          {occupiedCount}/{table.capacity} seated
                        </text>

                        {/* 8 Seats around Table */}
                        {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                          const seatNum = seatIdx + 1;
                          const seatId = `T${table.id}-S${seatNum}`;
                          const angle = (seatIdx * 45 - 90) * (Math.PI / 180);
                          const sx = table.cx + radiusOrbit * Math.cos(angle);
                          const sy = table.cy + radiusOrbit * Math.sin(angle);

                          const occupant = occupiedSeatsMap.get(seatId);
                          const isOccupied = Boolean(occupant);
                          const hasDietary = Boolean(occupant?.dietary);

                          return (
                            <g
                              key={seatId}
                              className="group cursor-pointer"
                              onMouseEnter={() => {
                                if (occupant) {
                                  setHoveredSeat({
                                    seatId,
                                    tableId: table.id,
                                    tableName: table.name,
                                    seatNumber: seatNum,
                                    occupantName: occupant.occupantName || occupant.householdName || 'Reserved Guest',
                                    householdName: occupant.householdName || 'Guest Household',
                                    dietary: occupant.dietary,
                                    dietaryNormalized: occupant.dietaryNormalized,
                                    favour: occupant.favour,
                                    tags: occupant.tags,
                                    x: sx,
                                    y: sy,
                                  });
                                }
                              }}
                              onMouseLeave={() => setHoveredSeat(null)}
                            >
                              <circle cx={sx} cy={sy} r={seatRadius + 6} fill="transparent" />

                              {isOccupied ? (
                                <g>
                                  <circle
                                    cx={sx}
                                    cy={sy}
                                    r={seatRadius}
                                    fill={table.id === 0 ? '#fbcfe8' : hasDietary ? '#fef08a' : '#dcfce7'}
                                    stroke={table.id === 0 ? '#db2777' : hasDietary ? '#ca8a04' : '#16a34a'}
                                    strokeWidth="1.8"
                                    className="transition-transform duration-150 group-hover:scale-125 origin-center"
                                  />
                                  <text
                                    x={sx}
                                    y={sy + 3}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fontWeight="bold"
                                    fill={table.id === 0 ? '#9d174d' : hasDietary ? '#854d0e' : '#166534'}
                                    className="select-none pointer-events-none font-mono"
                                  >
                                    {seatNum}
                                  </text>
                                </g>
                              ) : (
                                <g>
                                  <circle
                                    cx={sx}
                                    cy={sy}
                                    r={seatRadius - 1}
                                    fill="#f5f5f4"
                                    stroke="#d6d3d1"
                                    strokeWidth="1.2"
                                    strokeDasharray="2 2"
                                    className="transition-colors group-hover:fill-stone-200"
                                  />
                                  <text
                                    x={sx}
                                    y={sy + 3}
                                    textAnchor="middle"
                                    fontSize="7.5"
                                    fill="#a8a29e"
                                    className="select-none pointer-events-none font-mono"
                                  >
                                    {seatNum}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                  {/* Main Entrance Pill */}
                  <g>
                    <rect x="300" y="665" width="360" height="34" rx="12" fill="#ffffff" stroke="#cfb0a3" strokeWidth="1.8" className="drop-shadow-xs" />
                    <text x="480" y="687" textAnchor="middle" fill="#523933" fontSize="11" fontWeight="bold" letterSpacing="3" className="uppercase select-none font-display">
                      ▼ MAIN ENTRANCE &amp; GARDEN PATIO ▼
                    </text>
                  </g>
                </svg>

                {/* Seat Hover Tooltip Overlay */}
                {hoveredSeat && (
                  <div
                    className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full pb-3 animate-in fade-in zoom-in-95 duration-150"
                    style={{
                      left: `${(hoveredSeat.x / 1000) * 100}%`,
                      top: `${(hoveredSeat.y / 730) * 100}%`,
                    }}
                  >
                    <div className="rounded-xl border border-[#f0d5de] bg-white/95 backdrop-blur-md px-3.5 py-2.5 text-center text-stone-800 shadow-xl min-w-[180px] max-w-xs">
                      <p className="text-[11px] font-bold text-[#8a384b]">
                        {hoveredSeat.tableName} • Seat {hoveredSeat.seatNumber}
                      </p>
                      <p className="text-xs font-bold text-stone-900 mt-0.5">
                        {hoveredSeat.occupantName}
                      </p>
                      {hoveredSeat.tags && hoveredSeat.tags.some(isWeddingRoleTag) && (
                        <div className="mt-1 flex flex-wrap justify-center gap-1">
                          {hoveredSeat.tags.filter(isWeddingRoleTag).map(tag => {
                            const meta = getTagMeta(tag);
                            return (
                              <span
                                key={tag}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${meta.bg} ${meta.text} ${meta.border}`}
                              >
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-[10px] text-stone-500">
                        Party of: {hoveredSeat.householdName}
                      </p>
                      {hoveredSeat.dietaryNormalized && (hoveredSeat.dietaryNormalized.tags.length > 0 || hoveredSeat.dietaryNormalized.notes) && (
                        <div className="mt-1.5 space-y-1 text-left">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {hoveredSeat.dietaryNormalized.tags.map(tag => (
                              <span
                                key={tag.id}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${tag.badgeBg} ${tag.badgeText} ${tag.badgeBorder}`}
                              >
                                <span>{tag.icon}</span>
                                <span>{tag.label}</span>
                              </span>
                            ))}
                          </div>
                          {hoveredSeat.dietaryNormalized.notes && (
                            <p className="text-[10px] text-stone-700 bg-stone-50 rounded-md px-2 py-0.5 border border-stone-200 text-center">
                              <span className="font-semibold text-stone-500">Note:</span> {hoveredSeat.dietaryNormalized.notes}
                            </p>
                          )}
                        </div>
                      )}
                      {hoveredSeat.favour && (
                        <p className="mt-1 text-[10px] font-medium text-purple-700">
                          🎁 Favour: {hoveredSeat.favour}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: TABLE ROSTERS (Seats 1–8 Card Breakdown) */}
          {seatingViewMode === 'roster' && (
            <div className="space-y-4">
              {/* Sweetheart Table Card */}
              {(selectedTableFilter === 'all' || selectedTableFilter === 0) && (
                <div className="rounded-3xl border-2 border-pink-200 bg-gradient-to-r from-pink-50/60 via-white to-pink-50/60 p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-[#8a384b]" />
                      <div>
                        <h4 className="font-serif text-base font-bold text-stone-900">
                          C &amp; A Sweetheart Table
                        </h4>
                        <p className="text-xs text-stone-500">Bride &amp; Groom Table • 2 Seats</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-[#8a384b]">
                      2 / 2 Occupied
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center justify-between rounded-2xl border border-pink-200 bg-white p-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#8a384b] text-white font-bold text-xs">
                          1
                        </span>
                        <div>
                          <p className="text-xs font-bold text-stone-900">Cameron Nel (Groom)</p>
                          <p className="text-[10px] text-stone-500">Party of Cameron &amp; Abby</p>
                        </div>
                      </div>
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700 font-medium">🧇 Stroopwaffels</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-pink-200 bg-white p-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#8a384b] text-white font-bold text-xs">
                          2
                        </span>
                        <div>
                          <p className="text-xs font-bold text-stone-900">Abby (Bride)</p>
                          <p className="text-[10px] text-stone-500">Party of Cameron &amp; Abby</p>
                        </div>
                      </div>
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700 font-medium">🌷 Dutch Keepsake</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 7 Guest Tables Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {TABLES.filter(t => selectedTableFilter === 'all' || selectedTableFilter === t.id).map(table => {
                  const occupiedCount = Array.from({ length: table.capacity }).filter((_, i) =>
                    occupiedSeatsMap.has(`T${table.id}-S${i + 1}`),
                  ).length;

                  return (
                    <div key={table.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div>
                          <h4 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                            <span>{table.name}:</span>
                            <span className="font-sans text-sm font-semibold" style={{ color: table.textTint }}>{table.theme}</span>
                          </h4>
                          <p className="text-xs text-stone-500">Round Table • {table.capacity} Seats</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: table.bgTint,
                              color: table.textTint,
                              border: `1px solid ${table.borderTint}`,
                            }}
                          >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: table.color }} />
                            {table.color}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              occupiedCount === table.capacity
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {occupiedCount} / {table.capacity}
                          </span>
                        </div>
                      </div>

                      {/* 8 Seat List */}
                      <div className="mt-3 divide-y divide-stone-100">
                        {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                          const seatNum = seatIdx + 1;
                          const seatId = `T${table.id}-S${seatNum}`;
                          const occupant = occupiedSeatsMap.get(seatId);

                          return (
                            <div key={seatId} className="flex items-center justify-between py-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl text-xs font-mono font-bold ${
                                    occupant
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'border border-dashed border-stone-300 text-stone-400 bg-stone-50'
                                  }`}
                                >
                                  {seatNum}
                                </span>
                                <div className="min-w-0 truncate">
                                  {occupant ? (
                                    <>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-xs font-bold text-stone-900 truncate">
                                          {occupant.occupantName}
                                        </p>
                                        {occupant.tags && occupant.tags.some(isWeddingRoleTag) && (
                                          <span className="flex flex-wrap gap-1">
                                            {occupant.tags.filter(isWeddingRoleTag).map(tag => {
                                              const meta = getTagMeta(tag);
                                              return (
                                                <span
                                                  key={tag}
                                                  className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.2 text-[9px] font-bold ${meta.bg} ${meta.text} ${meta.border}`}
                                                  title={meta.label}
                                                >
                                                  <span>{meta.icon}</span>
                                                  <span>{meta.label}</span>
                                                </span>
                                              );
                                            })}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-stone-500 truncate">
                                        {occupant.householdName}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-xs italic text-stone-400">Open Seat</p>
                                  )}
                                </div>
                              </div>

                              {occupant && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {occupant.dietaryNormalized && (occupant.dietaryNormalized.tags.length > 0 || occupant.dietaryNormalized.notes) && (
                                    <div className="flex flex-wrap items-center gap-1 max-w-[160px] justify-end">
                                      {occupant.dietaryNormalized.tags.map(tag => (
                                        <span
                                          key={tag.id}
                                          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${tag.badgeBg} ${tag.badgeText} ${tag.badgeBorder}`}
                                          title={tag.label}
                                        >
                                          <span>{tag.icon}</span>
                                          <span>{tag.label}</span>
                                        </span>
                                      ))}
                                      {occupant.dietaryNormalized.notes && (
                                        <span
                                          className="rounded-md bg-stone-100 border border-stone-200 px-1.5 py-0.5 text-[9px] font-medium text-stone-600 truncate max-w-[80px]"
                                          title={occupant.dietaryNormalized.notes}
                                        >
                                          📝 {occupant.dietaryNormalized.notes}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {occupant.favour && (
                                    <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700 font-medium hidden sm:inline">
                                      {occupant.favour}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Screen Floor Plan Modal */}
          {isFullscreenMap && (
            <div
              className="fixed inset-0 z-[100001] flex flex-col bg-[#fdf8fa]/95 backdrop-blur-xl p-3 sm:p-6 overflow-y-auto animate-in fade-in text-stone-800"
              role="dialog"
              aria-modal="true"
            >
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 pb-3 text-stone-800">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-[#c97a8b]" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">Arendsrus Dining Room Seating Map</h3>
                    <p className="text-xs text-stone-500">Live guest floor plan and table allocations</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullscreenMap(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 px-3.5 py-2 text-xs font-semibold text-stone-800 shadow-sm cursor-pointer transition"
                >
                  <Minimize2 className="h-4 w-4 text-[#c97a8b]" />
                  <span>Exit Full Screen</span>
                </button>
              </div>

              <div className="relative mx-auto my-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-[#e8d5d9] bg-gradient-to-br from-[#faf6f7] via-[#fffdfd] to-[#f8f2f4] p-4 sm:p-6 shadow-2xl">
                <div className="relative mx-auto w-full max-w-5xl select-none">
                  {/* Reuse identical SVG in fullscreen modal */}
                  <svg viewBox="0 0 1000 730" className="w-full h-auto drop-shadow-xs" style={{ maxHeight: '82vh' }}>
                    <defs>
                      <radialGradient id="fs-org-table-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="70%" stopColor="#fbf6f7" />
                        <stop offset="100%" stopColor="#eddce0" />
                      </radialGradient>
                      <linearGradient id="fs-org-bar-wood" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8d6255" />
                        <stop offset="100%" stopColor="#6e473b" />
                      </linearGradient>
                      <linearGradient id="fs-org-buffet-wood" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#7a554a" />
                        <stop offset="100%" stopColor="#5d3b32" />
                      </linearGradient>
                      <linearGradient id="fs-org-ca-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fdf4f7" />
                        <stop offset="50%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#fbf0f4" />
                      </linearGradient>
                    </defs>

                    <rect x="18" y="18" width="964" height="662" rx="24" fill="none" stroke="#e2cbd1" strokeWidth="2" strokeDasharray="6 4" />

                    {/* Bar */}
                    <g className="cursor-default">
                      <rect x="28" y="24" width="148" height="56" rx="10" fill="url(#fs-org-bar-wood)" stroke="#57362c" strokeWidth="2" />
                      <rect x="33" y="29" width="138" height="46" rx="7" fill="#faf2ee" stroke="#c7a79a" strokeWidth="1.2" />
                      <foreignObject x="34" y="30" width="136" height="44">
                        <div className="flex h-full flex-col items-center justify-center text-center text-[#57362c]">
                          <span className="font-display text-sm font-bold text-[#3b231c]">Bar</span>
                          <span className="text-[9.5px] uppercase font-bold text-[#5c382d]">Drinks &amp; Refreshments</span>
                        </div>
                      </foreignObject>
                    </g>

                    {/* Bridal C & A */}
                    <g className="cursor-default">
                      <path d="M 390 40 Q 480 14, 570 40" fill="none" stroke="#d8bfc6" strokeWidth="2" strokeDasharray="4 2" />
                      <rect x="395" y="28" width="170" height="48" rx="24" fill="url(#fs-org-ca-grad)" stroke="#c97a8b" strokeWidth="2.5" />
                      <text x="480" y="60" textAnchor="middle" fill="#8a384b" fontSize="22" fontWeight="bold" className="font-display tracking-widest select-none">
                        C &amp; A
                      </text>
                      <circle cx="445" cy="100" r="14" fill="#c97a8b" stroke="#8a384b" strokeWidth="2" />
                      <text x="445" y="104.5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">C</text>
                      <circle cx="515" cy="100" r="14" fill="#c97a8b" stroke="#8a384b" strokeWidth="2" />
                      <text x="515" y="104.5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">A</text>
                    </g>

                    {/* Food Buffet */}
                    <g className="cursor-default">
                      <rect x="925" y="26" width="48" height="605" rx="12" fill="url(#fs-org-buffet-wood)" stroke="#4e3128" strokeWidth="2" />
                      <rect x="930" y="31" width="38" height="595" rx="8" fill="#faf2ee" stroke="#cfb0a3" strokeWidth="1.2" />
                      <text x="949" y="328" fill="#3b231c" fontSize="17" fontWeight="bold" letterSpacing="6" textAnchor="middle" transform="rotate(90, 949, 328)">FOOD</text>
                    </g>

                    {/* Dance Floor */}
                    <g opacity="0.85" pointerEvents="none">
                      <ellipse cx="480" cy="335" rx="105" ry="68" fill="none" stroke="#c97a8b" strokeWidth="1.8" strokeDasharray="5 5" />
                      <text x="480" y="330" textAnchor="middle" fill="#9e475a" fontSize="13" fontWeight="bold" letterSpacing="4">DANCE FLOOR</text>
                    </g>

                    {/* 7 Guest Tables */}
                    {TABLES.map(table => {
                      const radiusOrbit = 66;
                      const tableRadius = 43;
                      const seatRadius = 14;
                      const occupiedCount = Array.from({ length: table.capacity }).filter((_, i) =>
                        occupiedSeatsMap.has(`T${table.id}-S${i + 1}`),
                      ).length;

                      return (
                        <g key={table.id}>
                          <circle cx={table.cx} cy={table.cy} r={tableRadius} fill="url(#fs-org-table-grad)" stroke="#8a384b" strokeWidth="2" />
                          <text x={table.cx} y={table.cy - 9} textAnchor="middle" fill="#1c1917" fontSize="14" fontWeight="bold">{table.name}</text>
                          <text x={table.cx} y={table.cy + 6} textAnchor="middle" fill="#9e475a" fontSize="11" fontWeight="bold">{table.theme}</text>
                          <text x={table.cx} y={table.cy + 20} textAnchor="middle" fill="#57534e" fontSize="10" fontWeight="600">{occupiedCount}/{table.capacity}</text>

                          {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                            const seatNum = seatIdx + 1;
                            const seatId = `T${table.id}-S${seatNum}`;
                            const angle = (seatIdx * 45 - 90) * (Math.PI / 180);
                            const sx = table.cx + radiusOrbit * Math.cos(angle);
                            const sy = table.cy + radiusOrbit * Math.sin(angle);
                            const occupant = occupiedSeatsMap.get(seatId);

                            return (
                              <g key={seatId}>
                                {occupant ? (
                                  <circle cx={sx} cy={sy} r={seatRadius} fill="#059669" stroke="#047857" strokeWidth="2" />
                                ) : (
                                  <circle cx={sx} cy={sy} r={seatRadius} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.8" strokeDasharray="3 2" />
                                )}
                                <text x={sx} y={sy + 4} textAnchor="middle" fill={occupant ? '#ffffff' : '#94a3b8'} fontSize="11" fontWeight="bold">
                                  {seatNum}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}

                    {/* Entrance */}
                    <g>
                      <rect x="300" y="665" width="360" height="34" rx="12" fill="#ffffff" stroke="#cfb0a3" strokeWidth="1.8" />
                      <text x="480" y="687" textAnchor="middle" fill="#523933" fontSize="11" fontWeight="bold" letterSpacing="3">▼ MAIN ENTRANCE &amp; GARDEN PATIO ▼</text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DIETARY & CATERING NEEDS */}
      {/* ========================================================================= */}
      {activeTab === 'dietary' && (
        <div className="space-y-6">
          {/* Quick Dietary Filters */}
          <div className="flex flex-wrap gap-2">
            {DIETARY_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setDietaryCategoryFilter(cat.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                  dietaryCategoryFilter === cat.id
                    ? 'bg-[#7f2540] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar inside dietary */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by guest name, allergy, table number, or preference..."
              className={`${inputClass} pl-10`}
            />
          </div>

          {/* Dietary Records List */}
          {filteredDietaryRecords.length > 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-5 py-3">Guest &amp; Household</th>
                      <th className="px-4 py-3">Table &amp; Seat</th>
                      <th className="px-4 py-3">Dietary Requirements / Allergies</th>
                      <th className="px-4 py-3">Food &amp; Drink Venue Wishes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredDietaryRecords.map(item => (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-stone-900">{item.guestName}</p>
                          <p className="text-[11px] text-stone-500">{item.householdName}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-pink-50 border border-pink-200 px-2.5 py-1 text-xs font-semibold text-[#8a2947]">
                            {item.table}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-1.5 max-w-md">
                            {item.dietaryNormalized.tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.dietaryNormalized.tags.map(tag => (
                                  <span
                                    key={tag.id}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold border shadow-2xs ${tag.badgeBg} ${tag.badgeText} ${tag.badgeBorder}`}
                                  >
                                    <span className="text-sm">{tag.icon}</span>
                                    <span>{tag.label}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.dietaryNormalized.notes && (
                              <div className="inline-flex items-center gap-1.5 text-xs text-stone-700 bg-stone-50 border border-stone-200/90 rounded-lg px-2.5 py-1">
                                <span className="font-semibold text-stone-500">Note:</span>
                                <span>{item.dietaryNormalized.notes}</span>
                              </div>
                            )}
                            {item.dietaryNormalized.tags.length === 0 && !item.dietaryNormalized.notes && (
                              <span className="text-stone-400 text-xs italic">None specified</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-stone-600">
                          {item.preferences ? (
                            <p className="italic text-[11px]">“{item.preferences}”</p>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white/80 p-8 text-center">
              <Utensils className="mx-auto h-8 w-8 text-stone-400 mb-2" />
              <h4 className="font-serif text-base font-bold text-stone-800">No matching dietary requests found</h4>
              <p className="text-xs text-stone-500 mt-1">
                Try selecting &ldquo;All Special Diets&rdquo; or clearing your search term.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WEDDING FAVOURS POLL */}
      {/* ========================================================================= */}
      {activeTab === 'favours' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/60 via-white to-purple-50/60 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-800">
              <Gift className="h-4 w-4" />
              <span>Wedding Favours Poll Results</span>
            </div>
            <h3 className="mt-1 font-serif text-xl font-bold text-stone-900">
              Guest Keepsake &amp; Favour Preferences
            </h3>
            <p className="mt-1 text-xs text-stone-600 max-w-2xl">
              Here is what attending parties have chosen to take home from the wedding. Use these totals to order supplies.
            </p>
          </div>

          {/* Favours Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favourPollData.options.map(opt => (
              <div key={opt.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{opt.emoji}</span>
                      <div>
                        <h4 className="font-serif text-base font-bold text-stone-900">{opt.label}</h4>
                        <p className="text-xs text-stone-500">{opt.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-serif text-xl font-bold text-[#7f2540]">
                        {opt.householdCount} <span className="text-xs font-normal text-stone-500">parties</span>
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {opt.guestCount} guests ({opt.percentage}%)
                      </p>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ce6b87] to-[#7f2540] transition-all duration-500"
                      style={{ width: `${opt.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Recipient Party List */}
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Parties who chose this ({opt.voters.length}):
                  </p>
                  {opt.voters.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {opt.voters.map(v => (
                        <span key={v.id} className="rounded-lg bg-stone-50 border border-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                          {v.name} ({v.attendingCount || 1})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-stone-400">No parties have selected this yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Unselected Card */}
          {favourPollData.unselected.householdCount > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800">
                  ⏳ {favourPollData.unselected.householdCount} attending parties have not chosen a favour yet
                </span>
                <span className="text-stone-500">
                  {favourPollData.unselected.guestCount} guests ({favourPollData.unselected.percentage}%)
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {favourPollData.unselected.voters.map(v => (
                  <span key={v.id} className="rounded-md bg-white border border-stone-200 px-2 py-0.5 text-[11px] text-stone-600">
                    {v.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ALL RSVP RECORDS (MASTER EXPLORER) */}
      {/* ========================================================================= */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Controls & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-500 mr-1">Status:</span>
              {(['all', 'attending', 'declined', 'pending'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#7f2540] text-white'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search guest, code, email, message..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 py-1.5 text-xs text-stone-800 outline-none focus:bg-white focus:border-[#7f2540]"
              />
            </div>
          </div>

          {/* Master Table */}
          {filteredMasterRecords.length > 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-5 py-3">Household / Code</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Guests</th>
                      <th className="px-4 py-3">Table &amp; Seats</th>
                      <th className="px-4 py-3">Favour</th>
                      <th className="px-4 py-3">Dietary / Notes</th>
                      <th className="px-4 py-3">Contact &amp; Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredMasterRecords.map(h => {
                      const attendingMembers = h.members?.filter(m => m.attending !== false) || [];
                      const isAttending = h.rsvpStatus === 'attending';
                      const isDeclined = h.rsvpStatus === 'declined';

                      return (
                        <tr key={h.id} className="hover:bg-stone-50/60 transition">
                          {/* Household */}
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-stone-900">{h.name}</p>
                            <span className="font-mono text-[10px] text-stone-400 uppercase">{h.inviteCode}</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                isAttending
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isDeclined
                                    ? 'bg-stone-100 text-stone-600'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isAttending ? 'Attending' : isDeclined ? 'Declined' : 'Pending'}
                            </span>
                          </td>

                          {/* Guests */}
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-stone-800">
                              {h.attendingCount || (isAttending ? 1 : 0)} of {h.partySize}
                            </p>
                            {attendingMembers.length > 0 && (
                              <p className="text-[10px] text-stone-500 mt-0.5 truncate max-w-xs">
                                {attendingMembers.map(m => m.name).join(', ')}
                                {h.companionNames && h.companionNames.length > 0 ? ` (+1 ${h.companionNames.join(', ')})` : ''}
                              </p>
                            )}
                          </td>

                          {/* Table & Seats */}
                          <td className="px-4 py-3.5">
                            {isAttending ? (
                              h.tableNumber ? (
                                <span className="inline-flex rounded-md bg-pink-50 border border-pink-200 px-2 py-0.5 text-[11px] font-semibold text-[#8a2947]">
                                  {h.tableNumber}
                                </span>
                              ) : (
                                <span className="text-amber-600 text-[11px] italic font-medium">Unassigned</span>
                              )
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </td>

                          {/* Favour */}
                          <td className="px-4 py-3.5">
                            {h.songRequest ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-800">
                                {h.songRequest}
                              </span>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </td>

                          {/* Dietary */}
                          <td className="px-4 py-3.5">
                            {h.dietaryDetails ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                                ⚠️ {h.dietaryDetails}
                              </span>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                            {h.mealSelection && (
                              <p className="text-[10px] text-stone-500 italic mt-0.5">
                                Drinks: {h.mealSelection}
                              </p>
                            )}
                          </td>

                          {/* Contact & Message */}
                          <td className="px-4 py-3.5">
                            {(h.email || h.phone) && (
                              <div className="text-[11px] text-stone-600">
                                {h.email && <p className="truncate max-w-[140px]">{h.email}</p>}
                                {h.phone && <p>{h.phone}</p>}
                              </div>
                            )}
                            {h.message && (
                              <p className="mt-1 text-[11px] text-stone-700 italic border-l-2 border-pink-300 pl-2">
                                &ldquo;{h.message}&rdquo;
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white/80 p-8 text-center">
              <CalendarCheck className="mx-auto h-8 w-8 text-stone-400 mb-2" />
              <h4 className="font-serif text-base font-bold text-stone-800">No RSVP records match your filter</h4>
              <p className="text-xs text-stone-500 mt-1">Try clearing your search term or setting Status to All.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
