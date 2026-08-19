import { LockKeyhole, MapPin } from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';
import { formatWeddingDate, parseWeddingDate } from '../utils/dates';

interface FooterProps {
  onNavigate: (section: SectionId) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { site, openAdmin } = useGuestExperience();
  const parsedDate = parseWeddingDate(site.weddingDate);
  const date = site.dateIsTbc ? 'Date to be confirmed' : formatWeddingDate(site.weddingDate, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <footer className="bg-[#242722] px-5 py-14 text-white sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-display text-4xl font-semibold tracking-tight">{site.groomName} <span className="font-script font-normal text-[#d9c8b4]">&amp;</span> {site.brideName}</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-white/[0.55]"><MapPin className="h-3.5 w-3.5" /> {site.venueName}, George · {date}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/60" aria-label="Footer navigation">
            <button type="button" onClick={() => onNavigate('rsvp')} className="hover:text-white">RSVP</button>
            <button type="button" onClick={() => onNavigate('details')} className="hover:text-white">Venue &amp; stay</button>
            <button type="button" onClick={() => onNavigate('gallery')} className="hover:text-white">Gallery</button>
            <button type="button" onClick={() => onNavigate('gifts')} className="hover:text-white">Gifts</button>
          </nav>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {parsedDate?.getFullYear() ?? new Date().getFullYear()} {site.groomName} &amp; {site.brideName}</p>
          <button type="button" onClick={openAdmin} className="inline-flex min-h-10 items-center gap-2 self-start rounded-full px-2 transition-colors hover:text-white sm:self-auto" aria-label="Open organizer portal">
            <LockKeyhole className="h-3.5 w-3.5" /> Organizer portal
          </button>
        </div>
      </div>
    </footer>
  );
}
