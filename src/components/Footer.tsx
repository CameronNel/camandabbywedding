import { LockKeyhole, MapPin } from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';
import { formatWeddingDate, parseWeddingDate } from '../utils/dates';
import { TulipGardenRow } from './decorations/TulipAccents';

interface FooterProps {
  onNavigate: (section: SectionId) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { site, openAdmin, isUnlocked } = useGuestExperience();
  const parsedDate = parseWeddingDate(site.weddingDate);
  const date = isUnlocked
    ? site.dateIsTbc
      ? 'Date to be confirmed'
      : formatWeddingDate(site.weddingDate, { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Private Celebration';

  return (
    <footer className="relative z-10 border-t border-[#e8e2dc] bg-gradient-to-b from-[#faf8f5] via-[#f5f1eb] to-[#eee8e0] px-5 py-14 text-[#4a423d] sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 flex justify-center opacity-95">
          <TulipGardenRow />
        </div>
        <div className="grid gap-10 border-b border-[#e5ded7] pb-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-display text-4xl font-semibold tracking-tight text-[#2b2624]">
              {site.groomName} <span className="font-script font-normal text-[#c97a8b]">&amp;</span> {site.brideName}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#6b625b]">
              <MapPin className="h-3.5 w-3.5 text-[#c97a8b]" /> {site.venueName}, George · {date}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-[0.14em] text-[#544c46]" aria-label="Footer navigation">
            <button type="button" onClick={() => onNavigate('rsvp')} className="transition-colors hover:text-[#b85b73]">RSVP</button>
            <button type="button" onClick={() => onNavigate('details')} className="transition-colors hover:text-[#b85b73]">Venue &amp; stay</button>
            <button type="button" onClick={() => onNavigate('gallery')} className="transition-colors hover:text-[#b85b73]">Gallery</button>
            <button type="button" onClick={() => onNavigate('gifts')} className="transition-colors hover:text-[#b85b73]">Gifts</button>
          </nav>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-[11px] font-medium text-[#786e66] sm:flex-row sm:items-center sm:justify-between">
          <p>© {parsedDate?.getFullYear() ?? new Date().getFullYear()} {site.groomName} &amp; {site.brideName}</p>
          <button
            type="button"
            onClick={openAdmin}
            className="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-[#dad2c9] bg-white/95 px-3.5 py-1 text-[#4a423d] font-semibold shadow-2xs transition-colors hover:border-[#c97a8b] hover:bg-white hover:text-[#2b2624] sm:self-auto"
            aria-label="Open organizer portal"
          >
            <LockKeyhole className="h-3.5 w-3.5 text-[#c97a8b]" /> Organizer portal
          </button>
        </div>
      </div>
    </footer>
  );
}
