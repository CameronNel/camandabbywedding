import { LockKeyhole, MapPin } from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';
import { formatWeddingDate, parseWeddingDate } from '../utils/dates';
import { TulipGardenRow } from './decorations/TulipAccents';

interface FooterProps {
  onNavigate: (section: SectionId) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { site, openAdmin } = useGuestExperience();
  const parsedDate = parseWeddingDate(site.weddingDate);
  const date = site.dateIsTbc ? 'Date to be confirmed' : formatWeddingDate(site.weddingDate, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <footer className="relative z-10 border-t-2 border-[#e6bdcc] bg-gradient-to-b from-[#faf0f4] via-[#f5dfe7] to-[#edd0dc] px-5 py-14 text-[#4a2e37] sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 flex justify-center opacity-95">
          <TulipGardenRow />
        </div>
        <div className="grid gap-10 border-b border-[#dfb0c2] pb-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-display text-4xl font-semibold tracking-tight text-[#3b1f28]">
              {site.groomName} <span className="font-script font-normal text-[#b85b73]">&amp;</span> {site.brideName}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#744857]">
              <MapPin className="h-3.5 w-3.5 text-[#b85b73]" /> {site.venueName}, George · {date}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-[0.14em] text-[#693e4e]" aria-label="Footer navigation">
            <button type="button" onClick={() => onNavigate('rsvp')} className="transition-colors hover:text-[#9e3352]">RSVP</button>
            <button type="button" onClick={() => onNavigate('details')} className="transition-colors hover:text-[#9e3352]">Venue &amp; stay</button>
            <button type="button" onClick={() => onNavigate('gallery')} className="transition-colors hover:text-[#9e3352]">Gallery</button>
            <button type="button" onClick={() => onNavigate('gifts')} className="transition-colors hover:text-[#9e3352]">Gifts</button>
          </nav>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-[11px] font-medium text-[#7a4e5d] sm:flex-row sm:items-center sm:justify-between">
          <p>© {parsedDate?.getFullYear() ?? new Date().getFullYear()} {site.groomName} &amp; {site.brideName}</p>
          <button
            type="button"
            onClick={openAdmin}
            className="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-[#dcaec0] bg-white/85 px-3.5 py-1 text-[#693e4e] font-semibold shadow-2xs transition-colors hover:border-[#b85b73] hover:bg-white hover:text-[#9e3352] sm:self-auto"
            aria-label="Open organizer portal"
          >
            <LockKeyhole className="h-3.5 w-3.5 text-[#b85b73]" /> Organizer portal
          </button>
        </div>
      </div>
    </footer>
  );
}
