export interface RoleTagDef {
  id: string;
  label: string;
  category: 'wedding_party' | 'family' | 'honored' | 'access';
  icon: string;
  bg: string;
  text: string;
  border: string;
  activeBg: string;
  description?: string;
}

export const WEDDING_ROLE_TAGS: RoleTagDef[] = [
  {
    id: 'maid_of_honor',
    label: 'Maid of Honor',
    category: 'wedding_party',
    icon: '💐',
    bg: 'bg-[#fdf2f4]',
    text: 'text-[#9c2743]',
    border: 'border-[#e4aeb5]',
    activeBg: 'bg-[#e4aeb5] text-white border-[#d88794]',
    description: 'Chief bridesmaid & bride’s honor attendant',
  },
  {
    id: 'bridesmaid',
    label: 'Bridesmaid',
    category: 'wedding_party',
    icon: '🌸',
    bg: 'bg-[#fdf5f7]',
    text: 'text-[#8a2947]',
    border: 'border-[#e4aeb5]/70',
    activeBg: 'bg-[#e4aeb5] text-white border-[#d88794]',
    description: 'Member of the bridal party',
  },
  {
    id: 'best_man',
    label: 'Best Man',
    category: 'wedding_party',
    icon: '👑',
    bg: 'bg-[#fef6f0]',
    text: 'text-[#9c4c28]',
    border: 'border-[#f5d0c6]',
    activeBg: 'bg-[#e7af9e] text-white border-[#d89c89]',
    description: 'Groom’s chief attendant & guardian of the rings',
  },
  {
    id: 'groomsman',
    label: 'Groomsman',
    category: 'wedding_party',
    icon: '🤵',
    bg: 'bg-[#edf6f1]',
    text: 'text-[#255239]',
    border: 'border-[#9bbeab]/60',
    activeBg: 'bg-[#9bbeab] text-white border-[#87ab97]',
    description: 'Member of the groom’s party',
  },
  {
    id: 'master_of_ceremonies',
    label: 'Master of Ceremonies',
    category: 'honored',
    icon: '🎤',
    bg: 'bg-[#faf5ff]',
    text: 'text-[#6b21a8]',
    border: 'border-[#d8b4fe]',
    activeBg: 'bg-[#9333ea] text-white border-[#7e22ce]',
    description: 'MC directing celebration announcements & flow',
  },
  {
    id: 'flower_girl',
    label: 'Flower Girl',
    category: 'wedding_party',
    icon: '🌺',
    bg: 'bg-[#fff1f2]',
    text: 'text-[#be123c]',
    border: 'border-[#fecdd3]',
    activeBg: 'bg-[#fb7185] text-white border-[#f43f5e]',
    description: 'Aisle flower presenter',
  },
  {
    id: 'ring_bearer',
    label: 'Ring Bearer',
    category: 'wedding_party',
    icon: '💍',
    bg: 'bg-[#eff6ff]',
    text: 'text-[#1d4ed8]',
    border: 'border-[#bfdbfe]',
    activeBg: 'bg-[#3b82f6] text-white border-[#2563eb]',
    description: 'Wedding ring presenter',
  },
  {
    id: 'mother_of_bride',
    label: 'Mother of the Bride',
    category: 'family',
    icon: '🤍',
    bg: 'bg-[#fdf4f5]',
    text: 'text-[#7d2038]',
    border: 'border-[#f3c2cd]',
    activeBg: 'bg-[#d88794] text-white border-[#c7727f]',
    description: 'Honored parent of the bride',
  },
  {
    id: 'father_of_bride',
    label: 'Father of the Bride',
    category: 'family',
    icon: '🤍',
    bg: 'bg-[#fdf4f5]',
    text: 'text-[#7d2038]',
    border: 'border-[#f3c2cd]',
    activeBg: 'bg-[#d88794] text-white border-[#c7727f]',
    description: 'Honored parent of the bride',
  },
  {
    id: 'mother_of_groom',
    label: 'Mother of the Groom',
    category: 'family',
    icon: '🤍',
    bg: 'bg-[#f0fdf4]',
    text: 'text-[#166534]',
    border: 'border-[#bbf7d0]',
    activeBg: 'bg-[#22c55e] text-white border-[#16a34a]',
    description: 'Honored parent of the groom',
  },
  {
    id: 'father_of_groom',
    label: 'Father of the Groom',
    category: 'family',
    icon: '🤍',
    bg: 'bg-[#f0fdf4]',
    text: 'text-[#166534]',
    border: 'border-[#bbf7d0]',
    activeBg: 'bg-[#22c55e] text-white border-[#16a34a]',
    description: 'Honored parent of the groom',
  },
  {
    id: 'officiant',
    label: 'Officiant',
    category: 'honored',
    icon: '🕊️',
    bg: 'bg-[#f8fafc]',
    text: 'text-[#334155]',
    border: 'border-[#cbd5e1]',
    activeBg: 'bg-[#475569] text-white border-[#334155]',
    description: 'Conducts the wedding ceremony',
  },
  {
    id: 'vip',
    label: 'VIP Guest',
    category: 'honored',
    icon: '⭐',
    bg: 'bg-[#fefce8]',
    text: 'text-[#854d0e]',
    border: 'border-[#fef08a]',
    activeBg: 'bg-[#eab308] text-white border-[#ca8a04]',
    description: 'Specially honored guest',
  },
];

export const ACCESS_TAG_DEFS: RoleTagDef[] = [
  {
    id: 'free_venue_housing',
    label: 'Venue Stay Provided',
    category: 'access',
    icon: '🏡',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    activeBg: 'bg-[#5c7a59] text-white border-[#4d694a]',
    description: 'Shows only the provided on-site stay; hides paid accommodation alternatives.',
  },
  {
    id: 'presence_is_our_gift',
    label: 'Presence Is The Gift',
    category: 'access',
    icon: '🎁',
    bg: 'bg-pink-50',
    text: 'text-[#8a2947]',
    border: 'border-pink-200',
    activeBg: 'bg-[#8a2947] text-white border-[#701c35]',
    description: 'Replaces the registry with the couple’s personal no-gift message.',
  },
];

export function getTagMeta(tagId: string): RoleTagDef {
  const foundRole = WEDDING_ROLE_TAGS.find(t => t.id === tagId);
  if (foundRole) return foundRole;

  const foundAccess = ACCESS_TAG_DEFS.find(t => t.id === tagId);
  if (foundAccess) return foundAccess;

  // Custom fallback
  const cleanLabel = tagId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

  return {
    id: tagId,
    label: cleanLabel,
    category: 'honored',
    icon: '🏷️',
    bg: 'bg-stone-50',
    text: 'text-stone-700',
    border: 'border-stone-200',
    activeBg: 'bg-stone-700 text-white border-stone-800',
  };
}

export function isWeddingRoleTag(tagId: string): boolean {
  return WEDDING_ROLE_TAGS.some(t => t.id === tagId);
}

export function isBestManOrGroomsmanTag(tagId: string): boolean {
  const norm = (tagId || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return norm === 'best_man' || norm === 'groomsman';
}

export function isBestManOrGroomsmanHousehold(
  household: { tags?: string[]; members?: Array<{ role?: string }> } | null | undefined,
): boolean {
  if (!household) return false;
  const hasTag = (household.tags || []).some(isBestManOrGroomsmanTag);
  const hasMemberRole = (household.members || []).some(m => Boolean(m.role && isBestManOrGroomsmanTag(m.role)));
  return hasTag || hasMemberRole;
}

export function isMaidOfHonorOrBridesmaidTag(tagId: string): boolean {
  const norm = (tagId || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return norm === 'maid_of_honor' || norm === 'bridesmaid';
}

export function isMaidOfHonorOrBridesmaidHousehold(
  household: { tags?: string[]; members?: Array<{ role?: string }> } | null | undefined,
): boolean {
  if (!household) return false;
  const hasTag = (household.tags || []).some(isMaidOfHonorOrBridesmaidTag);
  const hasMemberRole = (household.members || []).some(m => Boolean(m.role && isMaidOfHonorOrBridesmaidTag(m.role)));
  return hasTag || hasMemberRole;
}

