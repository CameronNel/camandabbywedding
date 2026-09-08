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
}

const TABLES: TableConfig[] = [
  { id: 1, name: 'Table 1', theme: 'Protea', cx: 310, cy: 190, capacity: 10 },
  { id: 2, name: 'Table 2', theme: 'Rose', cx: 280, cy: 440, capacity: 10 },
  { id: 3, name: 'Table 3', theme: 'Lavender', cx: 640, cy: 190, capacity: 10 },
  { id: 4, name: 'Table 4', theme: 'Fynbos', cx: 570, cy: 440, capacity: 10 },
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

  const regex = /Table\s*(\d+)\s*(?:\((?:Seats? )?([0-9,\s]+)\))?/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(str)) !== null) {
    const tableId = parseInt(match[1], 10);
    if (isNaN(tableId)) continue;
    let seatNumbers: number[] = [];
    if (match[2]) {
      seatNumbers = match[2]
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
    if (!isNaN(num) && num >= 1 && num <= 4) {
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
    parts.push(`Table ${tableId} (${seats.length === 1 ? 'Seat' : 'Seats'} ${seatsStr})`);
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

  // Keep parent value in sync whenever selectedSeatIds change
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
      setAlertMessage(`Seat ${seatNumber} at Table ${tableId} is already reserved by ${occupied.householdName}.`);
      return;
    }

    // 2. Is this seat already selected by the current guest?
    if (selectedSeatIds.includes(seatId)) {
      // Deselect it
      const next = selectedSeatIds.filter(id => id !== seatId);
      updateSelection(next);
      return;
    }

    // 3. Trying to select a new seat
    if (selectedSeatIds.length >= attendingCount) {
      if (attendingCount === 1) {
        // For single guest, convenience: replace selection directly
        updateSelection([seatId]);
      } else {
        setAlertMessage(`You have already chosen all ${attendingCount} seats for your party. Click a chosen seat to unselect it first.`);
      }
      return;
    }

    // Add to selection
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
              <span>Reception Dining Hall Seating</span>
            </div>
            <h4 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-stone-800">
              Pick Your Table &amp; Seats
            </h4>
            <p className="mt-1 text-xs text-stone-600 max-w-xl leading-relaxed">
              Click on the floor plan below to choose your seats — just like booking theater seats! You can see where other guests are seated so you can sit with your friends and family.
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
          <div className="relative mx-auto w-full max-w-4xl select-none">
            <svg
              viewBox="0 0 920 620"
              className="w-full h-auto drop-shadow-xs"
              style={{ maxHeight: '680px' }}
            >
              <defs>
                {/* Glow filter for selected seats */}
                <filter id="glow-rose" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Linear gradient for table tops */}
                <radialGradient id="table-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#fbf6f7" />
                  <stop offset="100%" stopColor="#eddce0" />
                </radialGradient>
                {/* Bar wood texture gradient */}
                <linearGradient id="bar-wood" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8d6255" />
                  <stop offset="100%" stopColor="#6e473b" />
                </linearGradient>
                {/* Buffet warm gradient */}
                <linearGradient id="buffet-wood" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7a554a" />
                  <stop offset="100%" stopColor="#5d3b32" />
                </linearGradient>
              </defs>

              {/* ROOM OUTLINE & BOUNDARY */}
              <rect
                x="15"
                y="15"
                width="890"
                height="590"
                rx="28"
                fill="none"
                stroke="#e2cbd1"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />

              {/* 1. TOP-LEFT BAR (Matching sketch) */}
              <g className="cursor-default">
                <rect
                  x="32"
                  y="32"
                  width="180"
                  height="100"
                  rx="16"
                  fill="url(#bar-wood)"
                  stroke="#57362c"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
                <rect
                  x="40"
                  y="40"
                  width="164"
                  height="84"
                  rx="10"
                  fill="#faf2ee"
                  stroke="#c7a79a"
                  strokeWidth="1.5"
                />
                {/* Bar stools */}
                <circle cx="65" cy="148" r="10" fill="#edd6ce" stroke="#8d6255" strokeWidth="1.5" />
                <circle cx="115" cy="148" r="10" fill="#edd6ce" stroke="#8d6255" strokeWidth="1.5" />
                <circle cx="165" cy="148" r="10" fill="#edd6ce" stroke="#8d6255" strokeWidth="1.5" />
                <foreignObject x="45" y="50" width="154" height="65">
                  <div className="flex h-full flex-col items-center justify-center text-center text-[#57362c]">
                    <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-wide">
                      <Wine className="h-4 w-4 text-[#8d6255]" />
                      <span>BAR</span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-[#8d6255]/80 tracking-wider">
                      Drinks &amp; Refreshments
                    </span>
                  </div>
                </foreignObject>
              </g>

              {/* 2. RIGHT-SIDE FOOD BUFFET STATION (Matching sketch) */}
              <g className="cursor-default">
                <rect
                  x="830"
                  y="80"
                  width="65"
                  height="460"
                  rx="14"
                  fill="url(#buffet-wood)"
                  stroke="#4e3128"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
                <rect
                  x="837"
                  y="88"
                  width="51"
                  height="444"
                  rx="8"
                  fill="#faf3ee"
                  stroke="#cfb0a3"
                  strokeWidth="1.5"
                />
                {/* Platter marks */}
                <ellipse cx="862" cy="130" rx="14" ry="20" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.5" />
                <ellipse cx="862" cy="220" rx="14" ry="20" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.5" />
                <ellipse cx="862" cy="310" rx="14" ry="20" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.5" />
                <ellipse cx="862" cy="400" rx="14" ry="20" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.5" />
                <ellipse cx="862" cy="490" rx="14" ry="20" fill="#eed9ce" stroke="#9e7263" strokeWidth="1.5" />
                <text
                  x="862"
                  y="310"
                  fill="#5d3b32"
                  fontSize="15"
                  fontWeight="bold"
                  letterSpacing="5"
                  textAnchor="middle"
                  transform="rotate(90, 862, 310)"
                  className="font-display select-none uppercase"
                >
                  FOOD BUFFET
                </text>
              </g>

              {/* 3. DANCE FLOOR / CENTER COURTESY MARK */}
              <g opacity="0.3" pointerEvents="none">
                <circle cx="440" cy="310" r="45" fill="none" stroke="#d5b5bd" strokeWidth="1.5" strokeDasharray="3 3" />
                <Heart className="h-5 w-5 text-[#c97a8b]" x="430" y="300" />
              </g>

              {/* 4. FOUR ROUND BANQUET TABLES */}
              {TABLES.map(table => {
                const isFiltered = activeTableFilter !== 'all' && activeTableFilter !== table.id;
                const radiusOrbit = 88;
                const seatRadius = 17;

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
                    {/* Outer Table Circle Shadow */}
                    <circle
                      cx={table.cx}
                      cy={table.cy}
                      r="54"
                      fill="none"
                      stroke="#d8bfc6"
                      strokeWidth="3"
                      className="drop-shadow-sm"
                    />

                    {/* Table Surface */}
                    <circle
                      cx={table.cx}
                      cy={table.cy}
                      r="52"
                      fill="url(#table-grad)"
                      stroke="#bca1a8"
                      strokeWidth="1.5"
                    />

                    {/* Center floral ring */}
                    <circle
                      cx={table.cx}
                      cy={table.cy}
                      r="36"
                      fill="none"
                      stroke="#eedee2"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />

                    {/* Table Header Text */}
                    <text
                      x={table.cx}
                      y={table.cy - 10}
                      textAnchor="middle"
                      fill="#3d2c31"
                      fontSize="14"
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
                      fontSize="11"
                      fontWeight="600"
                      className="select-none tracking-wide"
                    >
                      {table.theme}
                    </text>
                    <text
                      x={table.cx}
                      y={table.cy + 22}
                      textAnchor="middle"
                      fill="#786469"
                      fontSize="9"
                      fontWeight="500"
                      className="select-none"
                    >
                      {occupiedAtTable + selectedAtTable}/{table.capacity} seated
                    </text>

                    {/* 10 CIRCULAR SEATS AROUND THE TABLE */}
                    {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                      const seatNum = seatIdx + 1;
                      const seatId = `T${table.id}-S${seatNum}`;
                      const angle = (seatIdx * (360 / table.capacity) - 90) * (Math.PI / 180);
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
                          {/* Generous touch/click hit area */}
                          <circle cx={sx} cy={sy} r={seatRadius + 7} fill="transparent" />

                          {/* Render Seat Based on State */}
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
                                className="h-3.5 w-3.5 text-white pointer-events-none"
                                x={sx - 7}
                                y={sy - 7}
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
                                fontSize="10"
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
                                fontSize="10"
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
                  x="440"
                  y="595"
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
                  left: `${(hoveredSeat.x / 920) * 100}%`,
                  top: `${(hoveredSeat.y / 620) * 100}%`,
                }}
              >
                <div className="rounded-xl border border-stone-200/80 bg-stone-900/90 backdrop-blur-md px-3 py-2 text-center text-white shadow-xl min-w-[140px]">
                  <p className="text-[11px] font-bold text-pink-200">
                    Table {hoveredSeat.tableId} • Seat {hoveredSeat.seatNumber}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TABLES.map(table => {
            return (
              <div
                key={table.id}
                className="rounded-2xl border border-pink-100 bg-white p-5 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                  <div>
                    <h5 className="font-display text-lg font-bold text-stone-800">
                      {table.name}: {table.theme}
                    </h5>
                    <p className="text-[11px] text-stone-500">10 banquet seats</p>
                  </div>
                  <span className="rounded-full bg-[#fdf2f4] px-2.5 py-1 text-[11px] font-bold text-[#b8697a]">
                    Round Table
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-2">
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
                    const t = match ? match[1] : '';
                    const s = match ? match[2] : '';
                    const memberName = attendingMembers[idx] || `Guest ${idx + 1}`;

                    return (
                      <span
                        key={seatId}
                        className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-white px-3 py-1 text-xs font-medium text-stone-800 shadow-2xs"
                      >
                        <span className="h-2 w-2 rounded-full bg-[#c97a8b]" />
                        <strong>{memberName}:</strong> Table {t}, Seat {s}
                        <button
                          type="button"
                          onClick={() => {
                            const matchNum = seatId.match(/T(\d+)-S(\d+)/);
                            if (matchNum) handleSeatClick(parseInt(matchNum[1], 10), parseInt(matchNum[2], 10));
                          }}
                          className="ml-1 text-stone-400 hover:text-red-500 font-bold px-0.5"
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
