import type { HouseholdDraft } from '../types/wedding';

export const RAW_CAM_ABBY_GUEST_LIST = `Janke\t+1
Brumilda\t+1
René Ferreira\t
+1\tRoy
+1\tCorné
+1\tEthan
\tNeil Ferreira
Tannie Marilize\tOom James
Tannie Linda\tOom Fred
Tannie Elna\tOom Gerald
Tannie Irene\tOom Koos
Tannie Charolette\tOom Nico
Tannie Donna\tOom Danie
+1\tJoshua
\tMichal
+1\tFrancois-André
Lu-Anne\tChristian
Tannie Ilse\tOupa André
Ouma Lizzy\t
Monique\tMarnus
Tannie Jeanette\tOom Leslie
Tannie Jacolene\tOom Hans
+1\tFrancois Nel
Tannie Alida\t
Tannie Liz\tOom André
\tMynhard
+1\tPieter
+1\tQuan
Tiana\tGeorge
+1\tReynhadt
Meyan\tOlof
Shané\t+1
Nicci Stander\t+1
Tannie Jackie\t+1
Abby Mamma\tAbby Pappa
Cam Mamma\t+1
+1\tCam Pappa
+1\tWalter`;

const BRIDAL_PARTY_NAMES = new Set(['janke', 'brumilda', 'rené ferreira', 'rene ferreira']);
const GROOMSMEN_NAMES = new Set(['roy', 'corné', 'corne', 'ethan', 'neil ferreira']);

export function parseGuestListText(rawText: string): HouseholdDraft[] {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results: HouseholdDraft[] = [];

  for (const line of lines) {
    // Split by tab or comma
    const parts = line.includes('\t')
      ? line.split('\t').map(p => p.trim())
      : line.split(',').map(p => p.trim());

    const col1 = parts[0] || '';
    const col2 = parts[1] || '';

    let isPlusOne = false;
    let primaryName = '';
    let secondaryName = '';

    const isCol1PlusOne = col1.toLowerCase() === '+1' || col1.toLowerCase() === '+ 1';
    const isCol2PlusOne = col2.toLowerCase() === '+1' || col2.toLowerCase() === '+ 1';

    if (isCol1PlusOne && col2) {
      isPlusOne = true;
      primaryName = col2;
    } else if (isCol2PlusOne && col1) {
      isPlusOne = true;
      primaryName = col1;
    } else if (col1 && col2) {
      primaryName = col1;
      secondaryName = col2;
    } else if (col1 && !col2) {
      primaryName = col1;
    } else if (!col1 && col2) {
      primaryName = col2;
    }

    if (!primaryName) continue;

    const lowerPrimary = primaryName.toLowerCase();
    const tags: string[] = [];

    if (BRIDAL_PARTY_NAMES.has(lowerPrimary)) {
      tags.push('bridal_party');
    } else if (GROOMSMEN_NAMES.has(lowerPrimary)) {
      tags.push('groomsmen');
    } else if (
      lowerPrimary.startsWith('tannie') ||
      lowerPrimary.startsWith('oom') ||
      lowerPrimary.startsWith('oupa') ||
      lowerPrimary.startsWith('ouma') ||
      lowerPrimary.includes('mamma') ||
      lowerPrimary.includes('pappa') ||
      lowerPrimary.includes('nel') ||
      lowerPrimary === 'walter'
    ) {
      tags.push('family');
    }

    if (secondaryName) {
      results.push({
        name: `${primaryName} & ${secondaryName}`,
        partySize: 2,
        isPlusOneAllowed: false,
        tags,
        members: [
          { name: primaryName, isPrimary: true },
          { name: secondaryName, isPrimary: false },
        ],
      });
    } else if (isPlusOne) {
      results.push({
        name: primaryName,
        partySize: 2,
        isPlusOneAllowed: true,
        tags,
        members: [{ name: primaryName, isPrimary: true }],
      });
    } else {
      results.push({
        name: primaryName,
        partySize: 1,
        isPlusOneAllowed: false,
        tags,
        members: [{ name: primaryName, isPrimary: true }],
      });
    }
  }

  return results;
}
