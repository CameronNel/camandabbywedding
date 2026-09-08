export interface PaletteColor {
  hex: string;
  name: string;
  label: string;
  emoji: string;
  catEmoji: string;
  tulipColor: 'pink' | 'peach' | 'yellow' | 'sage' | 'blue' | 'lavender' | 'periwinkle';
  bgTint: string;
  borderTint: string;
  textTint: string;
}

export const WEDDING_COLOR_PALETTE: PaletteColor[] = [
  { hex: '#EDC9D4', name: 'Dusty Rose', label: 'Blush / Dusty Rose', emoji: '🌷', catEmoji: '🐱', tulipColor: 'pink', bgTint: '#fdf6f8', borderTint: '#e8b8c6', textTint: '#8a384b' },
  { hex: '#FFD3C9', name: 'Soft Peach', label: 'Pastel Peach', emoji: '🌷', catEmoji: '😸', tulipColor: 'peach', bgTint: '#fff6f4', borderTint: '#f9beaf', textTint: '#8c4333' },
  { hex: '#FFF7CF', name: 'Buttercream', label: 'Buttercream Yellow', emoji: '🌷', catEmoji: '😻', tulipColor: 'yellow', bgTint: '#fffdf4', borderTint: '#fae996', textTint: '#7c6819' },
  { hex: '#E4F0C9', name: 'Matcha Sage', label: 'Matcha / Soft Sage', emoji: '🌷', catEmoji: '🐾', tulipColor: 'sage', bgTint: '#f7faf2', borderTint: '#cde1a4', textTint: '#4a6328' },
  { hex: '#C7E0FF', name: 'Sky Blue', label: 'Pastel Sky Blue', emoji: '🌷', catEmoji: '😽', tulipColor: 'blue', bgTint: '#f3f8ff', borderTint: '#a9cffb', textTint: '#2b578c' },
  { hex: '#CFCFFF', name: 'Lilac', label: 'Pastel Lavender / Lilac', emoji: '🌷', catEmoji: '🐈', tulipColor: 'lavender', bgTint: '#f6f6ff', borderTint: '#b7b7fa', textTint: '#474794' },
  { hex: '#BAC3FF', name: 'Periwinkle', label: 'Pastel Periwinkle', emoji: '🌷', catEmoji: '✨', tulipColor: 'periwinkle', bgTint: '#f3f5ff', borderTint: '#9ba9fb', textTint: '#38469a' },
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

// Exactly 7 round tables arranged in a horseshoe curve, each assigned to one of the 7 official wedding pastel colors
export const TABLES: TableConfig[] = [
  { id: 1, name: 'Table 1', theme: 'Protea', cx: 175, cy: 220, capacity: 8, color: '#EDC9D4', bgTint: '#fdf6f8', borderTint: '#e8b8c6', textTint: '#8a384b', shape: 'round' },
  { id: 2, name: 'Table 2', theme: 'Rose', cx: 150, cy: 410, capacity: 8, color: '#FFD3C9', bgTint: '#fff6f4', borderTint: '#f9beaf', textTint: '#8c4333', shape: 'round' },
  { id: 3, name: 'Table 3', theme: 'Buttercream', cx: 270, cy: 555, capacity: 8, color: '#FFF7CF', bgTint: '#fffdf4', borderTint: '#fae996', textTint: '#7c6819', shape: 'round' },
  { id: 4, name: 'Table 4', theme: 'Fynbos Sage', cx: 480, cy: 565, capacity: 8, color: '#E4F0C9', bgTint: '#f7faf2', borderTint: '#cde1a4', textTint: '#4a6328', shape: 'round' },
  { id: 5, name: 'Table 5', theme: 'Outeniqua Sky', cx: 690, cy: 555, capacity: 8, color: '#C7E0FF', bgTint: '#f3f8ff', borderTint: '#a9cffb', textTint: '#2b578c', shape: 'round' },
  { id: 6, name: 'Table 6', theme: 'Lavender', cx: 810, cy: 410, capacity: 8, color: '#CFCFFF', bgTint: '#f6f6ff', borderTint: '#b7b7fa', textTint: '#474794', shape: 'round' },
  { id: 7, name: 'Table 7', theme: 'Tsitsikamma', cx: 785, cy: 220, capacity: 8, color: '#BAC3FF', bgTint: '#f3f5ff', borderTint: '#9ba9fb', textTint: '#38469a', shape: 'round' },
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
