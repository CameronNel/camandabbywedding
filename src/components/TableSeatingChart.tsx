import React, { useState, useMemo } from 'react';
import { Wine, Check, Users, Info, RotateCcw, Sparkles, Heart, Dices } from 'lucide-react';
import type { HouseholdInvitation } from '../types/wedding';

export interface TableConfig {
  id: number;
  name: string;
  theme: string;
  cx: number;
  cy: number;
  capacity: number;
  shape?: 'round' | 'head';
}

// Exactly 7 round tables arranged in a horseshoe curve matching user's sketch
const TABLES: TableConfig[] = [
  { id: 1, name: 'Table 1', theme: 'Protea', cx: 170, cy: 230, capacity: 8, shape: 'round' },
  { id: 2, name: 'Table 2', theme: 'Rose', cx: 150, cy: 415, capacity: 8, shape: 'round' },
  { id: 3, name: 'Table 3', theme: 'Lavender', cx: 270, cy: 565, capacity: 8, shape: 'round' },
  { id: 4, name: 'Table 4', theme: 'Fynbos', cx: 480, cy: 575, capacity: 8, shape: 'round' },
  { id: 5, name: 'Table 5', theme: 'Outeniqua', cx: 690, cy: 565, capacity: 8, shape: 'round' },
  { id: 6, name: 'Table 6', theme: 'Garden Route', cx: 810, cy: 415, capacity: 8, shape: 'round' },
  { id: 7, name: 'Table 7', theme: 'Tsitsikamma', cx: 790, cy: 230, capacity: 8, shape: 'round' },
];

interface SeatOccupant {
  householdId: string;
  householdName: string;
  guestNames: string[];
  tableId: number;
  seatNumber: number;
}

function parseSeatsFromTableNumber(
  str: string | undefined | null,
  defaultCount = 1,
): { tableId: number; seatNumbers: number[] }[] {
  if (!str || !str.trim()) return [];
  const results: { tableId: number; seatNumbers: number[] }[] = [];

  const regex = /(?:(Bridal|Head|C\s*&\s*A)\s*Table|Table\s*(\d+))\s*(?:\((?:Seats? )?([0-9,\s]+)\))?/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(str)) !== null) {
    const isHead = Boolean(match[1]);
    const tableId = isHead ? 0 : parseInt(match[2], 10);
    if (isNaN(tableId)) continue;
    let seatNumbers: number[] = [];
    if (match[3]) {
      seatNumbers = match[3]
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n));
    }
    if (seatNumbers.length === 0) {
      seatNumbers = Array.from({ length: defaultCount }, (_, i) => i + 1);
    }
    results.push({ tableId, seatNumbers });
  }

  // Fallback: if just a digit like "1" or "2"
  if (results.length === 0) {
    const num = parseInt(str.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= 7) {
      results.push({
        tableId: num,
        seatNumbers: Array.from({ length: defaultCount }, (_, i) => i + 1),
      });
    }
  }

  return results;
}

function formatSeatsToTableNumber(selectedSeatIds: string[]): string {
  if (selectedSeatIds.length === 0) return '';
  const tableMap = new Map<number, number[]>();
  for (const id of selectedSeatIds) {
    const match = id.match(/T(\d+)-S(\d+)/);
    if (match) {
      const t = parseInt(match[1], 10);
      const s = parseInt(match[2], 10);
      const current = tableMap.get(t) || [];
      current.push(s);
      tableMap.set(t, current);
    }
  }

  const parts: string[] = [];
  tableMap.forEach((seats, tableId) => {
    seats.sort((a, b) => a - b);
    const seatsStr = seats.join(', ');
    const tableName = tableId === 0 ? 'Bridal Table (C & A)' : `Table ${tableId}`;
    parts.push(`${tableName} (${seats.length === 1 ? 'Seat' : 'Seats'} ${seatsStr})`);
  });

  return parts.join(', ');
}

interface TableSeatingChartProps {
  currentHouseholdId: string;
  currentHouseholdName: string;
  attendingCount: number;
  attendingMembers: string[];
  households: HouseholdInvitation[];
  value: string;
  onChange: (newValue: string) => void;
}

export const TableSeatingChart: React.FC<TableSeatingChartProps> = ({
  currentHouseholdId,
  currentHouseholdName: _currentHouseholdName,
  attendingCount,
  attendingMembers,
  households,
  value,
  onChange,
}) => {
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(() => {
    const parsed = parseSeatsFromTableNumber(value, attendingCount);
    const ids: string[] = [];
    for (const item of parsed) {
      for (const seatNum of item.seatNumbers) {
        ids.push(`T${item.tableId}-S${seatNum}`);
      }
    }
    return ids;
  });

  const [hoveredSeat, setHoveredSeat] = useState<{
    id: string;
    tableId: number;
    tableName: string;
    seatNumber: number;
    x: number;
    y: number;
    status: 'available' | 'selected' | 'occupied' | 'bridal';
    occupantName?: string;
  } | null>(null);

  const [activeTableFilter, setActiveTableFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Build the map of occupied seats from all OTHER households
  const occupiedSeatsMap = useMemo(() => {
    const map = new Map<string, SeatOccupant>();

    // Permanently reserve C & A bridal table seats 1 & 2 for Cameron & Abby
    map.set('T0-S1', {
      householdId: 'household-cam-abby',
      householdName: 'Cameron & Abby',
      guestNames: ['Cameron Nel'],
      tableId: 0,
      seatNumber: 1,
    });
    map.set('T0-S2', {
      householdId: 'household-cam-abby',
      householdName: 'Cameron & Abby',
      guestNames: ['Abby'],
      tableId: 0,
      seatNumber: 2,
    });

    for (const h of households) {
      if (h.id === currentHouseholdId) continue;
      if (h.id === 'household-cam-abby') continue;
      if (!h.tableNumber || !h.tableNumber.trim()) continue;

      const parsed = parseSeatsFromTableNumber(h.tableNumber, h.attendingCount || 1);
      const guestNames = h.members && h.members.length > 0
        ? h.members.filter(m => m.attending !== false).map(m => m.name)
        : [h.name];

      for (const item of parsed) {
        for (const seatNum of item.seatNumbers) {
          const key = `T${item.tableId}-S${seatNum}`;
          map.set(key, {
            householdId: h.id,
            householdName: h.name,
            guestNames,
            tableId: item.tableId,
            seatNumber: seatNum,
          });
        }
      }
    }

    return map;
  }, [households, currentHouseholdId]);

  const updateSelection = (newIds: string[]) => {
    setSelectedSeatIds(newIds);
    const formatted = formatSeatsToTableNumber(newIds);
    onChange(formatted);
  };

  const handleSeatClick = (tableId: number, seatNumber: number) => {
    setAlertMessage(null);
    const seatId = `T${tableId}-S${seatNumber}`;

    // 1. Bridal Table (C & A) check: Always reserved for Cam & Abby
    if (tableId === 0) {
      setAlertMessage('The C & A table is exclusively reserved for the bride & groom, Cam and Abby! 💕');
      return;
    }

    // 2. Is this seat occupied by someone else?
    const occupied = occupiedSeatsMap.get(seatId);
    if (occupied) {
      setAlertMessage(`Seat ${seatNumber} at Table ${tableId} is already reserved by ${occupied.householdName}.`);
      return;
    }

    // 3. Is this seat already selected by the current guest?
    if (selectedSeatIds.includes(seatId)) {
      const next = selectedSeatIds.filter(id => id !== seatId);
      updateSelection(next);
      return;
    }

    // 4. Trying to select a new seat
    if (selectedSeatIds.length >= attendingCount) {
      if (attendingCount === 1) {
        updateSelection([seatId]);
      } else {
        setAlertMessage(`You have already chosen all ${attendingCount} seats for your party. Click a chosen seat to unselect it first.`);
      }
      return;
    }

    updateSelection([...selectedSeatIds, seatId]);
  };

  const handleClearSelection = () => {
    setAlertMessage(null);
    updateSelection([]);
  };

  const handlePlaceAnywhere = () => {
    setAlertMessage(null);
    const countNeeded = attendingCount > 0 ? attendingCount : 1;

    // Find all available guest seats across all 7 guest tables (exclude bridal table 0)
    const tablesWithFreeSeats: { tableId: number; freeSeatNums: number[] }[] = [];
    const allFreeSeatIds: string[] = [];

    for (const table of TABLES) {
      const freeAtTable: number[] = [];
      for (let s = 1; s <= table.capacity; s++) {
        const seatId = `T${table.id}-S${s}`;
        if (!occupiedSeatsMap.has(seatId)) {
          freeAtTable.push(s);
          allFreeSeatIds.push(seatId);
        }
      }
      if (freeAtTable.length > 0) {
        tablesWithFreeSeats.push({ tableId: table.id, freeSeatNums: freeAtTable });
      }
    }

    if (allFreeSeatIds.length < countNeeded) {
      setAlertMessage(
        allFreeSeatIds.length === 0
          ? 'All seats are currently reserved!'
          : `Only ${allFreeSeatIds.length} seat${allFreeSeatIds.length === 1 ? '' : 's'} available, but your party has ${countNeeded} guests.`
      );
      return;
    }

    // Try to seat everyone at the same table if possible
    const tablesWithEnoughSeats = tablesWithFreeSeats.filter(t => t.freeSeatNums.length >= countNeeded);

    let chosenSeatIds: string[] = [];

    if (tablesWithEnoughSeats.length > 0) {
      // Pick a random suitable table
      const randomTable = tablesWithEnoughSeats[Math.floor(Math.random() * tablesWithEnoughSeats.length)];
      const freeNums = [...randomTable.freeSeatNums];
      // Check if there are consecutive blocks
      let bestBlock: number[] = [];
      for (let i = 0; i <= freeNums.length - countNeeded; i++) {
        const candidate = freeNums.slice(i, i + countNeeded);
        const isConsecutive = candidate.every((val, idx) => idx === 0 || val === candidate[idx - 1] + 1);
        if (isConsecutive) {
          bestBlock = candidate;
          break;
        }
      }

      const seatsToTake = bestBlock.length === countNeeded ? bestBlock : freeNums.slice(0, countNeeded);
      chosenSeatIds = seatsToTake.map(s => `T${randomTable.tableId}-S${s}`);
    } else {
      // Fallback: shuffle all free seats across different tables
      const shuffled = [...allFreeSeatIds].sort(() => Math.random() - 0.5);
      chosenSeatIds = shuffled.slice(0, countNeeded);
    }

    updateSelection(chosenSeatIds);
    const tableDesc = formatSeatsToTableNumber(chosenSeatIds);
    setAlertMessage(`🎲 Randomly placed at: ${tableDesc}`);
  };

  const seatsRemaining = Math.max(0, attendingCount - selectedSeatIds.length);

  return (
    <div className="space-y-6">
      {/* Header & Instructions */}
      <div className="rounded-2xl border border-pink-100 bg-white/95 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b8697a]">
              <Sparkles className="h-4 w-4" />
              <span>Arendsrus Dining Room Seating</span>
            </div>
            <h4 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-stone-800">
              Choose Your Table &amp; Seats
            </h4>
            <p className="mt-1 text-xs text-stone-600 max-w-xl leading-relaxed">
              There are <strong>7 round tables</strong> (8 seats each) surrounding the floor, with the <strong>C &amp; A Sweetheart Table</strong> at the top center. Click on any free seat to reserve it!
            </p>
          </div>

          {/* Party Selection Status Pill */}
          <div className="flex flex-col sm:items-end justify-center shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-[#fdf7f9] px-4 py-2 text-xs font-medium text-stone-800 shadow-sm">
              <Users className="h-4 w-4 text-[#c97a8b]" />
              <span>
                Party: <strong className="text-stone-900">{attendingCount} {attendingCount === 1 ? 'Guest' : 'Guests'}</strong>
              </span>
              <span className="mx-1 text-stone-300">|</span>
              {seatsRemaining === 0 ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> All {attendingCount} chosen
                </span>
              ) : (
                <span className="font-semibold text-[#b8697a]">
                  {selectedSeatIds.length} of {attendingCount} selected ({seatsRemaining} left)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap items-center gap-4 sm:gap-6 border-t border-pink-50 pt-4 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-[#e7d8dc] bg-white font-mono text-[10px] font-bold text-stone-500 shadow-xs">
              1
            </span>
            <span>Available Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#a85065] bg-[#c97a8b] text-white shadow-xs">
              <Check className="h-3 w-3" />
            </span>
            <span className="font-semibold text-[#a85065]">Your Selection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 bg-slate-200 text-[10px] font-bold text-slate-500 shadow-xs">
              ×
            </span>
            <span>Reserved (Other Guests)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-pink-300 bg-pink-100 text-[#b8697a] shadow-xs">
              <Heart className="h-3 w-3" />
            </span>
            <span className="font-medium text-stone-700">Cam &amp; Abby (Bride &amp; Groom)</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              className="text-[11px] font-semibold text-[#b8697a] hover:underline cursor-pointer"
            >
              Switch to {viewMode === 'map' ? 'Table Cards' : 'Floor Plan Map'}
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner if any */}
      {alertMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{alertMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertMessage(null)}
            className="text-amber-700 hover:text-amber-900 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 shrink-0">Focus:</span>
        <button
          type="button"
          onClick={() => setActiveTableFilter('all')}
          className={`rounded-full px-3.5 py-1 font-medium transition cursor-pointer shrink-0 ${
            activeTableFilter === 'all'
              ? 'bg-[#c97a8b] text-white shadow-sm'
              : 'bg-white text-stone-700 border border-stone-200 hover:border-pink-200'
          }`}
        >
          All 7 Tables
        </button>
        {TABLES.map(table => {
          const isSelected = activeTableFilter === table.id;
          return (
            <button
              key={table.id}
              type="button"
              onClick={() => setActiveTableFilter(table.id)}
              className={`rounded-full px-3 py-1 font-medium transition cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#c97a8b] text-white shadow-sm'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-pink-200'
              }`}
            >
              {table.name}: {table.theme}
            </button>
          );
        })}
      </div>

      {/* VIEW MODE: INTERACTIVE FLOOR PLAN MAP */}
      {viewMode === 'map' && (
        <div className="relative overflow-hidden rounded-3xl border border-[#e8d5d9] bg-gradient-to-br from-[#faf6f7] via-[#fffdfd] to-[#f8f2f4] p-3 sm:p-6 shadow-sm">
          {/* Subtle room floor watermark */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#eedade_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

          {/* SVG Map Container */}
          <div className="relative mx-auto w-full max-w-5xl select-none">
            <svg
              viewBox="0 0 1000 700"
              className="w-full h-auto drop-shadow-xs"
              style={{ maxHeight: '720px' }}
            >
              <defs>
                <filter id="glow-rose" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <radialGradient id="table-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#fbf6f7" />
                  <stop offset="100%" stopColor="#eddce0" />
                </radialGradient>
                <linearGradient id="bar-wood" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8d6255" />
                  <stop offset="100%" stopColor="#6e473b" />
                </linearGradient>
                <linearGradient id="buffet-wood" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7a554a" />
                  <stop offset="100%" stopColor="#5d3b32" />
                </linearGradient>
                <linearGradient id="ca-table-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fdf4f7" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#fbf0f4" />
                </linearGradient>
              </defs>

              {/* ROOM BOUNDARY OUTLINE */}
              <rect
                x="18"
                y="18"
                width="964"
                height="664"
                rx="24"
                fill="none"
                stroke="#e2cbd1"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* 1. TOP-LEFT BAR (Matching sketch - clean with generous clearance, no stool circles) */}
              <g className="cursor-default">
                <rect
                  x="28"
                  y="24"
                  width="148"
                  height="56"
                  rx="10"
                  fill="url(#bar-wood)"
                  stroke="#57362c"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
                <rect
                  x="33"
                  y="29"
                  width="138"
                  height="46"
                  rx="7"
                  fill="#faf2ee"
                  stroke="#c7a79a"
                  strokeWidth="1.2"
                />
                <foreignObject x="34" y="30" width="136" height="44">
                  <div className="flex h-full flex-col items-center justify-center text-center text-[#57362c]">
                    <div className="flex items-center gap-1.5 font-display text-xs sm:text-sm font-bold tracking-wide">
                      <Wine className="h-3.5 w-3.5 text-[#8d6255]" />
                      <span>Bar</span>
                    </div>
                    <span className="text-[8.5px] uppercase font-semibold text-[#8d6255]/80 tracking-wider">
                      Drinks &amp; Refreshments
                    </span>
                  </div>
                </foreignObject>
              </g>

              {/* 2. BRIDAL TABLE: "C & A" (Top Center, Sweetheart Table with 2 Seats for Cam & Abby) */}
              <g className="cursor-default">
                {/* Romantic floral arch above table */}
                <path
                  d="M 390 42 Q 480 14, 570 42"
                  fill="none"
                  stroke="#d8bfc6"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                {/* Table Top (Pill matching "C & A" in sketch) */}
                <rect
                  x="400"
                  y="32"
                  width="160"
                  height="46"
                  rx="23"
                  fill="url(#ca-table-grad)"
                  stroke="#c97a8b"
                  strokeWidth="2.5"
                  className="drop-shadow-sm"
                />
                {/* "C & A" Lettering (Matching user's sketch) */}
                <text
                  x="480"
                  y="61"
                  textAnchor="middle"
                  fill="#9e475a"
                  fontSize="20"
                  fontWeight="bold"
                  className="font-display tracking-widest select-none"
                >
                  C &amp; A
                </text>

                {/* Cam's Seat (Seat 1) */}
                <g
                  className="cursor-pointer"
                  onClick={() => handleSeatClick(0, 1)}
                  onMouseEnter={() =>
                    setHoveredSeat({
                      id: 'T0-S1',
                      tableId: 0,
                      tableName: 'C & A Sweetheart Table',
                      seatNumber: 1,
                      x: 450,
                      y: 100,
                      status: 'bridal',
                      occupantName: 'Cameron Nel (Groom)',
                    })
                  }
                  onMouseLeave={() => setHoveredSeat(null)}
                >
                  <circle cx="450" cy="100" r="13" fill="#c97a8b" stroke="#9e475a" strokeWidth="2" />
                  <text
                    x="450"
                    y="104"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    className="font-display select-none"
                  >
                    C
                  </text>
                </g>

                {/* Abby's Seat (Seat 2) */}
                <g
                  className="cursor-pointer"
                  onClick={() => handleSeatClick(0, 2)}
                  onMouseEnter={() =>
                    setHoveredSeat({
                      id: 'T0-S2',
                      tableId: 0,
                      tableName: 'C & A Sweetheart Table',
                      seatNumber: 2,
                      x: 510,
                      y: 100,
                      status: 'bridal',
                      occupantName: 'Abby (Bride)',
                    })
                  }
                  onMouseLeave={() => setHoveredSeat(null)}
                >
                  <circle cx="510" cy="100" r="13" fill="#c97a8b" stroke="#9e475a" strokeWidth="2" />
                  <text
                    x="510"
                    y="104"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    className="font-display select-none"
                  >
                    A
                  </text>
                </g>
                <text
                  x="480"
                  y="122"
                  textAnchor="middle"
                  fill="#b8697a"
                  fontSize="9"
                  fontWeight="600"
                  className="select-none tracking-wide"
                >
                  Cam &amp; Abby 💕
                </text>
              </g>

              {/* 3. RIGHT WALL: FOOD BUFFET (Matching sketch - well-spaced platters with clear space for label) */}
              <g className="cursor-default">
                <rect
                  x="925"
                  y="26"
                  width="48"
                  height="605"
                  rx="12"
                  fill="url(#buffet-wood)"
                  stroke="#4e3128"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
                <rect
                  x="930"
                  y="31"
                  width="38"
                  height="595"
                  rx="8"
                  fill="#faf2ee"
                  stroke="#cfb0a3"
                  strokeWidth="1.2"
                />
                {/* Buffet platter motifs top */}
                <ellipse cx="949" cy="90" rx="11" ry="20" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.2" />
                <ellipse cx="949" cy="165" rx="11" ry="20" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.2" />

                {/* Decorative separator line above FOOD label */}
                <line x1="937" y1="230" x2="961" y2="230" stroke="#cfb0a3" strokeWidth="1.2" strokeDasharray="3 2" />

                {/* Vertical Food Label - completely clear dedicated zone, zero overlap */}
                <text
                  x="949"
                  y="328"
                  fill="#5d3b32"
                  fontSize="16"
                  fontWeight="bold"
                  letterSpacing="6"
                  textAnchor="middle"
                  transform="rotate(90, 949, 328)"
                  className="font-display select-none uppercase"
                >
                  FOOD
                </text>

                {/* Decorative separator line below FOOD label */}
                <line x1="937" y1="426" x2="961" y2="426" stroke="#cfb0a3" strokeWidth="1.2" strokeDasharray="3 2" />

                {/* Buffet platter motifs bottom */}
                <ellipse cx="949" cy="490" rx="11" ry="20" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.2" />
                <ellipse cx="949" cy="565" rx="11" ry="20" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.2" />
              </g>

              {/* 4. DANCE FLOOR (In the middle of the horseshoe) */}
              <g opacity="0.35" pointerEvents="none">
                <ellipse
                  cx="480"
                  cy="335"
                  rx="100"
                  ry="65"
                  fill="none"
                  stroke="#c97a8b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x="480"
                  y="330"
                  textAnchor="middle"
                  fill="#b8697a"
                  fontSize="11"
                  fontWeight="bold"
                  letterSpacing="3"
                  className="font-display select-none uppercase"
                >
                  DANCE FLOOR
                </text>
                <Heart className="h-4 w-4 text-[#c97a8b]" x="472" y="342" />
              </g>

              {/* 5. SEVEN ROUND BANQUET TABLES (Arranged in U-shape horseshoe from sketch) */}
              {TABLES.map(table => {
                const isFiltered = activeTableFilter !== 'all' && activeTableFilter !== table.id;
                const radiusOrbit = 62;
                const tableRadius = 39;
                const seatRadius = 13;

                const occupiedAtTable = Array.from({ length: table.capacity }).filter((_, i) =>
                  occupiedSeatsMap.has(`T${table.id}-S${i + 1}`),
                ).length;
                const selectedAtTable = Array.from({ length: table.capacity }).filter((_, i) =>
                  selectedSeatIds.includes(`T${table.id}-S${i + 1}`),
                ).length;

                return (
                  <g
                    key={table.id}
                    opacity={isFiltered ? 0.35 : 1}
                    className="transition-opacity duration-300"
                  >
                    {/* Table Surface */}
                    <circle
                      cx={table.cx}
                      cy={table.cy}
                      r={tableRadius}
                      fill="url(#table-grad)"
                      stroke="#bca1a8"
                      strokeWidth="1.5"
                      className="drop-shadow-xs"
                    />

                    {/* Floral Inner Ring */}
                    <circle
                      cx={table.cx}
                      cy={table.cy}
                      r={tableRadius - 14}
                      fill="none"
                      stroke="#eedee2"
                      strokeWidth="1.2"
                      strokeDasharray="3 2"
                    />

                    {/* Table Label */}
                    <text
                      x={table.cx}
                      y={table.cy - 7}
                      textAnchor="middle"
                      fill="#3d2c31"
                      fontSize="12"
                      fontWeight="bold"
                      className="font-display select-none"
                    >
                      {table.name}
                    </text>
                    <text
                      x={table.cx}
                      y={table.cy + 6}
                      textAnchor="middle"
                      fill="#b8697a"
                      fontSize="9"
                      fontWeight="600"
                      className="select-none tracking-wide"
                    >
                      {table.theme}
                    </text>
                    <text
                      x={table.cx}
                      y={table.cy + 19}
                      textAnchor="middle"
                      fill="#786469"
                      fontSize="8"
                      fontWeight="500"
                      className="select-none"
                    >
                      {occupiedAtTable + selectedAtTable}/{table.capacity}
                    </text>

                    {/* 8 SEATS AROUND EACH TABLE (at 45 degree intervals) */}
                    {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                      const seatNum = seatIdx + 1;
                      const seatId = `T${table.id}-S${seatNum}`;
                      const angle = (seatIdx * 45 - 90) * (Math.PI / 180);
                      const sx = table.cx + radiusOrbit * Math.cos(angle);
                      const sy = table.cy + radiusOrbit * Math.sin(angle);

                      const isOccupied = occupiedSeatsMap.has(seatId);
                      const occupant = occupiedSeatsMap.get(seatId);
                      const isSelected = selectedSeatIds.includes(seatId);

                      const selectedIndex = selectedSeatIds.indexOf(seatId);
                      const assignedMemberName = isSelected
                        ? attendingMembers[selectedIndex] || `Guest ${selectedIndex + 1}`
                        : undefined;

                      return (
                        <g
                          key={seatId}
                          className="group cursor-pointer transition-transform duration-150"
                          onClick={() => handleSeatClick(table.id, seatNum)}
                          onMouseEnter={() =>
                            setHoveredSeat({
                              id: seatId,
                              tableId: table.id,
                              tableName: table.name,
                              seatNumber: seatNum,
                              x: sx,
                              y: sy,
                              status: isSelected ? 'selected' : isOccupied ? 'occupied' : 'available',
                              occupantName: isSelected
                                ? assignedMemberName
                                : isOccupied
                                  ? occupant?.householdName
                                  : undefined,
                            })
                          }
                          onMouseLeave={() => setHoveredSeat(null)}
                        >
                          <circle cx={sx} cy={sy} r={seatRadius + 7} fill="transparent" />

                          {isSelected ? (
                            <g filter="url(#glow-rose)">
                              <circle
                                cx={sx}
                                cy={sy}
                                r={seatRadius}
                                fill="#c97a8b"
                                stroke="#9e475a"
                                strokeWidth="2.5"
                              />
                              <Check
                                className="h-3 w-3 text-white pointer-events-none"
                                x={sx - 6}
                                y={sy - 6}
                              />
                            </g>
                          ) : isOccupied ? (
                            <g>
                              <circle
                                cx={sx}
                                cy={sy}
                                r={seatRadius}
                                fill="#e2e8f0"
                                stroke="#cbd5e1"
                                strokeWidth="1.5"
                              />
                              <text
                                x={sx}
                                y={sy + 3.5}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize="9"
                                fontWeight="bold"
                                className="select-none pointer-events-none font-mono"
                              >
                                ×
                              </text>
                            </g>
                          ) : (
                            <g>
                              <circle
                                cx={sx}
                                cy={sy}
                                r={seatRadius}
                                fill="#ffffff"
                                stroke="#dfcbd0"
                                strokeWidth="2"
                                className="group-hover:fill-[#fcebf0] group-hover:stroke-[#c97a8b] transition-colors"
                              />
                              <text
                                x={sx}
                                y={sy + 3.5}
                                textAnchor="middle"
                                fill="#8a6f75"
                                fontSize="9"
                                fontWeight="600"
                                className="select-none pointer-events-none font-mono group-hover:fill-[#b8697a]"
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

              {/* ENTRANCE INDICATION */}
              <g opacity="0.6">
                <text
                  x="480"
                  y="684"
                  textAnchor="middle"
                  fill="#786469"
                  fontSize="10"
                  fontWeight="bold"
                  letterSpacing="3"
                  className="uppercase select-none font-display"
                >
                  ▼ MAIN ENTRANCE &amp; GARDEN PATIO ▼
                </text>
              </g>
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredSeat && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full pb-3 animate-in fade-in zoom-in-95 duration-150"
                style={{
                  left: `${(hoveredSeat.x / 1000) * 100}%`,
                  top: `${(hoveredSeat.y / 700) * 100}%`,
                }}
              >
                <div className="rounded-xl border border-stone-200/80 bg-stone-900/90 backdrop-blur-md px-3 py-2 text-center text-white shadow-xl min-w-[150px]">
                  <p className="text-[11px] font-bold text-pink-200">
                    {hoveredSeat.tableName} • Seat {hoveredSeat.seatNumber}
                  </p>
                  {hoveredSeat.status === 'bridal' ? (
                    <div className="mt-0.5">
                      <p className="text-xs font-semibold text-pink-300 flex items-center justify-center gap-1">
                        <Heart className="h-3 w-3 text-pink-400" />
                        {hoveredSeat.occupantName}
                      </p>
                      <p className="text-[9px] text-stone-300">Bride &amp; Groom Table</p>
                    </div>
                  ) : hoveredSeat.status === 'selected' ? (
                    <div className="mt-0.5">
                      <p className="text-xs font-semibold text-white flex items-center justify-center gap-1">
                        <Check className="h-3 w-3 text-pink-400" />
                        {hoveredSeat.occupantName || 'Your Party'}
                      </p>
                      <p className="text-[9px] text-stone-300">Click to unselect</p>
                    </div>
                  ) : hoveredSeat.status === 'occupied' ? (
                    <div className="mt-0.5">
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider">Reserved by</p>
                      <p className="text-xs font-semibold text-amber-200">
                        {hoveredSeat.occupantName}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-0.5">
                      <p className="text-xs font-medium text-emerald-300">Available</p>
                      <p className="text-[9px] text-stone-300">Click to choose seat</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE: TABLE CARDS (Alternate list view for mobile screens) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* C & A Bridal Card */}
          <div className="rounded-2xl border-2 border-pink-200 bg-gradient-to-r from-pink-50/70 via-white to-pink-50/70 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-[#c97a8b]" />
                <div>
                  <h5 className="font-display text-base font-bold text-stone-800">
                    C &amp; A Sweetheart Table
                  </h5>
                  <p className="text-[11px] text-stone-500">2 seats • Cam &amp; Abby</p>
                </div>
              </div>
              <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-[#b8697a]">
                Bride &amp; Groom
              </span>
            </div>
            <div className="mt-3 flex gap-3">
              <div className="flex-1 rounded-xl border border-pink-300 bg-pink-100/60 p-2.5 text-center">
                <p className="text-xs font-bold text-[#b8697a]">Cam (Groom)</p>
                <p className="text-[10px] text-stone-600">Reserved</p>
              </div>
              <div className="flex-1 rounded-xl border border-pink-300 bg-pink-100/60 p-2.5 text-center">
                <p className="text-xs font-bold text-[#b8697a]">Abby (Bride)</p>
                <p className="text-[10px] text-stone-600">Reserved</p>
              </div>
            </div>
          </div>

          {/* 7 Round Guest Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TABLES.map(table => {
              return (
                <div
                  key={table.id}
                  className="rounded-2xl border border-pink-100 bg-white p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                    <div>
                      <h5 className="font-display text-base font-bold text-stone-800">
                        {table.name}: {table.theme}
                      </h5>
                      <p className="text-[11px] text-stone-500">8 banquet seats</p>
                    </div>
                    <span className="rounded-full bg-[#fdf2f4] px-2.5 py-1 text-[10px] font-bold text-[#b8697a]">
                      Round Table
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                      const seatNum = seatIdx + 1;
                      const seatId = `T${table.id}-S${seatNum}`;
                      const isOccupied = occupiedSeatsMap.has(seatId);
                      const occupant = occupiedSeatsMap.get(seatId);
                      const isSelected = selectedSeatIds.includes(seatId);

                      return (
                        <button
                          key={seatId}
                          type="button"
                          onClick={() => handleSeatClick(table.id, seatNum)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition cursor-pointer ${
                            isSelected
                              ? 'border-[#a85065] bg-[#c97a8b] text-white shadow-xs'
                              : isOccupied
                                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'border-stone-200 bg-stone-50 hover:bg-pink-50 hover:border-pink-300 text-stone-700'
                          }`}
                        >
                          <span className="text-xs font-bold">Seat {seatNum}</span>
                          <span className="text-[9px] mt-0.5 truncate max-w-full">
                            {isSelected ? 'Yours' : isOccupied ? occupant?.householdName : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SELECTED SEATS LIVE SUMMARY & CONTROLS */}
      <div className="rounded-2xl border border-pink-200/90 bg-gradient-to-br from-[#ffffff] via-[#fffcfd] to-[#faf3f5] p-5 sm:p-6 shadow-sm">
        {/* Header with Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-100/80 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#b8697a]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Your Table &amp; Seat Assignment</span>
            </div>
            {selectedSeatIds.length > 0 ? (
              <h5 className="mt-1 font-display text-lg sm:text-xl font-bold text-stone-800">
                {formatSeatsToTableNumber(selectedSeatIds)}
              </h5>
            ) : (
              <h5 className="mt-1 font-display text-base font-semibold text-stone-600">
                No seats selected yet ({attendingCount} {attendingCount === 1 ? 'seat' : 'seats'} needed)
              </h5>
            )}
          </div>

          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold shadow-2xs ${
                selectedSeatIds.length === attendingCount
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-pink-50 text-[#b8697a] border border-pink-200'
              }`}
            >
              {selectedSeatIds.length === attendingCount ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  All {attendingCount} seats chosen
                </>
              ) : (
                <>
                  {selectedSeatIds.length} of {attendingCount} selected
                </>
              )}
            </span>
          </div>
        </div>

        {/* Selected Seats Cards / Empty State */}
        <div className="py-4">
          {selectedSeatIds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {selectedSeatIds.map((seatId, idx) => {
                const match = seatId.match(/T(\d+)-S(\d+)/);
                const t = match ? parseInt(match[1], 10) : 0;
                const s = match ? match[2] : '';
                const tableObj = TABLES.find(tbl => tbl.id === t);
                const tableName = t === 0 ? 'C & A Sweetheart Table' : `Table ${t} (${tableObj?.theme || 'Banquet'})`;
                const memberName = attendingMembers[idx] || (idx === 0 ? 'Primary Guest' : `Guest ${idx + 1}`);

                return (
                  <div
                    key={seatId}
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-pink-100 bg-white/95 px-3.5 py-2.5 shadow-2xs hover:border-pink-200 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fdf2f4] border border-pink-200 text-xs font-bold text-[#b8697a]">
                        {s}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">{memberName}</p>
                        <p className="text-[11px] text-stone-500 truncate">{tableName}, Seat {s}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const matchNum = seatId.match(/T(\d+)-S(\d+)/);
                        if (matchNum) handleSeatClick(parseInt(matchNum[1], 10), parseInt(matchNum[2], 10));
                      }}
                      className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                      title={`Remove seat for ${memberName}`}
                      aria-label={`Remove seat for ${memberName}`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-pink-200/80 bg-white/60 p-4 text-xs text-stone-500">
              <Users className="h-5 w-5 text-pink-300 shrink-0" />
              <div>
                <p className="font-semibold text-stone-700">Choose your seats above or let us place you</p>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  Click on any open circle on the floor plan, or click "Place me anywhere" below to receive a random seat.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar: Clear on Bottom Left, Place me anywhere on Bottom Right */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pink-100/80 pt-4">
          {/* Bottom Left: Clear option */}
          <div>
            {selectedSeatIds.length > 0 ? (
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 hover:text-red-600 hover:border-red-200 transition shadow-2xs cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-stone-400" />
                <span>Clear</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/60 bg-stone-50/60 px-3.5 py-2 text-xs font-medium text-stone-400 cursor-not-allowed opacity-60"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Bottom Right: Place me anywhere */}
          <button
            type="button"
            onClick={handlePlaceAnywhere}
            className="inline-flex items-center gap-2 rounded-xl border border-pink-300 bg-gradient-to-r from-[#d48b99] to-[#b8697a] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:from-[#c97a8b] hover:to-[#a75869] active:scale-[0.99] transition cursor-pointer"
          >
            <Dices className="h-3.5 w-3.5 text-pink-100" />
            <span>{attendingCount > 1 ? 'Place us anywhere' : 'Place me anywhere'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
