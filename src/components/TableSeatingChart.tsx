import React, { useState, useMemo, useEffect } from 'react';
import { Check, Users, Info, RotateCcw, Sparkles, Dices, Maximize2, Minimize2 } from 'lucide-react';
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
        viewBox="0 0 1100 960"
        className="w-full h-auto drop-shadow-sm"
        style={{ maxHeight: isModal ? '85vh' : '900px' }}
      >
        <defs>
          <filter id={`glow-rose${isModal ? '-m' : ''}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id={`table-soft-shadow${isModal ? '-m' : ''}`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#8a6f66" floodOpacity="0.18" />
          </filter>
          <linearGradient id={`eucalyptus-leaf${isModal ? '-m' : ''}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7a9d82" />
            <stop offset="100%" stopColor="#55755d" />
          </linearGradient>
          <linearGradient id={`bar-wood${isModal ? '-m' : ''}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8ded6" />
            <stop offset="100%" stopColor="#d9cdc3" />
          </linearGradient>
          <linearGradient id={`buffet-wood${isModal ? '-m' : ''}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8ded6" />
            <stop offset="100%" stopColor="#d9cdc3" />
          </linearGradient>
        </defs>

        {/* ELEGANT POSTER CARD BACKGROUND */}
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

        {/* BOTANICAL EUCALYPTUS FOLIAGE: TOP-RIGHT CORNER */}
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
          <ellipse cx="1055" cy="42" rx="22" ry="12" transform="rotate(-30, 1055, 42)" fill={`url(#eucalyptus-leaf${isModal ? '-m' : ''})`} opacity="0.85" />
          <ellipse cx="1015" cy="72" rx="24" ry="13" transform="rotate(-40, 1015, 72)" fill="#688a70" opacity="0.8" />
          <ellipse cx="980" cy="115" rx="26" ry="14" transform="rotate(-50, 980, 115)" fill="#5d8065" opacity="0.85" />
          <ellipse cx="945" cy="155" rx="24" ry="13" transform="rotate(-58, 945, 155)" fill="#73947a" opacity="0.8" />
          <ellipse cx="915" cy="190" rx="20" ry="11" transform="rotate(-65, 915, 190)" fill="#81a188" opacity="0.75" />
          <ellipse cx="1070" cy="85" rx="20" ry="11" transform="rotate(-15, 1070, 85)" fill="#608268" opacity="0.85" />
          <ellipse cx="1030" cy="130" rx="22" ry="12" transform="rotate(-25, 1030, 130)" fill="#6f9177" opacity="0.8" />
          <ellipse cx="990" cy="175" rx="20" ry="11" transform="rotate(-35, 990, 175)" fill="#7da085" opacity="0.75" />
        </g>

        {/* BOTANICAL EUCALYPTUS FOLIAGE: BOTTOM-LEFT CORNER */}
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
          <ellipse cx="45" cy="918" rx="22" ry="12" transform="rotate(150, 45, 918)" fill={`url(#eucalyptus-leaf${isModal ? '-m' : ''})`} opacity="0.85" />
          <ellipse cx="85" cy="888" rx="24" ry="13" transform="rotate(140, 85, 888)" fill="#688a70" opacity="0.8" />
          <ellipse cx="120" cy="845" rx="26" ry="14" transform="rotate(130, 120, 845)" fill="#5d8065" opacity="0.85" />
          <ellipse cx="155" cy="805" rx="24" ry="13" transform="rotate(122, 155, 805)" fill="#73947a" opacity="0.8" />
          <ellipse cx="185" cy="770" rx="20" ry="11" transform="rotate(115, 185, 770)" fill="#81a188" opacity="0.75" />
          <ellipse cx="30" cy="875" rx="20" ry="11" transform="rotate(165, 30, 875)" fill="#608268" opacity="0.85" />
          <ellipse cx="70" cy="830" rx="22" ry="12" transform="rotate(155, 70, 830)" fill="#6f9177" opacity="0.8" />
          <ellipse cx="110" cy="785" rx="20" ry="11" transform="rotate(145, 110, 785)" fill="#7da085" opacity="0.75" />
        </g>

        {/* SEATING PLAN POSTER HEADER */}
        <g className="cursor-default select-none">
          <text
            x="550"
            y="54"
            textAnchor="middle"
            fill="#261e20"
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
            fill="#6e6266"
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
            fill={`url(#bar-wood${isModal ? '-m' : ''})`}
            stroke="#b39c8e"
            strokeWidth="1.8"
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
          {/* Bar top motif */}
          <circle cx="52" cy="112" r="9" fill="#fdf7ea" stroke="#c59b48" strokeWidth="1.2" />
          <path d="M 47 112 L 57 112 M 52 112 L 52 119 M 48 119 L 56 119" stroke="#7a5a1e" strokeWidth="1.4" strokeLinecap="round" />

          {/* Decorative separator line above BAR label */}
          <line x1="37" y1="136" x2="67" y2="136" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* Vertical Bar Label */}
          <text
            x="52"
            y="180"
            fill="#4a3b37"
            fontSize="15"
            fontWeight="bold"
            letterSpacing="5"
            textAnchor="middle"
            transform="rotate(-90, 52, 180)"
            className="font-display select-none uppercase"
          >
            BAR
          </text>

          {/* Decorative separator line below BAR label */}
          <line x1="37" y1="224" x2="67" y2="224" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* Bar bottom motif */}
          <circle cx="52" cy="248" r="9" fill="#fdf7ea" stroke="#c59b48" strokeWidth="1.2" />
          <path d="M 47 248 L 57 248 M 52 248 L 52 255 M 48 255 L 56 255" stroke="#7a5a1e" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* RIGHT SIDE: FOOD BUFFET */}
        <g className="cursor-default">
          <rect
            x="1020"
            y="260"
            width="56"
            height="380"
            rx="12"
            fill={`url(#buffet-wood${isModal ? '-m' : ''})`}
            stroke="#b39c8e"
            strokeWidth="1.8"
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
          {/* Buffet platter motifs top */}
          <ellipse cx="1048" cy="300" rx="12" ry="18" fill="#fdf7ea" stroke="#c59b48" strokeWidth="1.2" />

          {/* Decorative separator line above FOOD label */}
          <line x1="1033" y1="345" x2="1063" y2="345" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* Vertical Food Label */}
          <text
            x="1048"
            y="450"
            fill="#4a3b37"
            fontSize="16"
            fontWeight="bold"
            letterSpacing="6"
            textAnchor="middle"
            transform="rotate(90, 1048, 450)"
            className="font-display select-none uppercase"
          >
            FOOD
          </text>

          {/* Decorative separator line below FOOD label */}
          <line x1="1033" y1="555" x2="1063" y2="555" stroke="#d9cdc3" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* Buffet platter motifs bottom */}
          <ellipse cx="1048" cy="600" rx="12" ry="18" fill="#fdf7ea" stroke="#c59b48" strokeWidth="1.2" />
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

        {/* 8 ROUND BANQUET TABLES (Gathered around the central dance floor) */}
        {TABLES.map(table => {
          const radiusOrbit = 74;
          const tableRadius = 52;
          const seatRadius = 13.5;

          const occupiedAtTable = Array.from({ length: table.capacity }).filter((_, i) =>
            occupiedSeatsMap.has(`T${table.id}-S${i + 1}`),
          ).length;
          const selectedAtTable = Array.from({ length: table.capacity }).filter((_, i) =>
            selectedSeatIds.includes(`T${table.id}-S${i + 1}`),
          ).length;

          return (
            <g key={table.id}>
              {/* Table Top with Golden/Champagne Rim Ring */}
              <circle
                cx={table.cx}
                cy={table.cy}
                r={tableRadius}
                fill="#ffffff"
                stroke="#c59b48"
                strokeWidth="2.8"
                filter={`url(#table-soft-shadow${isModal ? '-m' : ''})`}
              />

              {table.id === 1 ? (
                /* Table 1: Cam & Abby (4 cleanly spaced lines) */
                <g className="select-none pointer-events-none">
                  <text
                    x={table.cx}
                    y={table.cy - 15}
                    textAnchor="middle"
                    fill="#261e20"
                    fontSize="16"
                    fontWeight="700"
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
                    fontWeight="600"
                    letterSpacing="0.3"
                    className="font-sans"
                  >
                    {table.theme}
                  </text>
                  <text
                    x={table.cx}
                    y={table.cy + 13}
                    textAnchor="middle"
                    fill="#6e6266"
                    fontSize="9"
                    fontWeight="500"
                    className="font-sans"
                  >
                    {occupiedAtTable + selectedAtTable}/{table.capacity} seated
                  </text>
                  <text
                    x={table.cx}
                    y={table.cy + 27}
                    textAnchor="middle"
                    fill="#b85b73"
                    fontSize="9.5"
                    fontWeight="700"
                    className="font-sans"
                  >
                    Cam &amp; Abby 💕
                  </text>
                </g>
              ) : (
                /* Tables 2–8: 3 cleanly spaced lines */
                <g className="select-none pointer-events-none">
                  <text
                    x={table.cx}
                    y={table.cy - 10}
                    textAnchor="middle"
                    fill="#261e20"
                    fontSize="17"
                    fontWeight="700"
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
                    fontWeight="600"
                    letterSpacing="0.3"
                    className="font-sans"
                  >
                    {table.theme}
                  </text>
                  <text
                    x={table.cx}
                    y={table.cy + 22}
                    textAnchor="middle"
                    fill="#6e6266"
                    fontSize="9.5"
                    fontWeight="500"
                    className="font-sans"
                  >
                    {occupiedAtTable + selectedAtTable}/{table.capacity} seated
                  </text>
                </g>
              )}

              {/* 8 SEATS AROUND EACH TABLE (Radially at 45 degree intervals, starting at top 12 o'clock) */}
              {Array.from({ length: table.capacity }).map((_, seatIdx) => {
                const seatNum = seatIdx + 1;
                const seatId = `T${table.id}-S${seatNum}`;
                const angle = ((seatIdx * 360) / table.capacity - 90) * (Math.PI / 180);
                const sx = table.cx + radiusOrbit * Math.cos(angle);
                const sy = table.cy + radiusOrbit * Math.sin(angle);

                const isOccupied = occupiedSeatsMap.has(seatId);
                const occupant = occupiedSeatsMap.get(seatId);
                const isSelected = selectedSeatIds.includes(seatId);

                const selectedIndex = selectedSeatIds.indexOf(seatId);
                const assignedMemberName = isSelected
                  ? attendingMembers[selectedIndex] || `Guest ${selectedIndex + 1}`
                  : undefined;

                const isCamOrAbby = table.id === 1 && (seatNum === 1 || seatNum === 2);

                return (
                  <g
                    key={seatId}
                    data-seat-id={seatId}
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
                    className={
                      isOccupied && !isSelected
                        ? 'cursor-not-allowed opacity-90'
                        : 'cursor-pointer group'
                    }
                  >
                    {/* Hover hotspot circle */}
                    <circle cx={sx} cy={sy} r={seatRadius + 7} fill="transparent" />

                    {/* SEAT CIRCLE RENDERING */}
                    {isSelected ? (
                      <g className="transition-transform duration-200 group-hover:scale-110 origin-center">
                        <circle
                          cx={sx}
                          cy={sy}
                          r={seatRadius}
                          fill="#df7a90"
                          stroke="#b85268"
                          strokeWidth="2.2"
                          filter={`url(#glow-rose${isModal ? '-m' : ''})`}
                        />
                        <Check
                          className="h-3.5 w-3.5 text-white stroke-[3] pointer-events-none select-none"
                          x={sx - 7}
                          y={sy - 7}
                        />
                      </g>
                    ) : isCamOrAbby ? (
                      <g className="cursor-not-allowed">
                        <circle
                          cx={sx}
                          cy={sy}
                          r={seatRadius}
                          fill="#fde8ee"
                          stroke="#d47a8d"
                          strokeWidth="2"
                        />
                        <text
                          x={sx}
                          y={sy + 3.5}
                          textAnchor="middle"
                          fontSize="7.5"
                          fontWeight="bold"
                          fill="#8e3146"
                          className="select-none pointer-events-none font-sans"
                        >
                          {seatNum === 1 ? 'CAM' : 'ABBY'}
                        </text>
                      </g>
                    ) : isOccupied ? (
                      <g className="cursor-not-allowed">
                        <circle
                          cx={sx}
                          cy={sy}
                          r={seatRadius}
                          fill="#f3ede8"
                          stroke="#d8cec5"
                          strokeWidth="1.4"
                        />
                        <text
                          x={sx}
                          y={sy + 3.5}
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight="bold"
                          fill="#998b80"
                          className="select-none pointer-events-none font-mono"
                        >
                          ✕
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
                          strokeWidth="1.5"
                          className="group-hover:stroke-[#df8b9d] group-hover:fill-[#fff7f9] transition-colors"
                        />
                        <text
                          x={sx}
                          y={sy + 3.5}
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight="600"
                          fill="#5c4f4a"
                          className="select-none pointer-events-none font-mono group-hover:fill-[#b85b73]"
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

      {/* Hover Tooltip Overlay */}
      {hoveredSeat && (
        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full pb-3 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${(hoveredSeat.x / 1100) * 100}%`,
            top: `${(hoveredSeat.y / 960) * 100}%`,
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
      <div className="rounded-2xl border border-[#e8e2dc] bg-white/95 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b85b73]">
              <Sparkles className="h-4 w-4" />
              <span>Arendsrus Dining Room Seating</span>
            </div>
            <h4 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-stone-800">
              Choose Your Table &amp; Seats
            </h4>
            <p className="mt-1 text-xs text-stone-600 max-w-xl leading-relaxed">
              There are <strong>8 round tables</strong> (8 seats per table, 64 seats total) — no head table, Cam &amp; Abby are seated at <strong>Table 1</strong>. Click on any free seat to reserve it!
            </p>
          </div>

          {/* Party Selection Status Pill */}
          <div className="flex flex-col sm:items-end justify-center shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#eedad3] bg-[#faf4f0] px-4 py-2 text-xs font-medium text-stone-800 shadow-sm">
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
                <span className="font-semibold text-[#b85b73]">
                  {selectedSeatIds.length} of {attendingCount} selected ({seatsRemaining} left)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap items-center gap-4 sm:gap-6 border-t border-[#f0eae2] pt-4 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#d4c2b8] bg-white font-mono text-[10px] font-bold text-[#5c4f4a] shadow-xs">
              1
            </span>
            <span>Available Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#b85268] bg-[#df7a90] text-white shadow-xs">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
            <span className="font-semibold text-[#a84b61]">Your Selection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#d47a8d] bg-[#fde8ee] font-sans text-[7.5px] font-bold text-[#8e3146] shadow-xs">
              C&amp;A
            </span>
            <span>Cam &amp; Abby (Table 1)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#d8cec5] bg-[#f3ede8] text-[10px] font-bold text-[#998b80] shadow-xs">
              ✕
            </span>
            <span>Reserved (Other Guests)</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {viewMode === 'map' && (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e2dad2] bg-white px-3 py-1 text-[11px] font-semibold text-[#5c524b] hover:border-[#df8b9d] hover:text-[#b85b73] shadow-2xs cursor-pointer transition"
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
                  className="rounded-2xl border border-[#e8e2dc] bg-white p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#f0eae2] pb-3">
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
                                : 'border-[#ded7cf] bg-[#faf8f5] hover:bg-white hover:border-[#df8b9d] text-stone-700'
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
      <div className="rounded-2xl border border-[#e8ded6] bg-gradient-to-br from-[#ffffff] via-[#fdfcfb] to-[#faf6f2] p-5 sm:p-6 shadow-sm">
        {/* Header with Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0eae2] pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#b85b73]">
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
                  : 'bg-[#faf2f4] text-[#b85b73] border border-[#f0d5dc]'
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
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-[#e8e2dc] bg-white px-3.5 py-2.5 shadow-2xs hover:border-[#df8b9d] transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#faf2f4] border border-[#f0d5dc] text-xs font-bold text-[#b85b73]">
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
