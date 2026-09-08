import { useEffect, useState } from 'react';
import { ArrowDown, CalendarDays, MapPin } from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';
import { formatWeddingDate, parseWeddingDate } from '../utils/dates';
import { PrintInvitationModal } from './PrintInvitationModal';

interface HeroProps {
  onNavigate: (section: SectionId) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  const { site, activeHousehold, lookupInvitation } = useGuestExperience();
  const weddingDate = parseWeddingDate(site.weddingDate);
  const [pageLoadTime] = useState(() => Date.now());
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const daysRemaining = weddingDate && !site.dateIsTbc
    ? Math.max(0, Math.ceil((weddingDate.getTime() - pageLoadTime) / 86_400_000))
    : null;
  const formattedDate = site.dateIsTbc ? 'Date to be confirmed' : formatWeddingDate(site.weddingDate);

  // Auto-detect invite code from URL query (e.g. ?code=Anr-658 or ?invite=Anr-658)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code') || params.get('invite') || params.get('token');
    if (codeParam && !activeHousehold) {
      const clean = codeParam.trim();
      void lookupInvitation(clean).then(found => {
        if (found) {
          setIsCardModalOpen(true);
        }
      });
    }
  }, [activeHousehold, lookupInvitation]);

  return (
    <section id="home" className="anchor-section relative z-10 min-h-screen min-h-[100svh] overflow-hidden bg-[#1a1c18] pt-[76px] text-white flex flex-col justify-center">
      <img
        src={`${import.meta.env.BASE_URL}images/hero-arendsrus.jpg`}
        alt="ArendsRus Country Lodge in George"
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />
      {/* Natural cinematic left shadow to make typography crystal clear while fountain & garden stay bright */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,20,16,0.82)_0%,rgba(18,20,16,0.58)_36%,rgba(18,20,16,0.12)_68%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(16,18,14,0.45)_0%,transparent_32%)]" />

      <div className="relative mx-auto flex w-full min-h-[calc(100svh-76px)] max-w-[1440px] items-center px-5 py-14 sm:px-8 lg:px-14">
        <div className="max-w-2xl">
          <p className="hero-enter mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#fce4ec]">
            <span className="h-px w-10 bg-[#f8b4c4]" />
            We’re getting married
          </p>
          <h1 className="hero-enter hero-enter-delay font-display text-[clamp(4.2rem,11vw,9.5rem)] font-medium leading-[0.74] tracking-[-0.055em] text-[#fffdf8] drop-shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
            {site.groomName}
            <span className="mx-[0.08em] inline-block font-script text-[0.54em] font-normal tracking-normal text-[#f8b4c4]">&amp;</span>
            {site.brideName}
          </h1>

          <div className="hero-enter hero-enter-delay-2 mt-8 grid max-w-xl gap-5 border-y border-white/25 py-5 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-[#f8b4c4] backdrop-blur-xs">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#f8b4c4]">The date</span>
                <time dateTime={site.dateIsTbc ? undefined : site.weddingDate.slice(0, 10)} className="mt-0.5 block font-display text-xl font-medium text-white">{formattedDate}</time>
                <span className="mt-0.5 block text-xs text-white/75">{site.ceremonyIsTbc || !site.ceremonyTime ? 'Ceremony time to be confirmed' : site.ceremonyTime}</span>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-[#e4f0c9] backdrop-blur-xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#e4f0c9]">The place</span>
                <span className="mt-0.5 block font-display text-xl font-medium text-white">{site.venueName}</span>
                <span className="mt-0.5 block text-xs text-white/75">George, Western Cape</span>
              </div>
            </div>
          </div>

          <div className="hero-enter hero-enter-delay-3 mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('rsvp')}
              className="button-primary min-h-12 px-7 shadow-lg"
            >
              {activeHousehold ? 'Review your RSVP' : 'Find your invitation'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('details')}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-xs hover:border-white/60 hover:bg-white/20 transition"
            >
              Explore the venue
              <ArrowDown className="h-4 w-4 text-[#f8b4c4] transition-transform group-hover:translate-y-1" />
            </button>
          </div>
        </div>

        {daysRemaining !== null && <div className="absolute bottom-8 right-6 hidden text-right text-white/90 md:block lg:right-14 drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
          <span className="block font-display text-5xl font-medium leading-none text-white">{daysRemaining}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">days to go</span>
        </div>}
      </div>

      {activeHousehold && (
        <PrintInvitationModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          household={{
            id: activeHousehold.id,
            name: activeHousehold.name,
            inviteCode: activeHousehold.inviteCode,
            email: activeHousehold.email,
            phone: activeHousehold.phone,
          }}
          invitationType="official"
        />
      )}
    </section>
  );
}
