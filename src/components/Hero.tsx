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
    <section id="home" className="anchor-section relative z-10 min-h-screen min-h-[100svh] overflow-hidden bg-[#fdfbfb] pt-[76px] text-stone-800 flex flex-col justify-center">
      <img
        src={`${import.meta.env.BASE_URL}images/hero-arendsrus.jpg`}
        alt="ArendsRus Country Lodge in George"
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(253,251,251,0.93)_0%,rgba(253,251,251,0.86)_42%,rgba(253,251,251,0.38)_75%,rgba(253,251,251,0.12)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(253,245,248,0.7)_0%,transparent_35%)]" />

      <div className="relative mx-auto flex w-full min-h-[calc(100svh-76px)] max-w-[1440px] items-center px-5 py-16 sm:px-8 lg:px-14">
        <div className="max-w-3xl">
          <p className="hero-enter mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#8a384b]">
            <span className="h-px w-10 bg-[#e597a8]" />
            We’re getting married
          </p>
          <h1 className="hero-enter hero-enter-delay font-display text-[clamp(4.6rem,12vw,10.5rem)] font-medium leading-[0.72] tracking-[-0.055em] text-stone-900">
            {site.groomName}
            <span className="mx-[0.08em] inline-block font-script text-[0.54em] font-normal tracking-normal text-[#c97a8b]">&amp;</span>
            {site.brideName}
          </h1>

          <div className="hero-enter hero-enter-delay-2 mt-10 grid max-w-2xl gap-5 border-y border-[#f0d5de] py-6 text-sm text-stone-700 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#c97a8b]" />
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">The date</span>
                <time dateTime={site.dateIsTbc ? undefined : site.weddingDate.slice(0, 10)} className="mt-1 block font-display text-xl font-semibold text-stone-900">{formattedDate}</time>
                <span className="mt-0.5 block text-xs text-stone-500">{site.ceremonyIsTbc || !site.ceremonyTime ? 'Ceremony time to be confirmed' : site.ceremonyTime}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#c97a8b]" />
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">The place</span>
                <span className="mt-1 block font-display text-xl font-semibold text-stone-900">{site.venueName}</span>
                <span className="mt-0.5 block text-xs text-stone-500">George, Western Cape</span>
              </div>
            </div>
          </div>

          <div className="hero-enter hero-enter-delay-3 mt-8 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => onNavigate('rsvp')} className="button-primary min-h-12 px-7">
              {activeHousehold ? 'Review your RSVP' : 'Open your invitation'}
            </button>
            <button type="button" onClick={() => onNavigate('details')} className="button-secondary min-h-12 px-6">
              Explore the venue
              <ArrowDown className="h-4 w-4 text-[#c97a8b] transition-transform group-hover:translate-y-1" />
            </button>
          </div>
        </div>

        {daysRemaining !== null && <div className="absolute bottom-8 right-6 hidden text-right text-stone-800 md:block lg:right-14">
          <span className="block font-display text-5xl font-medium leading-none text-stone-900">{daysRemaining}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400">days to go</span>
        </div>}
      </div>
    </section>
  );
}
