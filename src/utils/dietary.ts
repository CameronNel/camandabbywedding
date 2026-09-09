export interface DietaryOption {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  activeBg: string;
}

export const DIETARY_OPTIONS: DietaryOption[] = [
  {
    id: 'Vegetarian',
    label: 'Vegetarian',
    icon: '🥗',
    keywords: ['veg', 'vegetarian', 'vvegetarian', 'vegitarian', 'lacto-vegetarian'],
    badgeBg: 'bg-[#edf6f1]',
    badgeText: 'text-[#255239]',
    badgeBorder: 'border-[#9bbeab]/50',
    activeBg: 'bg-[#9bbeab] text-white border-[#87ab97]',
  },
  {
    id: 'Vegan',
    label: 'Vegan',
    icon: '🌱',
    keywords: ['vegan', 'plant based', 'plant-based'],
    badgeBg: 'bg-[#eff7f3]',
    badgeText: 'text-[#1e583f]',
    badgeBorder: 'border-[#c0dccc]/60',
    activeBg: 'bg-[#5b9a7d] text-white border-[#4d866c]',
  },
  {
    id: 'Gluten-Free',
    label: 'Gluten-Free',
    icon: '🌾',
    keywords: ['gluten', 'coeliac', 'celiac', 'wheat', 'gluten-free', 'gluten free'],
    badgeBg: 'bg-[#fef6f2]',
    badgeText: 'text-[#9c4c28]',
    badgeBorder: 'border-[#f5d0c6]',
    activeBg: 'bg-[#e7af9e] text-white border-[#d89c89]',
  },
  {
    id: 'Dairy-Free',
    label: 'Dairy-Free',
    icon: '🥛',
    keywords: ['dairy', 'lactose', 'milk', 'dairy-free', 'dairy free', 'lactose-free'],
    badgeBg: 'bg-[#f0f7ff]',
    badgeText: 'text-[#1d4f7c]',
    badgeBorder: 'border-[#bae0fd]',
    activeBg: 'bg-[#679ecc] text-white border-[#568bb8]',
  },
  {
    id: 'Nut Allergy',
    label: 'Nut Allergy',
    icon: '🥜',
    keywords: ['nut', 'peanut', 'almond', 'tree nut', 'nuts', 'cashew', 'walnut'],
    badgeBg: 'bg-[#fdf2f4]',
    badgeText: 'text-[#b85b73]',
    badgeBorder: 'border-[#e4aeb5]',
    activeBg: 'bg-[#d88794] text-white border-[#c7727f]',
  },
  {
    id: 'Halal',
    label: 'Halal',
    icon: '🍖',
    keywords: ['halal', 'halaal'],
    badgeBg: 'bg-[#edf5f0]',
    badgeText: 'text-[#214f38]',
    badgeBorder: 'border-[#9bbeab]/50',
    activeBg: 'bg-[#2c523f] text-white border-[#214232]',
  },
  {
    id: 'Seafood Allergy',
    label: 'Seafood Allergy',
    icon: '🦐',
    keywords: ['fish', 'seafood', 'shellfish', 'prawn', 'shrimp', 'crab', 'crustacean'],
    badgeBg: 'bg-[#fff5ee]',
    badgeText: 'text-[#9c421b]',
    badgeBorder: 'border-[#e7af9e]',
    activeBg: 'bg-[#d97c5e] text-white border-[#c4684b]',
  },
];

export interface NormalizedDietary {
  tags: DietaryOption[];
  notes?: string;
}

/**
 * Normalizes dietary restrictions and freeform details into structured tags and clean notes.
 * Also intelligently extracts standard dietary tags from legacy strings or misspellings like
 * "Vvegetarian, Halaal, Nut" so they display cleanly as individual badges.
 */
export function normalizeDietary(
  restrictions?: string[] | null,
  details?: string | null
): NormalizedDietary {
  const matchedTagMap = new Map<string, DietaryOption>();
  const customNotesList: string[] = [];

  // 1. Process explicit restrictions array
  if (Array.isArray(restrictions)) {
    for (const r of restrictions) {
      if (!r || !r.trim()) continue;
      const cleanR = r.trim();
      const direct = DIETARY_OPTIONS.find(
        opt => opt.id.toLowerCase() === cleanR.toLowerCase() || opt.label.toLowerCase() === cleanR.toLowerCase()
      );
      if (direct) {
        matchedTagMap.set(direct.id, direct);
      } else {
        // Check keywords
        const found = DIETARY_OPTIONS.find(opt =>
          opt.keywords.some(kw => cleanR.toLowerCase() === kw || cleanR.toLowerCase().includes(kw))
        );
        if (found) {
          matchedTagMap.set(found.id, found);
        } else {
          customNotesList.push(cleanR);
        }
      }
    }
  }

  // 2. Process details string (e.g. "Vvegetarian, Halaal, Nut" or "Carries EpiPen")
  if (details && details.trim()) {
    // Split by comma, semicolon, dash, or newline
    const segments = details.split(/[,;\n—]+/).map(s => s.trim()).filter(Boolean);

    for (const seg of segments) {
      const lower = seg.toLowerCase();
      // Match against known keywords
      const found = DIETARY_OPTIONS.find(opt =>
        opt.keywords.some(kw => {
          if (lower === kw) return true;
          // word boundary or standalone
          const regex = new RegExp(`(^|\\b|[^a-z])${kw}(\\b|[^a-z]|$)`, 'i');
          return regex.test(lower);
        })
      );

      if (found) {
        matchedTagMap.set(found.id, found);
      } else {
        // If segment is not a standard tag, keep as custom note
        // Avoid duplicate notes or meaningless "none"
        if (lower !== 'none' && lower !== 'no' && lower !== 'n/a') {
          customNotesList.push(seg);
        }
      }
    }
  }

  return {
    tags: Array.from(matchedTagMap.values()),
    notes: customNotesList.length > 0 ? customNotesList.join(', ') : undefined,
  };
}
