import { useState } from 'react';
import { ArrowDown, CalendarDays, MapPin } from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';
import { formatWeddingDate, parseWeddingDate } from '../utils/dates';

interface HeroProps {
  onNavigate: (section: SectionId) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  const { site, activeHousehold } = useGuestExperience();
  const weddingDate = parseWeddingDate(site.weddingDate);
  const [pageLoadTime] = useState(() => Date.now());
  const daysRemaining = weddingDate && !site.dateIsTbc
    ? Math.max(0, Math.ceil((weddingDate.getTime() - pageLoadTime) / 86_400_000))
    : null;
  const formattedDate = site.dateIsTbc ? 'Date to be confirmed' : formatWeddingDate(site.weddingDate);

  return (
    <section id="home" className="anchor-section relative min-h-[min(900px,100svh)] overflow-hidden bg-[#272722] pt-[76px] text-white">
      <img
        src={`${import.meta.env.BASE_URL}images/hero-arendsrus.jpg`}
        alt="ArendsRus Country Lodge in George"
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,25,21,.88)_0%,rgba(24,25,21,.67)_42%,rgba(24,25,21,.2)_78%,rgba(24,25,21,.35)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(20,21,18,.52)_0%,transparent_45%)]" />

      <div className="relative mx-auto flex min-h-[calc(min(900px,100svh)-76px)] max-w-[1440px] items-center px-5 py-16 sm:px-8 lg:px-14">
        <div className="max-w-3xl">
          <p className="hero-enter mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#e5d7c7]">
            <span className="h-px w-10 bg-[#d7c2aa]" />
            We’re getting married
          </p>
          <h1 className="hero-enter hero-enter-delay font-display text-[clamp(4.6rem,12vw,10.5rem)] font-medium leading-[0.72] tracking-[-0.055em] text-[#fffdf8]">
            {site.groomName}
            <span className="mx-[0.08em] inline-block font-script text-[0.54em] font-normal tracking-normal text-[#e8c5b2]">&amp;</span>
            {site.brideName}
          </h1>

          <div className="hero-enter hero-enter-delay-2 mt-10 grid max-w-2xl gap-5 border-y border-white/20 py-6 text-sm text-white/[0.86] sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#e8c5b2]" />
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/[0.55]">The date</span>
                <time dateTime={site.dateIsTbc ? undefined : site.weddingDate.slice(0, 10)} className="mt-1 block font-display text-xl">{formattedDate}</time>
                <span className="mt-0.5 block text-xs text-white/60">{site.ceremonyIsTbc || !site.ceremonyTime ? 'Ceremony time to be confirmed' : site.ceremonyTime}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#e8c5b2]" />
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/[0.55]">The place</span>
                <span className="mt-1 block font-display text-xl">{site.venueName}</span>
                <span className="mt-0.5 block text-xs text-white/60">George, Western Cape</span>
              </div>
            </div>
          </div>

          <div className="hero-enter hero-enter-delay-3 mt-8 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => onNavigate('rsvp')} className="button-light min-h-12 px-7">
              {activeHousehold ? 'Review your RSVP' : 'Open your invitation'}
            </button>
            <button type="button" onClick={() => onNavigate('details')} className="group inline-flex min-h-12 items-center gap-2 px-3 text-sm font-semibold text-white/80 transition-colors hover:text-white">
              Explore the venue
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
            </button>
          </div>
        </div>

        {daysRemaining !== null && <div className="absolute bottom-8 right-6 hidden text-right text-white/80 md:block lg:right-14">
          <span className="block font-display text-5xl leading-none">{daysRemaining}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/[0.55]">days to go</span>
        </div>}
      </div>
    </section>
  );
}
