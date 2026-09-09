import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Gift,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  Users,
  Utensils,
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
    let seatedGuestsCount = 2; // Cam & Abby at Table 1, Seats 1 & 2
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

    // Cam & Abby sit with everyone else at Table 1, Seats 1 & 2 (no head table)
    map.set('T1-S1', {
      tableId: 1,
      tableName: 'Table 1',
      tableTheme: 'Protea',
      seatNumber: 1,
      seatId: 'T1-S1',
      isOccupied: true,
      isBridal: false,
      occupantName: 'Cameron Nel (Groom)',
      householdName: 'Cameron & Abby',
      householdId: 'household-cam-abby',
      favour: 'Stroopwaffels',
    });
    map.set('T1-S2', {
      tableId: 1,
      tableName: 'Table 1',
      tableTheme: 'Protea',
      seatNumber: 2,
      seatId: 'T1-S2',
      isOccupied: true,
      isBridal: false,
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
                  <span className="h-3.5 w-3.5 rounded-full bg-[#fde8ee] border border-[#d47a8d]" />
                  <span>Cam &amp; Abby (Table 1)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-[#e3ede5] border border-[#7ea78a]" />
                  <span>Reserved Seat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-[#fdf2da] border border-[#cfa347]" />
                  <span>Special Diet Requested</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-white border border-[#d4c2b8]" />
                  <span>Available Seat</span>
                </div>
              </div>

              {/* SVG Floor Plan Container */}
              <div className="relative mx-auto w-full max-w-5xl select-none">
                <svg viewBox="0 0 1100 960" className="w-full h-auto drop-shadow-md rounded-2xl overflow-hidden bg-white" style={{ maxHeight: '88vh' }}>
                  <defs>
                    <filter id="org-table-soft-shadow" x="-40%" y="-40%" width="180%" height="180%">
                      <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#8a6f66" floodOpacity="0.16" />
                    </filter>
                    <linearGradient id="org-eucalyptus-leaf" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#7a9d82" />
                      <stop offset="100%" stopColor="#55755d" />
                    </linearGradient>
                    <linearGradient id="org-bar-wood" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8ded6" />
                      <stop offset="100%" stopColor="#d9cdc3" />
                    </linearGradient>
                    <linearGradient id="org-buffet-wood" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#e8ded6" />
                      <stop offset="100%" stopColor="#d9cdc3" />
                    </linearGradient>
                  </defs>

                  {/* Poster card background */}
                  <rect
                    x="8"
                    y="8"
                    width="1084"
                    height="944"
                    rx="24"
                    fill="#ffffff"
                    stroke="#ece7e1"
                    strokeWidth="2"
                  />

                  {/* Botanical Eucalyptus Foliage: Top-Right Corner */}
                  <g className="pointer-events-none" opacity="0.88">
                    <path
                      d="M 1100 0 Q 1030 50 970 110 T 920 180"
                      fill="none"
                      stroke="#5c7a64"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 1100 40 Q 1040 80 1000 140"
                      fill="none"
                      stroke="#6e8a75"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <ellipse cx="1055" cy="42" rx="22" ry="12" transform="rotate(-30, 1055, 42)" fill="url(#org-eucalyptus-leaf)" opacity="0.85" />
                    <ellipse cx="1015" cy="72" rx="24" ry="13" transform="rotate(-40, 1015, 72)" fill="#688a70" opacity="0.8" />
                    <ellipse cx="980" cy="115" rx="26" ry="14" transform="rotate(-50, 980, 115)" fill="#5d8065" opacity="0.85" />
                    <ellipse cx="945" cy="155" rx="24" ry="13" transform="rotate(-58, 945, 155)" fill="#73947a" opacity="0.8" />
                    <ellipse cx="915" cy="190" rx="20" ry="11" transform="rotate(-65, 915, 190)" fill="#81a188" opacity="0.75" />
                    <ellipse cx="1070" cy="85" rx="20" ry="11" transform="rotate(-15, 1070, 85)" fill="#608268" opacity="0.85" />
                    <ellipse cx="1030" cy="130" rx="22" ry="12" transform="rotate(-25, 1030, 130)" fill="#6f9177" opacity="0.8" />
                    <ellipse cx="990" cy="175" rx="20" ry="11" transform="rotate(-35, 990, 175)" fill="#7da085" opacity="0.75" />
                  </g>

                  {/* Botanical Eucalyptus Foliage: Bottom-Left Corner */}
                  <g className="pointer-events-none" opacity="0.88">
                    <path
                      d="M 0 960 Q 70 910 130 850 T 180 780"
                      fill="none"
                      stroke="#5c7a64"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 0 920 Q 60 880 100 820"
                      fill="none"
                      stroke="#6e8a75"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <ellipse cx="45" cy="918" rx="22" ry="12" transform="rotate(150, 45, 918)" fill="url(#org-eucalyptus-leaf)" opacity="0.85" />
                    <ellipse cx="85" cy="888" rx="24" ry="13" transform="rotate(140, 85, 888)" fill="#688a70" opacity="0.8" />
                    <ellipse cx="120" cy="845" rx="26" ry="14" transform="rotate(130, 120, 845)" fill="#5d8065" opacity="0.85" />
                    <ellipse cx="155" cy="805" rx="24" ry="13" transform="rotate(122, 155, 805)" fill="#73947a" opacity="0.8" />
                    <ellipse cx="185" cy="770" rx="20" ry="11" transform="rotate(115, 185, 770)" fill="#81a188" opacity="0.75" />
                    <ellipse cx="30" cy="875" rx="20" ry="11" transform="rotate(165, 30, 875)" fill="#608268" opacity="0.85" />
                    <ellipse cx="70" cy="830" rx="22" ry="12" transform="rotate(155, 70, 830)" fill="#6f9177" opacity="0.8" />
                    <ellipse cx="110" cy="785" rx="20" ry="11" transform="rotate(145, 110, 785)" fill="#7da085" opacity="0.75" />
                  </g>

                  {/* Seating Plan Poster Header */}
                  <g className="cursor-default select-none">
                    <text
                      x="550"
                      y="54"
                      textAnchor="middle"
                      fill="#1c1917"
                      fontSize="30"
                      fontWeight="800"
                      letterSpacing="7"
                      className="font-serif uppercase"
                    >
                      WEDDING
                    </text>
                    <text
                      x="550"
                      y="94"
                      textAnchor="middle"
                      fill="#c59b48"
                      fontSize="38"
                      fontStyle="italic"
                      className="font-serif"
                      style={{ fontFamily: "'Playfair Display', Georgia, cursive" }}
                    >
                      Seating Plan
                    </text>
                    <text
                      x="550"
                      y="120"
                      textAnchor="middle"
                      fill="#c59b48"
                      fontSize="12"
                      fontWeight="700"
                      letterSpacing="2.5"
                      className="font-sans uppercase"
                    >
                      8 Seats per table • 6FT round • 64 pax
                    </text>
                  </g>

                  {/* TOP-LEFT: BAR */}
                  <g className="cursor-default">
                    <rect
                      x="24"
                      y="80"
                      width="56"
                      height="200"
                      rx="12"
                      fill="url(#org-bar-wood)"
                      stroke="#b39c8e"
                      strokeWidth="2"
                      className="drop-shadow-sm"
                    />
                    <rect
                      x="29"
                      y="85"
                      width="46"
                      height="190"
                      rx="8"
                      fill="#fffdfa"
                      stroke="#d9cdc3"
                      strokeWidth="1.2"
                    />
                    <circle cx="52" cy="112" r="9" fill="#f5ede6" stroke="#c5b0a3" strokeWidth="1.2" />
                    <path d="M 47 112 L 57 112 M 52 112 L 52 119 M 48 119 L 56 119" stroke="#7a6256" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="37" y1="136" x2="67" y2="136" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />
                    <text
                      x="52"
                      y="180"
                      fill="#5c4a40"
                      fontSize="15"
                      fontWeight="bold"
                      letterSpacing="5"
                      textAnchor="middle"
                      transform="rotate(-90, 52, 180)"
                      className="font-display select-none uppercase"
                    >
                      BAR
                    </text>
                    <line x1="37" y1="224" x2="67" y2="224" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />
                    <circle cx="52" cy="248" r="9" fill="#f5ede6" stroke="#c5b0a3" strokeWidth="1.2" />
                    <path d="M 47 248 L 57 248 M 52 248 L 52 255 M 48 255 L 56 255" stroke="#7a6256" strokeWidth="1.4" strokeLinecap="round" />
                  </g>

                  {/* RIGHT SIDE: FOOD BUFFET */}
                  <g className="cursor-default">
                    <rect
                      x="1020"
                      y="260"
                      width="56"
                      height="380"
                      rx="12"
                      fill="url(#org-buffet-wood)"
                      stroke="#b39c8e"
                      strokeWidth="2"
                      className="drop-shadow-sm"
                    />
                    <rect
                      x="1025"
                      y="265"
                      width="46"
                      height="370"
                      rx="8"
                      fill="#fffdfa"
                      stroke="#d9cdc3"
                      strokeWidth="1.2"
                    />
                    <ellipse cx="1048" cy="300" rx="12" ry="18" fill="#f5ede6" stroke="#c5b0a3" strokeWidth="1.2" />
                    <line x1="1033" y1="345" x2="1063" y2="345" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />
                    <text
                      x="1048"
                      y="450"
                      fill="#5c4a40"
                      fontSize="16"
                      fontWeight="bold"
                      letterSpacing="6"
                      textAnchor="middle"
                      transform="rotate(90, 1048, 450)"
                      className="font-display select-none uppercase"
                    >
                      FOOD
                    </text>
                    <line x1="1033" y1="555" x2="1063" y2="555" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />
                    <ellipse cx="1048" cy="600" rx="12" ry="18" fill="#f5ede6" stroke="#c5b0a3" strokeWidth="1.2" />
                  </g>

                  {/* MIDDLE: DANCE FLOOR */}
                  <g opacity="0.95" pointerEvents="none">
                    <rect
                      x="405"
                      y="375"
                      width="290"
                      height="190"
                      rx="24"
                      fill="#fdf5f7"
                      fillOpacity="0.75"
                      stroke="#dfaeb9"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                    <rect
                      x="419"
                      y="389"
                      width="262"
                      height="162"
                      rx="18"
                      fill="#fff9fa"
                      stroke="#eed5dc"
                      strokeWidth="1.2"
                    />
                    <text
                      x="550"
                      y="458"
                      textAnchor="middle"
                      fill="#9e475a"
                      fontSize="15"
                      fontWeight="bold"
                      letterSpacing="4"
                      className="font-display select-none uppercase"
                    >
                      DANCE FLOOR
                    </text>
                    <path
                      d="M 550 484 C 550 484 543 477 539 473 C 535 469 535 464 538 461 C 541 458 546 458 549 461 L 550 463 L 551 461 C 554 458 559 458 562 461 C 565 464 565 469 561 473 Z"
                      fill="#df8b9d"
                    />
                    <text
                      x="550"
                      y="508"
                      textAnchor="middle"
                      fill="#b86b7c"
                      fontSize="10"
                      fontWeight="600"
                      letterSpacing="2"
                      className="select-none uppercase font-sans"
                    >
                      CELEBRATION &amp; DANCING
                    </text>
                  </g>

                  {/* 8 Guest Tables */}
                  {TABLES.map(table => {
                    const radiusOrbit = 74;
                    const tableRadius = 52;
                    const seatRadius = 13.5;

                    const occupiedCount = Array.from({ length: table.capacity }).filter((_, i) =>
                      occupiedSeatsMap.has(`T${table.id}-S${i + 1}`),
                    ).length;

                    const isHighlighted = selectedTableFilter === 'all' || selectedTableFilter === table.id;

                    return (
                      <g key={table.id} opacity={isHighlighted ? 1 : 0.35} className="transition-opacity">
                        {/* Table top circle with warm gold rim ring */}
                        <circle
                          cx={table.cx}
                          cy={table.cy}
                          r={tableRadius}
                          fill="#ffffff"
                          stroke={isHighlighted ? '#c47b8b' : '#c59b48'}
                          strokeWidth={isHighlighted ? '4.5' : '3.2'}
                          filter="url(#org-table-soft-shadow)"
                        />
                        {/* Invisible click layer for table focus filter */}
                        <circle
                          cx={table.cx}
                          cy={table.cy}
                          r={tableRadius}
                          fill="transparent"
                          className="cursor-pointer"
                          onClick={() => setSelectedTableFilter(selectedTableFilter === table.id ? 'all' : table.id)}
                        />

                        {/* Table Info */}
                        {table.id === 1 ? (
                          <g className="select-none pointer-events-none">
                            <text
                              x={table.cx}
                              y={table.cy - 15}
                              textAnchor="middle"
                              fill="#1c1917"
                              fontSize="16"
                              fontWeight="bold"
                              className="font-serif"
                            >
                              {table.name}
                            </text>
                            <text
                              x={table.cx}
                              y={table.cy - 1}
                              textAnchor="middle"
                              fill={table.textTint}
                              fontSize="10.5"
                              fontWeight="bold"
                              letterSpacing="0.3"
                              className="font-sans"
                            >
                              {table.theme}
                            </text>
                            <text
                              x={table.cx}
                              y={table.cy + 13}
                              textAnchor="middle"
                              fill="#57534e"
                              fontSize="9"
                              fontWeight="600"
                              className="font-sans"
                            >
                              {occupiedCount}/{table.capacity} seated
                            </text>
                            <text
                              x={table.cx}
                              y={table.cy + 27}
                              textAnchor="middle"
                              fill="#b85b73"
                              fontSize="9.5"
                              fontWeight="bold"
                              className="font-sans"
                            >
                              Cam &amp; Abby 💕
                            </text>
                          </g>
                        ) : (
                          <g className="select-none pointer-events-none">
                            <text
                              x={table.cx}
                              y={table.cy - 10}
                              textAnchor="middle"
                              fill="#1c1917"
                              fontSize="17"
                              fontWeight="bold"
                              className="font-serif"
                            >
                              {table.name}
                            </text>
                            <text
                              x={table.cx}
                              y={table.cy + 6}
                              textAnchor="middle"
                              fill={table.textTint}
                              fontSize="10.5"
                              fontWeight="bold"
                              letterSpacing="0.3"
                              className="font-sans"
                            >
                              {table.theme}
                            </text>
                            <text
                              x={table.cx}
                              y={table.cy + 22}
                              textAnchor="middle"
                              fill="#57534e"
                              fontSize="9.5"
                              fontWeight="600"
                              className="font-sans"
                            >
                              {occupiedCount}/{table.capacity} seated
                            </text>
                          </g>
                        )}

                        {/* 8 Seats around Table */}
                        {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                          const seatNum = seatIdx + 1;
                          const seatId = `T${table.id}-S${seatNum}`;
                          const angle = ((seatIdx * 360) / table.capacity - 90) * (Math.PI / 180);
                          const sx = table.cx + radiusOrbit * Math.cos(angle);
                          const sy = table.cy + radiusOrbit * Math.sin(angle);

                          const occupant = occupiedSeatsMap.get(seatId);
                          const isOccupied = Boolean(occupant);
                          const hasDietary = Boolean(occupant?.dietary);

                          const isCamOrAbby = table.id === 1 && (seatNum === 1 || seatNum === 2);

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
                                    fill={isCamOrAbby ? '#fde8ee' : hasDietary ? '#fdf2da' : '#e3ede5'}
                                    stroke={isCamOrAbby ? '#d47a8d' : hasDietary ? '#cfa347' : '#7ea78a'}
                                    strokeWidth="1.8"
                                  />
                                  <text
                                    x={sx}
                                    y={sy + 3}
                                    textAnchor="middle"
                                    fontSize={isCamOrAbby ? '7' : '8'}
                                    fontWeight="bold"
                                    fill={isCamOrAbby ? '#8f2d48' : hasDietary ? '#7a5a1e' : '#284837'}
                                    className="select-none pointer-events-none font-mono"
                                  >
                                    {isCamOrAbby ? (seatNum === 1 ? 'CAM' : 'ABBY') : seatNum}
                                  </text>
                                </g>
                              ) : (
                                <g>
                                  <circle
                                    cx={sx}
                                    cy={sy}
                                    r={seatRadius - 1}
                                    fill="#ffffff"
                                    stroke="#d4c2b8"
                                    strokeWidth="1.4"
                                  />
                                  <text
                                    x={sx}
                                    y={sy + 3}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill="#5c4f4a"
                                    fontWeight="600"
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

                  {/* MAIN ENTRANCE & GARDEN PATIO */}
                  <g>
                    <rect
                      x="380"
                      y="880"
                      width="340"
                      height="38"
                      rx="14"
                      fill="#faf7f5"
                      stroke="#d4c5b9"
                      strokeWidth="1.8"
                      className="drop-shadow-xs"
                    />
                    <text
                      x="550"
                      y="904"
                      textAnchor="middle"
                      fill="#4a3c37"
                      fontSize="11"
                      fontWeight="bold"
                      letterSpacing="3"
                      className="uppercase select-none font-display"
                    >
                      ▼ MAIN ENTRANCE &amp; GARDEN PATIO ▼
                    </text>
                  </g>
                </svg>

                {/* Seat Hover Tooltip Overlay */}
                {hoveredSeat && (
                  <div
                    className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full pb-3 animate-in fade-in zoom-in-95 duration-150"
                    style={{
                      left: `${(hoveredSeat.x / 1100) * 100}%`,
                      top: `${(hoveredSeat.y / 960) * 100}%`,
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
              {/* 8 Guest Tables Cards (Cam & Abby sit at Table 1, Seats 1 & 2) */}
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
                {/* Map Legend */}
                <div className="flex flex-wrap items-center gap-4 py-2 text-xs text-stone-600 border-b border-stone-200/60 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#fde8ee] border border-[#d47a8d]" />
                    <span>Cam &amp; Abby (Table 1)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#e3ede5] border border-[#7ea78a]" />
                    <span>Reserved Seat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#fdf2da] border border-[#cfa347]" />
                    <span>Special Diet Requested</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-full bg-white border border-[#d4c2b8]" />
                    <span>Available Seat</span>
                  </div>
                </div>

                <div className="relative mx-auto w-full max-w-5xl select-none">
                  {/* Reuse identical SVG in fullscreen modal */}
                  <svg viewBox="0 0 1100 960" className="w-full h-auto drop-shadow-md rounded-2xl overflow-hidden bg-white" style={{ maxHeight: '88vh' }}>
                    <defs>
                      <filter id="fs-org-table-soft-shadow" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#8a6f66" floodOpacity="0.16" />
                      </filter>
                      <linearGradient id="fs-org-eucalyptus-leaf" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#7a9d82" />
                        <stop offset="100%" stopColor="#55755d" />
                      </linearGradient>
                      <linearGradient id="fs-org-bar-wood" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e8ded6" />
                        <stop offset="100%" stopColor="#d9cdc3" />
                      </linearGradient>
                      <linearGradient id="fs-org-buffet-wood" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e8ded6" />
                        <stop offset="100%" stopColor="#d9cdc3" />
                      </linearGradient>
                    </defs>

                    {/* Poster card background */}
                    <rect
                      x="8"
                      y="8"
                      width="1084"
                      height="944"
                      rx="24"
                      fill="#ffffff"
                      stroke="#ece7e1"
                      strokeWidth="2"
                    />

                    {/* Botanical Eucalyptus Foliage: Top-Right Corner */}
                    <g className="pointer-events-none" opacity="0.88">
                      <path
                        d="M 1100 0 Q 1030 50 970 110 T 920 180"
                        fill="none"
                        stroke="#5c7a64"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 1100 40 Q 1040 80 1000 140"
                        fill="none"
                        stroke="#6e8a75"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <ellipse cx="1055" cy="42" rx="22" ry="12" transform="rotate(-30, 1055, 42)" fill="url(#fs-org-eucalyptus-leaf)" opacity="0.85" />
                      <ellipse cx="1015" cy="72" rx="24" ry="13" transform="rotate(-40, 1015, 72)" fill="#688a70" opacity="0.8" />
                      <ellipse cx="980" cy="115" rx="26" ry="14" transform="rotate(-50, 980, 115)" fill="#5d8065" opacity="0.85" />
                      <ellipse cx="945" cy="155" rx="24" ry="13" transform="rotate(-58, 945, 155)" fill="#73947a" opacity="0.8" />
                      <ellipse cx="915" cy="190" rx="20" ry="11" transform="rotate(-65, 915, 190)" fill="#81a188" opacity="0.75" />
                      <ellipse cx="1070" cy="85" rx="20" ry="11" transform="rotate(-15, 1070, 85)" fill="#608268" opacity="0.85" />
                      <ellipse cx="1030" cy="130" rx="22" ry="12" transform="rotate(-25, 1030, 130)" fill="#6f9177" opacity="0.8" />
                      <ellipse cx="990" cy="175" rx="20" ry="11" transform="rotate(-35, 990, 175)" fill="#7da085" opacity="0.75" />
                    </g>

                    {/* Botanical Eucalyptus Foliage: Bottom-Left Corner */}
                    <g className="pointer-events-none" opacity="0.88">
                      <path
                        d="M 0 960 Q 70 910 130 850 T 180 780"
                        fill="none"
                        stroke="#5c7a64"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 0 920 Q 60 880 100 820"
                        fill="none"
                        stroke="#6e8a75"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <ellipse cx="45" cy="918" rx="22" ry="12" transform="rotate(150, 45, 918)" fill="url(#fs-org-eucalyptus-leaf)" opacity="0.85" />
                      <ellipse cx="85" cy="888" rx="24" ry="13" transform="rotate(140, 85, 888)" fill="#688a70" opacity="0.8" />
                      <ellipse cx="120" cy="845" rx="26" ry="14" transform="rotate(130, 120, 845)" fill="#5d8065" opacity="0.85" />
                      <ellipse cx="155" cy="805" rx="24" ry="13" transform="rotate(122, 155, 805)" fill="#73947a" opacity="0.8" />
                      <ellipse cx="185" cy="770" rx="20" ry="11" transform="rotate(115, 185, 770)" fill="#81a188" opacity="0.75" />
                      <ellipse cx="30" cy="875" rx="20" ry="11" transform="rotate(165, 30, 875)" fill="#608268" opacity="0.85" />
                      <ellipse cx="70" cy="830" rx="22" ry="12" transform="rotate(155, 70, 830)" fill="#6f9177" opacity="0.8" />
                      <ellipse cx="110" cy="785" rx="20" ry="11" transform="rotate(145, 110, 785)" fill="#7da085" opacity="0.75" />
                    </g>

                    {/* Seating Plan Poster Header */}
                    <g className="cursor-default select-none">
                      <text
                        x="550"
                        y="54"
                        textAnchor="middle"
                        fill="#1c1917"
                        fontSize="30"
                        fontWeight="800"
                        letterSpacing="7"
                        className="font-serif uppercase"
                      >
                        WEDDING
                      </text>
                      <text
                        x="550"
                        y="94"
                        textAnchor="middle"
                        fill="#c59b48"
                        fontSize="38"
                        fontStyle="italic"
                        className="font-serif"
                        style={{ fontFamily: "'Playfair Display', Georgia, cursive" }}
                      >
                        Seating Plan
                      </text>
                      <text
                        x="550"
                        y="120"
                        textAnchor="middle"
                        fill="#c59b48"
                        fontSize="12"
                        fontWeight="700"
                        letterSpacing="2.5"
                        className="font-sans uppercase"
                      >
                        8 Seats per table • 6FT round • 64 pax
                      </text>
                    </g>

                    {/* TOP-LEFT: BAR */}
                    <g className="cursor-default">
                      <rect
                        x="24"
                        y="80"
                        width="56"
                        height="200"
                        rx="12"
                        fill="url(#fs-org-bar-wood)"
                        stroke="#b39c8e"
                        strokeWidth="2"
                        className="drop-shadow-sm"
                      />
                      <rect
                        x="29"
                        y="85"
                        width="46"
                        height="190"
                        rx="8"
                        fill="#fffdfa"
                        stroke="#d9cdc3"
                        strokeWidth="1.2"
                      />
                      <circle cx="52" cy="112" r="9" fill="#f5ede6" stroke="#c5b0a3" strokeWidth="1.2" />
                      <path d="M 47 112 L 57 112 M 52 112 L 52 119 M 48 119 L 56 119" stroke="#7a6256" strokeWidth="1.4" strokeLinecap="round" />
                      <line x1="37" y1="136" x2="67" y2="136" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />
                      <text
                        x="52"
                        y="180"
                        fill="#5c4a40"
                        fontSize="15"
                        fontWeight="bold"
                        letterSpacing="5"
                        textAnchor="middle"
                        transform="rotate(-90, 52, 180)"
                        className="font-display select-none uppercase"
                      >
                        BAR
                      </text>
                      <line x1="37" y1="224" x2="67" y2="224" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />
                      <circle cx="52" cy="248" r="9" fill="#f5ede6" stroke="#c5b0a3" strokeWidth="1.2" />
                      <path d="M 47 248 L 57 248 M 52 248 L 52 255 M 48 255 L 56 255" stroke="#7a6256" strokeWidth="1.4" strokeLinecap="round" />
                    </g>

                    {/* RIGHT SIDE: FOOD BUFFET */}
                    <g className="cursor-default">
                      <rect
                        x="1020"
                        y="260"
                        width="56"
                        height="380"
                        rx="12"
                        fill="url(#fs-org-buffet-wood)"
                        stroke="#b39c8e"
                        strokeWidth="2"
                        className="drop-shadow-sm"
                      />
                      <rect
                        x="1025"
                        y="265"
                        width="46"
                        height="370"
                        rx="8"
                        fill="#fffdfa"
                        stroke="#d9cdc3"
                        strokeWidth="1.2"
                      />
                      <ellipse cx="1048" cy="300" rx="12" ry="18" fill="#f5ede6" stroke="#c5b0a3" strokeWidth="1.2" />
                      <line x1="1033" y1="345" x2="1063" y2="345" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />
                      <text
                        x="1048"
                        y="450"
                        fill="#5c4a40"
                        fontSize="16"
                        fontWeight="bold"
                        letterSpacing="6"
                        textAnchor="middle"
                        transform="rotate(90, 1048, 450)"
                        className="font-display select-none uppercase"
                      >
                        FOOD
                      </text>
                      <line x1="1033" y1="555" x2="1063" y2="555" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />
                      <ellipse cx="1048" cy="600" rx="12" ry="18" fill="#f5ede6" stroke="#c5b0a3" strokeWidth="1.2" />
                    </g>

                    {/* MIDDLE: DANCE FLOOR */}
                    <g opacity="0.95" pointerEvents="none">
                      <rect
                        x="405"
                        y="375"
                        width="290"
                        height="190"
                        rx="24"
                        fill="#fdf5f7"
                        fillOpacity="0.75"
                        stroke="#dfaeb9"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                      />
                      <rect
                        x="419"
                        y="389"
                        width="262"
                        height="162"
                        rx="18"
                        fill="#fff9fa"
                        stroke="#eed5dc"
                        strokeWidth="1.2"
                      />
                      <text
                        x="550"
                        y="458"
                        textAnchor="middle"
                        fill="#9e475a"
                        fontSize="15"
                        fontWeight="bold"
                        letterSpacing="4"
                        className="font-display select-none uppercase"
                      >
                        DANCE FLOOR
                      </text>
                      <path
                        d="M 550 484 C 550 484 543 477 539 473 C 535 469 535 464 538 461 C 541 458 546 458 549 461 L 550 463 L 551 461 C 554 458 559 458 562 461 C 565 464 565 469 561 473 Z"
                        fill="#df8b9d"
                      />
                      <text
                        x="550"
                        y="508"
                        textAnchor="middle"
                        fill="#b86b7c"
                        fontSize="10"
                        fontWeight="600"
                        letterSpacing="2"
                        className="select-none uppercase font-sans"
                      >
                        CELEBRATION &amp; DANCING
                      </text>
                    </g>

                    {/* 8 Guest Tables */}
                    {TABLES.map(table => {
                      const radiusOrbit = 74;
                      const tableRadius = 52;
                      const seatRadius = 13.5;

                      const occupiedCount = Array.from({ length: table.capacity }).filter((_, i) =>
                        occupiedSeatsMap.has(`T${table.id}-S${i + 1}`),
                      ).length;

                      const isHighlighted = selectedTableFilter === 'all' || selectedTableFilter === table.id;

                      return (
                        <g key={table.id} opacity={isHighlighted ? 1 : 0.35} className="transition-opacity">
                          {/* Table top circle with warm gold rim ring */}
                          <circle
                            cx={table.cx}
                            cy={table.cy}
                            r={tableRadius}
                            fill="#ffffff"
                            stroke={isHighlighted ? '#c47b8b' : '#c59b48'}
                            strokeWidth={isHighlighted ? '4.5' : '3.2'}
                            filter="url(#fs-org-table-soft-shadow)"
                          />
                          {/* Invisible click layer for table focus filter */}
                          <circle
                            cx={table.cx}
                            cy={table.cy}
                            r={tableRadius}
                            fill="transparent"
                            className="cursor-pointer"
                            onClick={() => setSelectedTableFilter(selectedTableFilter === table.id ? 'all' : table.id)}
                          />

                          {/* Table Info */}
                          {table.id === 1 ? (
                            <g className="select-none pointer-events-none">
                              <text
                                x={table.cx}
                                y={table.cy - 15}
                                textAnchor="middle"
                                fill="#1c1917"
                                fontSize="16"
                                fontWeight="bold"
                                className="font-serif"
                              >
                                {table.name}
                              </text>
                              <text
                                x={table.cx}
                                y={table.cy - 1}
                                textAnchor="middle"
                                fill={table.textTint}
                                fontSize="10.5"
                                fontWeight="bold"
                                letterSpacing="0.3"
                                className="font-sans"
                              >
                                {table.theme}
                              </text>
                              <text
                                x={table.cx}
                                y={table.cy + 13}
                                textAnchor="middle"
                                fill="#57534e"
                                fontSize="9"
                                fontWeight="600"
                                className="font-sans"
                              >
                                {occupiedCount}/{table.capacity} seated
                              </text>
                              <text
                                x={table.cx}
                                y={table.cy + 27}
                                textAnchor="middle"
                                fill="#b85b73"
                                fontSize="9.5"
                                fontWeight="bold"
                                className="font-sans"
                              >
                                Cam &amp; Abby 💕
                              </text>
                            </g>
                          ) : (
                            <g className="select-none pointer-events-none">
                              <text
                                x={table.cx}
                                y={table.cy - 10}
                                textAnchor="middle"
                                fill="#1c1917"
                                fontSize="17"
                                fontWeight="bold"
                                className="font-serif"
                              >
                                {table.name}
                              </text>
                              <text
                                x={table.cx}
                                y={table.cy + 6}
                                textAnchor="middle"
                                fill={table.textTint}
                                fontSize="10.5"
                                fontWeight="bold"
                                letterSpacing="0.3"
                                className="font-sans"
                              >
                                {table.theme}
                              </text>
                              <text
                                x={table.cx}
                                y={table.cy + 22}
                                textAnchor="middle"
                                fill="#57534e"
                                fontSize="9.5"
                                fontWeight="600"
                                className="font-sans"
                              >
                                {occupiedCount}/{table.capacity} seated
                              </text>
                            </g>
                          )}

                          {/* 8 Seats around Table */}
                          {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                            const seatNum = seatIdx + 1;
                            const seatId = `T${table.id}-S${seatNum}`;
                            const angle = ((seatIdx * 360) / table.capacity - 90) * (Math.PI / 180);
                            const sx = table.cx + radiusOrbit * Math.cos(angle);
                            const sy = table.cy + radiusOrbit * Math.sin(angle);

                            const occupant = occupiedSeatsMap.get(seatId);
                            const isOccupied = Boolean(occupant);
                            const hasDietary = Boolean(occupant?.dietary);

                            const isCamOrAbby = table.id === 1 && (seatNum === 1 || seatNum === 2);

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
                                      fill={isCamOrAbby ? '#fde8ee' : hasDietary ? '#fdf2da' : '#e3ede5'}
                                      stroke={isCamOrAbby ? '#d47a8d' : hasDietary ? '#cfa347' : '#7ea78a'}
                                      strokeWidth="1.8"
                                    />
                                    <text
                                      x={sx}
                                      y={sy + 3}
                                      textAnchor="middle"
                                      fontSize={isCamOrAbby ? '7' : '8'}
                                      fontWeight="bold"
                                      fill={isCamOrAbby ? '#8f2d48' : hasDietary ? '#7a5a1e' : '#284837'}
                                      className="select-none pointer-events-none font-mono"
                                    >
                                      {isCamOrAbby ? (seatNum === 1 ? 'CAM' : 'ABBY') : seatNum}
                                    </text>
                                  </g>
                                ) : (
                                  <g>
                                    <circle
                                      cx={sx}
                                      cy={sy}
                                      r={seatRadius - 1}
                                      fill="#ffffff"
                                      stroke="#d4c2b8"
                                      strokeWidth="1.4"
                                    />
                                    <text
                                      x={sx}
                                      y={sy + 3}
                                      textAnchor="middle"
                                      fontSize="8"
                                      fill="#5c4f4a"
                                      fontWeight="600"
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

                    {/* MAIN ENTRANCE & GARDEN PATIO */}
                    <g>
                      <rect
                        x="380"
                        y="880"
                        width="340"
                        height="38"
                        rx="14"
                        fill="#faf7f5"
                        stroke="#d4c5b9"
                        strokeWidth="1.8"
                        className="drop-shadow-xs"
                      />
                      <text
                        x="550"
                        y="904"
                        textAnchor="middle"
                        fill="#4a3c37"
                        fontSize="11"
                        fontWeight="bold"
                        letterSpacing="3"
                        className="uppercase select-none font-display"
                      >
                        ▼ MAIN ENTRANCE &amp; GARDEN PATIO ▼
                      </text>
                    </g>
                  </svg>

                  {/* Seat Hover Tooltip Overlay in Fullscreen */}
                  {hoveredSeat && (
                    <div
                      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full pb-3 animate-in fade-in zoom-in-95 duration-150"
                      style={{
                        left: `${(hoveredSeat.x / 1100) * 100}%`,
                        top: `${(hoveredSeat.y / 960) * 100}%`,
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
