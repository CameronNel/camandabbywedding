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
    <footer className="relative z-10 border-t-2 border-[#9BBEAB]/60 bg-gradient-to-b from-[#f4f8f5] via-[#e6efe9] to-[#d8e7de] px-5 py-14 text-[#284837] sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 flex justify-center opacity-95">
          <TulipGardenRow />
        </div>
        <div className="grid gap-10 border-b border-[#9BBEAB]/40 pb-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-display text-4xl font-semibold tracking-tight text-[#1b3829]">
              {site.groomName} <span className="font-script font-normal text-[#5d826e]">&amp;</span> {site.brideName}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#416250]">
              <MapPin className="h-3.5 w-3.5 text-[#5d826e]" /> {site.venueName}, George · {date}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-[0.14em] text-[#2d503d]" aria-label="Footer navigation">
            <button type="button" onClick={() => onNavigate('rsvp')} className="transition-colors hover:text-[#183325]">RSVP</button>
            <button type="button" onClick={() => onNavigate('details')} className="transition-colors hover:text-[#183325]">Venue &amp; stay</button>
            <button type="button" onClick={() => onNavigate('gallery')} className="transition-colors hover:text-[#183325]">Gallery</button>
            <button type="button" onClick={() => onNavigate('gifts')} className="transition-colors hover:text-[#183325]">Gifts</button>
          </nav>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-[11px] font-medium text-[#4d6f5d] sm:flex-row sm:items-center sm:justify-between">
          <p>© {parsedDate?.getFullYear() ?? new Date().getFullYear()} {site.groomName} &amp; {site.brideName}</p>
          <button
            type="button"
            onClick={openAdmin}
            className="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-[#9BBEAB] bg-white/90 px-3.5 py-1 text-[#2d503d] font-semibold shadow-2xs transition-colors hover:border-[#5d826e] hover:bg-white hover:text-[#183325] sm:self-auto"
            aria-label="Open organizer portal"
          >
            <LockKeyhole className="h-3.5 w-3.5 text-[#5d826e]" /> Organizer portal
          </button>
        </div>
      </div>
    </footer>
  );
}
