import React, { useState, useMemo } from 'react';
import { Wine, Check, Users, Info, RotateCcw, Sparkles, Heart } from 'lucide-react';
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

const TABLES: TableConfig[] = [
  // 1. Bridal Table (Head Table under the draped curtains and fairy lights)
  { id: 0, name: 'Bridal Table', theme: 'Abby & Cam', cx: 500, cy: 80, capacity: 6, shape: 'head' },
  // 2. Eight Round Tables (8 chairs each, matching the Arendsrus Barnyard photo)
  { id: 1, name: 'Table 1', theme: 'Protea', cx: 230, cy: 550, capacity: 8, shape: 'round' },
  { id: 2, name: 'Table 2', theme: 'Rose', cx: 500, cy: 535, capacity: 8, shape: 'round' },
  { id: 3, name: 'Table 3', theme: 'Lavender', cx: 770, cy: 500, capacity: 8, shape: 'round' },
  { id: 4, name: 'Table 4', theme: 'Fynbos', cx: 175, cy: 365, capacity: 8, shape: 'round' },
  { id: 5, name: 'Table 5', theme: 'Outeniqua', cx: 760, cy: 295, capacity: 8, shape: 'round' },
  { id: 6, name: 'Table 6', theme: 'Garden Route', cx: 325, cy: 215, capacity: 8, shape: 'round' },
  { id: 7, name: 'Table 7', theme: 'Tsitsikamma', cx: 150, cy: 145, capacity: 8, shape: 'round' },
  { id: 8, name: 'Table 8', theme: 'Geelhoutboom', cx: 840, cy: 140, capacity: 8, shape: 'round' },
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

  // Match "Bridal Table (Seats 1, 2)" or "Head Table" or "Table X (Seats 1, 2)"
  const regex = /(?:(Bridal|Head)\s*Table|Table\s*(\d+))\s*(?:\((?:Seats? )?([0-9,\s]+)\))?/gi;
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
    if (!isNaN(num) && num >= 0 && num <= 8) {
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
    const tableName = tableId === 0 ? 'Bridal Table' : `Table ${tableId}`;
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
    status: 'available' | 'selected' | 'occupied';
    occupantName?: string;
  } | null>(null);

  const [activeTableFilter, setActiveTableFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Build the map of occupied seats from all OTHER households
  const occupiedSeatsMap = useMemo(() => {
    const map = new Map<string, SeatOccupant>();

    for (const h of households) {
      if (h.id === currentHouseholdId) continue;
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

    // 1. Is this seat occupied by someone else?
    const occupied = occupiedSeatsMap.get(seatId);
    if (occupied) {
      const tableName = tableId === 0 ? 'Bridal Table' : `Table ${tableId}`;
      setAlertMessage(`Seat ${seatNumber} at ${tableName} is already reserved by ${occupied.householdName}.`);
      return;
    }

    // 2. Is this seat already selected by the current guest?
    if (selectedSeatIds.includes(seatId)) {
      const next = selectedSeatIds.filter(id => id !== seatId);
      updateSelection(next);
      return;
    }

    // 3. Trying to select a new seat
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

  const handleLetCoupleAssign = () => {
    setAlertMessage(null);
    updateSelection([]);
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
              <span>Arendsrus Barnyard Seating Chart</span>
            </div>
            <h4 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-stone-800">
              Pick Your Table &amp; Seats
            </h4>
            <p className="mt-1 text-xs text-stone-600 max-w-xl leading-relaxed">
              Based on the Arendsrus reception dining hall, each round table seats <strong>8 guests</strong> with white chair covers, plus the <strong>Bridal Table</strong> at the head of the room. Click on any free seat to reserve it!
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
          All Tables
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
                <linearGradient id="head-table-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f7eef1" />
                </linearGradient>
              </defs>

              {/* ROOM OUTLINE */}
              <rect
                x="15"
                y="15"
                width="970"
                height="670"
                rx="24"
                fill="none"
                stroke="#e2cbd1"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* CEILING DRAPES & FAIRY LIGHTS BACKDROP (matching Arendsrus Barnyard photo) */}
              <g opacity="0.8">
                {/* Flowing white drapes across the top wall */}
                <path
                  d="M 20 20 Q 250 48, 500 24 Q 750 48, 980 20 L 980 40 Q 750 62, 500 38 Q 250 62, 20 40 Z"
                  fill="#ffffff"
                  stroke="#eddce2"
                  strokeWidth="1.5"
                />
                {/* Fairy lights dots */}
                {[50, 110, 170, 230, 290, 350, 410, 470, 530, 590, 650, 710, 770, 830, 890, 950].map((lx, idx) => (
                  <circle
                    key={idx}
                    cx={lx}
                    cy={30 + Math.sin(idx) * 6}
                    r="2.5"
                    fill="#fef08a"
                    stroke="#f59e0b"
                    strokeWidth="0.8"
                    className="animate-pulse"
                  />
                ))}
              </g>

              {/* 1. TOP-LEFT BAR (matching sketch) */}
              <g className="cursor-default">
                <rect
                  x="28"
                  y="24"
                  width="110"
                  height="65"
                  rx="12"
                  fill="url(#bar-wood)"
                  stroke="#57362c"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
                <rect
                  x="34"
                  y="30"
                  width="98"
                  height="53"
                  rx="8"
                  fill="#faf2ee"
                  stroke="#c7a79a"
                  strokeWidth="1.2"
                />
                <circle cx="50" cy="100" r="7" fill="#edd6ce" stroke="#8d6255" strokeWidth="1.2" />
                <circle cx="83" cy="100" r="7" fill="#edd6ce" stroke="#8d6255" strokeWidth="1.2" />
                <circle cx="116" cy="100" r="7" fill="#edd6ce" stroke="#8d6255" strokeWidth="1.2" />
                <foreignObject x="35" y="32" width="96" height="49">
                  <div className="flex h-full flex-col items-center justify-center text-center text-[#57362c]">
                    <div className="flex items-center gap-1 font-display text-xs font-bold">
                      <Wine className="h-3.5 w-3.5 text-[#8d6255]" />
                      <span>BAR</span>
                    </div>
                    <span className="text-[8px] uppercase font-semibold text-[#8d6255]/80 tracking-wider">
                      Drinks &amp; Wine
                    </span>
                  </div>
                </foreignObject>
              </g>

              {/* 2. FOOD BUFFET STATION (right wall, matching sketch & photo warmer) */}
              <g className="cursor-default">
                <rect
                  x="932"
                  y="200"
                  width="48"
                  height="340"
                  rx="12"
                  fill="url(#buffet-wood)"
                  stroke="#4e3128"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
                <rect
                  x="937"
                  y="206"
                  width="38"
                  height="328"
                  rx="7"
                  fill="#faf3ee"
                  stroke="#cfb0a3"
                  strokeWidth="1.2"
                />
                <ellipse cx="956" cy="245" rx="10" ry="16" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.2" />
                <ellipse cx="956" cy="315" rx="10" ry="16" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.2" />
                <ellipse cx="956" cy="385" rx="10" ry="16" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.2" />
                <ellipse cx="956" cy="455" rx="10" ry="16" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.2" />
                <text
                  x="956"
                  y="370"
                  fill="#5d3b32"
                  fontSize="12"
                  fontWeight="bold"
                  letterSpacing="4"
                  textAnchor="middle"
                  transform="rotate(90, 956, 370)"
                  className="font-display select-none uppercase"
                >
                  BUFFET STATION
                </text>
              </g>

              {/* 3. DANCE FLOOR (center of the barn, matching photo) */}
              <g opacity="0.35" pointerEvents="none">
                <ellipse
                  cx="500"
                  cy="325"
                  rx="95"
                  ry="65"
                  fill="none"
                  stroke="#c97a8b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x="500"
                  y="320"
                  textAnchor="middle"
                  fill="#b8697a"
                  fontSize="11"
                  fontWeight="bold"
                  letterSpacing="3"
                  className="font-display select-none uppercase"
                >
                  DANCE FLOOR
                </text>
                <Heart className="h-4 w-4 text-[#c97a8b]" x="492" y="332" />
              </g>

              {/* RENDER ALL TABLES (BRIDAL TABLE + 8 ROUND BANQUET TABLES) */}
              {TABLES.map(table => {
                const isFiltered = activeTableFilter !== 'all' && activeTableFilter !== table.id;
                const seatRadius = 14;

                // Handle Bridal Table (Head Table)
                if (table.shape === 'head') {
                  const tableW = 180;
                  const tableH = 42;
                  const startX = table.cx - tableW / 2;
                  const startY = table.cy - tableH / 2;

                  return (
                    <g
                      key={table.id}
                      opacity={isFiltered ? 0.35 : 1}
                      className="transition-opacity duration-300"
                    >
                      {/* Rectangular Table Top */}
                      <rect
                        x={startX}
                        y={startY}
                        width={tableW}
                        height={tableH}
                        rx="10"
                        fill="url(#head-table-grad)"
                        stroke="#bca1a8"
                        strokeWidth="2"
                        className="drop-shadow-sm"
                      />
                      {/* Greenery / Floral Garland Motif on Bridal Table */}
                      <path
                        d={`M ${startX + 12} ${startY + 21} Q ${table.cx} ${startY + 29}, ${startX + tableW - 12} ${startY + 21}`}
                        fill="none"
                        stroke="#7d997b"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={table.cx}
                        y={startY + 16}
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
                        y={startY + 32}
                        textAnchor="middle"
                        fill="#b8697a"
                        fontSize="9"
                        fontWeight="600"
                        className="select-none tracking-wide"
                      >
                        Abby &amp; Cameron
                      </text>

                      {/* 6 Seats in a row below the Head Table */}
                      {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                        const seatNum = seatIdx + 1;
                        const seatId = `T${table.id}-S${seatNum}`;
                        const sx = startX + 18 + seatIdx * 28.8;
                        const sy = startY + tableH + 18;

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
                }

                // Standard 8-Seater Round Tables
                const radiusOrbit = 68;
                const tableRadius = 42;

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
                      fontSize="11"
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

                    {/* 8 SEATS AROUND THE ROUND TABLE (at 45 degree intervals) */}
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
                  x="500"
                  y="675"
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
                <div className="rounded-xl border border-stone-200/80 bg-stone-900/90 backdrop-blur-md px-3 py-2 text-center text-white shadow-xl min-w-[140px]">
                  <p className="text-[11px] font-bold text-pink-200">
                    {hoveredSeat.tableName} • Seat {hoveredSeat.seatNumber}
                  </p>
                  {hoveredSeat.status === 'selected' ? (
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

      {/* VIEW MODE: TABLE CARDS (Alternate list view for narrow mobile screens) */}
      {viewMode === 'list' && (
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
                    <p className="text-[11px] text-stone-500">{table.capacity} banquet seats</p>
                  </div>
                  <span className="rounded-full bg-[#fdf2f4] px-2.5 py-1 text-[10px] font-bold text-[#b8697a]">
                    {table.shape === 'head' ? 'Head Table' : 'Round Table'}
                  </span>
                </div>

                <div className={`mt-4 grid ${table.capacity === 6 ? 'grid-cols-3' : 'grid-cols-4'} gap-2`}>
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
      )}

      {/* SELECTED SEATS LIVE SUMMARY & CONTROLS */}
      <div className="rounded-2xl border border-pink-200/80 bg-gradient-to-br from-[#fffdfd] to-[#fbf5f7] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#b8697a]">
              Your Table &amp; Seat Assignment
            </p>
            {selectedSeatIds.length > 0 ? (
              <div className="mt-1">
                <p className="text-base font-bold text-stone-800">
                  {formatSeatsToTableNumber(selectedSeatIds)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSeatIds.map((seatId, idx) => {
                    const match = seatId.match(/T(\d+)-S(\d+)/);
                    const t = match ? parseInt(match[1], 10) : 0;
                    const s = match ? match[2] : '';
                    const tableName = t === 0 ? 'Bridal Table' : `Table ${t}`;
                    const memberName = attendingMembers[idx] || `Guest ${idx + 1}`;

                    return (
                      <span
                        key={seatId}
                        className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-white px-3 py-1 text-xs font-medium text-stone-800 shadow-2xs"
                      >
                        <span className="h-2 w-2 rounded-full bg-[#c97a8b]" />
                        <strong>{memberName}:</strong> {tableName}, Seat {s}
                        <button
                          type="button"
                          onClick={() => {
                            const matchNum = seatId.match(/T(\d+)-S(\d+)/);
                            if (matchNum) handleSeatClick(parseInt(matchNum[1], 10), parseInt(matchNum[2], 10));
                          }}
                          className="ml-1 text-stone-400 hover:text-red-500 font-bold px-0.5 cursor-pointer"
                          title="Remove seat"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-stone-500">
                No seats selected yet. Click any available seat above to assign your party.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedSeatIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-stone-400" />
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={handleLetCoupleAssign}
              className="inline-flex items-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50/70 px-3 py-1.5 text-xs font-semibold text-[#b8697a] hover:bg-pink-100 transition cursor-pointer"
            >
              <Heart className="h-3.5 w-3.5 text-[#c97a8b]" />
              Let Abby &amp; Cam place us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
