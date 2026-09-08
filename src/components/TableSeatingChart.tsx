import React, { useState, useMemo, useEffect } from 'react';
import { Wine, Check, Users, Info, RotateCcw, Sparkles, Heart, Dices, Maximize2, Minimize2 } from 'lucide-react';
import type { HouseholdInvitation } from '../types/wedding';
import {
  TABLES,
  type SeatOccupant,
  parseSeatsFromTableNumber,
  formatSeatsToTableNumber,
} from '../utils/seatingConstants';

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

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Keyboard shortcut (Escape) to exit full-screen view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock background scrolling when full screen is active
  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  // Build the map of occupied seats from all OTHER households
  const occupiedSeatsMap = useMemo(() => {
    const map = new Map<string, SeatOccupant>();

    // Cam & Abby sit with everyone else at Table 1, Seats 1 & 2 (no head table)
    map.set('T1-S1', {
      householdId: 'household-cam-abby',
      householdName: 'Cameron & Abby',
      guestNames: ['Cameron Nel'],
      tableId: 1,
      seatNumber: 1,
    });
    map.set('T1-S2', {
      householdId: 'household-cam-abby',
      householdName: 'Cameron & Abby',
      guestNames: ['Abby'],
      tableId: 1,
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

    // 1. Is this seat occupied by someone else?
    const occupied = occupiedSeatsMap.get(seatId);
    if (occupied) {
      if (occupied.householdId === 'household-cam-abby') {
        setAlertMessage('Seats 1 & 2 at Table 1 are reserved for the bride & groom, Cam and Abby! 💕');
      } else {
        setAlertMessage(`Seat ${seatNumber} at Table ${tableId} is already reserved by ${occupied.householdName}.`);
      }
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

    // Find all available guest seats across all 8 guest tables
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

  const renderFloorPlanContent = (isModal = false) => (
    <div className={`relative mx-auto w-full ${isModal ? 'max-w-6xl' : 'max-w-5xl'} select-none`}>
      {/* Top-Right Full Screen / Minimize Button */}
      {!isModal ? (
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 inline-flex items-center gap-1.5 rounded-xl border border-stone-200/90 bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-[#b8697a] hover:bg-white hover:border-pink-200 shadow-xs backdrop-blur-xs transition cursor-pointer"
          title="Open Seating Chart in Full Screen"
        >
          <Maximize2 className="h-3.5 w-3.5 text-[#b8697a]" />
          <span className="hidden sm:inline">Full Screen View</span>
          <span className="sm:hidden">Full Screen</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950 hover:bg-white shadow-xs backdrop-blur-xs transition cursor-pointer"
          title="Exit Full Screen View"
        >
          <Minimize2 className="h-3.5 w-3.5 text-[#b8697a]" />
          <span>Exit Full Screen</span>
        </button>
      )}

      <svg
        viewBox="0 0 1000 730"
        className="w-full h-auto drop-shadow-xs"
        style={{ maxHeight: isModal ? '78vh' : '780px' }}
      >
        <defs>
          <filter id={`glow-rose${isModal ? '-m' : ''}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id={`table-soft-shadow${isModal ? '-m' : ''}`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#8a6f66" floodOpacity="0.28" />
          </filter>
          <linearGradient id={`bar-wood${isModal ? '-m' : ''}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8d6255" />
            <stop offset="100%" stopColor="#6e473b" />
          </linearGradient>
          <linearGradient id={`buffet-wood${isModal ? '-m' : ''}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7a554a" />
            <stop offset="100%" stopColor="#5d3b32" />
          </linearGradient>
        </defs>

        {/* ROOM BOUNDARY OUTLINE */}
        <rect
          x="18"
          y="18"
          width="964"
          height="662"
          rx="24"
          fill="none"
          stroke="#e2cbd1"
          strokeWidth="2"
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
            fill={`url(#bar-wood${isModal ? '-m' : ''})`}
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
              <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-wide text-[#3b231c]">
                <Wine className="h-3.5 w-3.5 text-[#8d6255]" />
                <span>Bar</span>
              </div>
              <span className="text-[9.5px] uppercase font-bold text-[#5c382d] tracking-wider">
                Drinks &amp; Refreshments
              </span>
            </div>
          </foreignObject>
        </g>

        {/* 2. RIGHT WALL: FOOD BUFFET (Matching sketch - well-spaced platters with clear space for label) */}
        <g className="cursor-default">
          <rect
            x="925"
            y="26"
            width="48"
            height="605"
            rx="12"
            fill={`url(#buffet-wood${isModal ? '-m' : ''})`}
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

          {/* Vertical Food Label */}
          <text
            x="949"
            y="328"
            fill="#3b231c"
            fontSize="17"
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

        {/* 3. DANCE FLOOR (In the middle of the horseshoe) */}
        <g opacity="0.9" pointerEvents="none">
          <ellipse
            cx="480"
            cy="350"
            rx="105"
            ry="68"
            fill="#fdf2f5"
            fillOpacity="0.55"
            stroke="#dfaeb9"
            strokeWidth="1.8"
            strokeDasharray="5 5"
          />
          <text
            x="480"
            y="345"
            textAnchor="middle"
            fill="#9e475a"
            fontSize="13"
            fontWeight="bold"
            letterSpacing="4"
            className="font-display select-none uppercase"
          >
            DANCE FLOOR
          </text>
          <Heart className="h-4 w-4 text-[#df8b9d]" x="472" y="357" />
        </g>

        {/* 4. EIGHT ROUND BANQUET TABLES (horseshoe around the dance floor, no head table) */}
        {TABLES.map(table => {
          const radiusOrbit = 78;
          const tableRadius = 50;
          const seatRadius = 16;

          const occupiedAtTable = Array.from({ length: table.capacity }).filter((_, i) =>
            occupiedSeatsMap.has(`T${table.id}-S${i + 1}`),
          ).length;
          const selectedAtTable = Array.from({ length: table.capacity }).filter((_, i) =>
            selectedSeatIds.includes(`T${table.id}-S${i + 1}`),
          ).length;

          return (
            <g key={table.id}>
              {/* Cottage tablecloth with a soft lifelike shadow */}
              <circle
                cx={table.cx}
                cy={table.cy}
                r={tableRadius}
                fill="#fffdf9"
                stroke={table.borderTint}
                strokeWidth="1.5"
                strokeOpacity="0.85"
                filter={`url(#table-soft-shadow${isModal ? '-m' : ''})`}
              />
              {/* Table runner ring in the table's brand tint */}
              <circle
                cx={table.cx}
                cy={table.cy}
                r={tableRadius - 11}
                fill="none"
                stroke={table.color}
                strokeWidth="6"
                opacity="0.4"
              />
              {/* Cottage tablecloth with a soft lifelike shadow */}
              <circle
                cx={table.cx}
                cy={table.cy}
                r={tableRadius}
                fill={table.bgTint}
                stroke={table.borderTint}
                strokeWidth="1.5"
                strokeOpacity="0.85"
                filter={`url(#table-soft-shadow${isModal ? '-m' : ''})`}
              />
              {/* Table runner ring in the table's brand tint */}
              <circle
                cx={table.cx}
                cy={table.cy}
                r={tableRadius - 12}
                fill="none"
                stroke={table.color}
                strokeWidth="7"
                opacity="0.45"
              />
              {/* Table Label */}
              <text
                x={table.cx}
                y={table.cy - 12}
                textAnchor="middle"
                fill="#1c1917"
                fontSize="15"
                fontWeight="bold"
                className="font-display select-none"
              >
                {table.name}
              </text>
              <text
                x={table.cx}
                y={table.cy + 5}
                textAnchor="middle"
                fill={table.textTint}
                fontSize="10.5"
                fontWeight="bold"
                letterSpacing="0.5"
                className="select-none"
                textLength={table.theme.length > 9 ? 86 : undefined}
                lengthAdjust="spacingAndGlyphs"
              >
                {table.theme}
              </text>
              <text
                x={table.cx}
                y={table.cy + 21}
                textAnchor="middle"
                fill="#57534e"
                fontSize="10"
                fontWeight="600"
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
                    className="group cursor-pointer"
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
                      <g filter={`url(#glow-rose${isModal ? '-m' : ''})`}>
                        <circle
                          cx={sx}
                          cy={sy}
                          r={seatRadius}
                          fill="#df8b9d"
                          stroke="#c47b8b"
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
                          fill="#e9e2d8"
                          stroke="#c0af9e"
                          strokeWidth="1.5"
                        />
                        <text
                          x={sx}
                          y={sy + 4}
                          textAnchor="middle"
                          fill="#9c8b7a"
                          fontSize="12"
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
                          fill="#fff8fa"
                          stroke="#dfaeb9"
                          strokeWidth="1.6"
                          className="group-hover:fill-[#fdeef3] group-hover:stroke-[#df8b9d] transition-colors"
                        />
                        <text
                          x={sx}
                          y={sy + 4}
                          textAnchor="middle"
                          fill="#7a6a70"
                          fontSize="11"
                          fontWeight="bold"
                          className="select-none pointer-events-none font-mono group-hover:fill-[#a84b61]"
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

        {/* ENTRANCE INDICATION & GARDEN PATIO (Clear architectural doorway pill box) */}
        <g>
          <rect
            x="300"
            y="665"
            width="360"
            height="34"
            rx="12"
            fill="#ffffff"
            stroke="#cfb0a3"
            strokeWidth="1.8"
            className="drop-shadow-xs"
          />
          <text
            x="480"
            y="687"
            textAnchor="middle"
            fill="#523933"
            fontSize="11"
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
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full pb-3 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${(hoveredSeat.x / 1000) * 100}%`,
            top: `${(hoveredSeat.y / 730) * 100}%`,
          }}
        >
          <div className="rounded-xl border border-[#f0d5de] bg-white/95 backdrop-blur-md px-3.5 py-2.5 text-center text-stone-800 shadow-xl min-w-[160px]">
            <p className="text-[11px] font-bold text-[#8a384b]">
              {hoveredSeat.tableName} • Seat {hoveredSeat.seatNumber}
            </p>
            {hoveredSeat.status === 'selected' ? (
              <div className="mt-0.5">
                <p className="text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
                  <Check className="h-3 w-3 text-emerald-600" />
                  {hoveredSeat.occupantName || 'Your Party'}
                </p>
                <p className="text-[9px] text-stone-500">Click to unselect</p>
              </div>
            ) : hoveredSeat.status === 'occupied' ? (
              <div className="mt-0.5">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider">Reserved by</p>
                <p className="text-xs font-semibold text-stone-800">
                  {hoveredSeat.occupantName}
                </p>
              </div>
            ) : (
              <div className="mt-0.5">
                <p className="text-xs font-semibold text-emerald-600">Available</p>
                <p className="text-[9px] text-stone-500">Click to choose seat</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

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
              There are <strong>8 round tables</strong> (8 seats each, 64 seats for our 60 guests) gathered around the dance floor — no head table, Cam &amp; Abby are seated at <strong>Table 1</strong>. Click on any free seat to reserve it!
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
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#dfaeb9] bg-[#fff8fa] font-mono text-[10px] font-bold text-[#7a6a70] shadow-xs">
              1
            </span>
            <span>Available Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#c47b8b] bg-[#df8b9d] text-white shadow-xs">
              <Check className="h-3 w-3" />
            </span>
            <span className="font-semibold text-[#a84b61]">Your Selection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#c0af9e] bg-[#e9e2d8] text-[10px] font-bold text-[#9c8b7a] shadow-xs">
              ×
            </span>
            <span>Reserved (Other Guests, incl. Cam &amp; Abby at Table 1)</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {viewMode === 'map' && (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-white px-3 py-1 text-[11px] font-semibold text-[#b8697a] hover:bg-pink-50 shadow-2xs cursor-pointer transition"
              >
                <Maximize2 className="h-3 w-3" />
                <span>Full Screen</span>
              </button>
            )}
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

      {/* VIEW MODE: INTERACTIVE FLOOR PLAN MAP */}
      {viewMode === 'map' && (
        <div className="relative overflow-hidden rounded-3xl border border-[#e8d5d9] bg-gradient-to-br from-[#faf6f7] via-[#fffdfd] to-[#f8f2f4] p-3 sm:p-6 shadow-sm">
          {/* Subtle room floor watermark */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#eedade_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

          {renderFloorPlanContent(false)}
        </div>
      )}

      {/* VIEW MODE: TABLE CARDS (Alternate list view for mobile screens) */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* 8 Round Guest Tables */}
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
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                      style={{
                        backgroundColor: table.bgTint,
                        color: table.textTint,
                        border: `1px solid ${table.borderTint}`,
                      }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: table.color }} />
                      {table.theme}
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
                              ? 'border-[#c47b8b] bg-[#df8b9d] text-white shadow-xs'
                              : isOccupied
                                ? 'border-[#d8cfc6] bg-[#ece7e0] text-[#8a7f74] cursor-not-allowed'
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

      {/* FULL-SCREEN MODAL OVERLAY */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#fdf8fa]/95 backdrop-blur-xl p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 text-stone-800"
          role="dialog"
          aria-modal="true"
          aria-label="Full screen seating chart"
        >
          {/* Modal Header */}
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 pb-3 text-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="rounded-full bg-pink-100 p-2 text-[#c97a8b]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-stone-900 leading-tight">
                  Arendsrus Dining Room Seating
                </h3>
                <p className="text-[11px] text-stone-500">
                  Click seats to choose where your party will sit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-3.5 py-1 text-xs text-[#8a384b] shadow-2xs">
                <Users className="h-3.5 w-3.5 text-[#c97a8b]" />
                <span>Party: <strong>{attendingCount}</strong></span>
                <span className="text-pink-300">•</span>
                <span>{selectedSeatIds.length} of {attendingCount} chosen</span>
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white hover:bg-pink-50 px-3.5 py-2 text-xs font-semibold text-stone-800 shadow-sm cursor-pointer transition"
              >
                <Minimize2 className="h-4 w-4 text-[#c97a8b]" />
                <span>Exit Full Screen</span>
                <kbd className="hidden md:inline-block ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500 border border-stone-200">Esc</kbd>
              </button>
            </div>
          </div>

          {/* Modal Map Card */}
          <div className="relative mx-auto my-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-[#e8d5d9] bg-gradient-to-br from-[#faf6f7] via-[#fffdfd] to-[#f8f2f4] p-3 sm:p-6 shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#eedade_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
            {renderFloorPlanContent(true)}
          </div>
        </div>
      )}
    </div>
  );
};
