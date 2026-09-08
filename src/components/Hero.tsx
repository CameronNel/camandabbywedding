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
    <section id="home" className="anchor-section relative z-10 min-h-screen min-h-[100svh] overflow-hidden bg-[#faf3f5] pt-[76px] text-stone-800 flex flex-col justify-center">
      <img
        src={`${import.meta.env.BASE_URL}images/hero-arendsrus.jpg`}
        alt="ArendsRus Country Lodge in George"
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />
      {/* Warm romantic pastel sunrise scrim that preserves the lush garden photo */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,243,245,0.85)_0%,rgba(253,246,242,0.68)_45%,rgba(255,250,247,0.18)_75%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(250,238,242,0.55)_0%,transparent_40%)]" />

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

          <div className="hero-enter hero-enter-delay-2 mt-10 grid max-w-2xl gap-5 rounded-2xl border-2 border-[#eed5dc] bg-white/80 p-6 backdrop-blur-md shadow-[0_12px_32px_rgba(201,122,139,0.08)] sm:grid-cols-2">
            <div className="flex items-start gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fdeef2] text-[#b85b73] shadow-xs">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a384b]">The date</span>
                <time dateTime={site.dateIsTbc ? undefined : site.weddingDate.slice(0, 10)} className="mt-1 block font-display text-xl font-bold text-stone-900">{formattedDate}</time>
                <span className="mt-0.5 block text-xs font-medium text-stone-600">{site.ceremonyIsTbc || !site.ceremonyTime ? 'Ceremony time to be confirmed' : site.ceremonyTime}</span>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf5e6] text-[#4a6b2c] shadow-xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#4a6b2c]">The place</span>
                <span className="mt-1 block font-display text-xl font-bold text-stone-900">{site.venueName}</span>
                <span className="mt-0.5 block text-xs font-medium text-stone-600">George, Western Cape</span>
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
