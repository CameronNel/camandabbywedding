export interface PaletteColor {
  hex: string;
  name: string;
  label: string;
  emoji: string;
  tulipColor: 'pink' | 'sage' | 'mint' | 'peach' | 'cream' | 'terracotta' | 'yellow' | 'blue' | 'lavender' | 'periwinkle';
  bgTint: string;
  borderTint: string;
  textTint: string;
}

export const WEDDING_COLOR_PALETTE: PaletteColor[] = [
  { hex: '#E4AEB5', name: 'Dusty Rose', label: 'Dusty Rose Pink', emoji: '🌷', tulipColor: 'pink', bgTint: '#fdf5f6', borderTint: '#e4aeb5', textTint: '#8a424e' },
  { hex: '#9BBEAB', name: 'Sage Green', label: 'Eucalyptus Sage', emoji: '🌷', tulipColor: 'sage', bgTint: '#f4f8f5', borderTint: '#9bbeab', textTint: '#385e49' },
  { hex: '#C0DCCC', name: 'Seafoam Mint', label: 'Soft Seafoam Mint', emoji: '🌷', tulipColor: 'mint', bgTint: '#f6faf8', borderTint: '#c0dccc', textTint: '#3b6b55' },
  { hex: '#F5D0C6', name: 'Soft Peach', label: 'Warm Peach', emoji: '🌷', tulipColor: 'peach', bgTint: '#fef7f5', borderTint: '#f5d0c6', textTint: '#8e4c3d' },
  { hex: '#ECE3DF', name: 'Warm Linen', label: 'Blush Warm Linen', emoji: '🌷', tulipColor: 'cream', bgTint: '#faf7f5', borderTint: '#ece3df', textTint: '#6b5850' },
  { hex: '#E7AF9E', name: 'Terracotta', label: 'Dusty Terracotta', emoji: '🌷', tulipColor: 'terracotta', bgTint: '#fdf5f2', borderTint: '#e7af9e', textTint: '#854231' },
];

export interface TableConfig {
  id: number;
  name: string;
  theme: string;
  cx: number;
  cy: number;
  capacity: number;
  color: string;
  bgTint: string;
  borderTint: string;
  textTint: string;
  shape?: 'round' | 'head';
}

// Exactly 8 round tables (8 seats per table = 6FT round = 64 pax)
// Arranged around the central dance floor with the bar on the top-left and food buffet on the right.
// No head table: Cam & Abby sit at Table 1, Seats 1 & 2.
export const TABLES: TableConfig[] = [
  { id: 1, name: 'Table 1', theme: 'Protea', cx: 415, cy: 230, capacity: 8, color: '#c59b48', bgTint: '#fffdfb', borderTint: '#c59b48', textTint: '#a04255', shape: 'round' },
  { id: 2, name: 'Table 2', theme: 'Eucalyptus', cx: 210, cy: 365, capacity: 8, color: '#c59b48', bgTint: '#fffdfb', borderTint: '#c59b48', textTint: '#3d664f', shape: 'round' },
  { id: 3, name: 'Table 3', theme: 'Seafoam', cx: 210, cy: 605, capacity: 8, color: '#c59b48', bgTint: '#fffdfb', borderTint: '#c59b48', textTint: '#2f6e56', shape: 'round' },
  { id: 4, name: 'Table 4', theme: 'Peach Blossom', cx: 415, cy: 715, capacity: 8, color: '#c59b48', bgTint: '#fffdfb', borderTint: '#c59b48', textTint: '#a35242', shape: 'round' },
  { id: 5, name: 'Table 5', theme: 'Warm Linen', cx: 685, cy: 715, capacity: 8, color: '#c59b48', bgTint: '#fffdfb', borderTint: '#c59b48', textTint: '#755e52', shape: 'round' },
  { id: 6, name: 'Table 6', theme: 'Terracotta Clay', cx: 890, cy: 605, capacity: 8, color: '#c59b48', bgTint: '#fffdfb', borderTint: '#c59b48', textTint: '#a04d3b', shape: 'round' },
  { id: 7, name: 'Table 7', theme: 'Garden Sage', cx: 890, cy: 365, capacity: 8, color: '#c59b48', bgTint: '#fffdfb', borderTint: '#c59b48', textTint: '#3d664f', shape: 'round' },
  { id: 8, name: 'Table 8', theme: 'Blushing Bride', cx: 685, cy: 230, capacity: 8, color: '#c59b48', bgTint: '#fffdfb', borderTint: '#c59b48', textTint: '#a04255', shape: 'round' },
];

export interface SeatOccupant {
  householdId: string;
  householdName: string;
  guestNames: string[];
  tableId: number;
  seatNumber: number;
}

export function parseSeatsFromTableNumber(
  str: string | undefined | null,
  defaultCount = 1,
): { tableId: number; seatNumbers: number[] }[] {
  if (!str || !str.trim()) return [];
  const results: { tableId: number; seatNumbers: number[] }[] = [];

  // Legacy: previously saved "Bridal Table" values still parse so old selections display instead of vanishing.
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
    if (!isNaN(num) && num >= 1 && num <= 8) {
      results.push({
        tableId: num,
        seatNumbers: Array.from({ length: defaultCount }, (_, i) => i + 1),
      });
    }
  }

  return results;
}

export function formatSeatsToTableNumber(selectedSeatIds: string[]): string {
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

export const WEDDING_FAVOUR_OPTIONS = [
  {
    id: 'Stroopwaffels',
    label: 'Stroopwaffels',
    description: 'Traditional Dutch Stroopwaffels',
    emoji: '🧇',
  },
  {
    id: 'Bubbles / Glasses',
    label: 'Bubbles / Glasses',
    description: 'Cool glasses or bubbles',
    emoji: '🫧',
  },
  {
    id: 'Something from the netherlands',
    label: 'Something from the netherlands',
    description: 'A special Dutch keepsake chosen with love',
    emoji: '🌷',
  },
  {
    id: 'Nothing',
    label: 'Nothing',
    description: "We don't want anything",
    emoji: '🤍',
  },
] as const;
