import { useEffect, useState } from 'react';
import { ArrowDown, CalendarDays, CalendarHeart, Loader2, MapPin, Sparkles } from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';
import { formatWeddingDate, parseWeddingDate } from '../utils/dates';
import { formatInviteCodeDisplay } from '../utils/storage';
import { PrintInvitationModal } from './PrintInvitationModal';

interface HeroProps {
  onNavigate: (section: SectionId) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  const { site, activeHousehold, lookupInvitation, clearInvitation } = useGuestExperience();
  const weddingDate = parseWeddingDate(site.weddingDate);
  const [pageLoadTime] = useState(() => Date.now());
  const [inputCode, setInputCode] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || params.get('invite') || params.get('token') || '';
  });
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (!clean) {
      setLookupError('Please enter your invitation code (e.g. Anr-658)');
      return;
    }

    setIsLookingUp(true);
    setLookupError('');
    try {
      const found = await lookupInvitation(clean);
      if (found) {
        setIsCardModalOpen(true);
      } else {
        setLookupError(`No invitation found for "${clean}". Please check your card code (e.g. Anr-658).`);
      }
    } catch {
      setLookupError('Unable to look up invitation right now. Please try again.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleQuickTest = (code: string) => {
    setInputCode(code);
    setLookupError('');
    setIsLookingUp(true);
    void lookupInvitation(code).then(found => {
      setIsLookingUp(false);
      if (found) {
        setIsCardModalOpen(true);
      }
    }).catch(() => {
      setIsLookingUp(false);
    });
  };

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

          {/* Guest Custom Invite Box on Home Page */}
          {activeHousehold ? (
            <div className="hero-enter hero-enter-delay-3 mt-7 max-w-xl rounded-2xl border border-white/30 bg-black/45 p-4 sm:p-5 backdrop-blur-md shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#f8b4c4]">
                    <Sparkles className="h-3 w-3 text-[#f8b4c4]" />
                    Your Personal Invitation
                  </span>
                  <h2 className="mt-0.5 font-display text-2xl font-medium text-white">
                    Welcome, {activeHousehold.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-300">
                    Invite Code: <span className="font-mono font-bold text-white bg-white/20 px-2 py-0.5 rounded-md">{formatInviteCodeDisplay(activeHousehold.inviteCode, activeHousehold.name)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearInvitation}
                  className="text-[11px] font-medium text-stone-300 hover:text-white underline underline-offset-4 transition"
                  title="Switch to another invitation code"
                >
                  Change code
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(true)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#f8b4c4] to-[#ea93a7] px-6 text-xs font-bold text-[#4a1220] shadow-lg hover:from-[#fad0da] hover:to-[#f8b4c4] transition transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CalendarHeart className="h-4 w-4" />
                  View Custom Invitation Card
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('rsvp')}
                  className="button-primary min-h-11 px-5 text-xs font-bold shadow-md"
                >
                  Review / Update RSVP
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('details')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 text-xs font-semibold text-white backdrop-blur-xs hover:border-white/60 hover:bg-white/20 transition"
                >
                  Venue Info
                </button>
              </div>
            </div>
          ) : (
            <div className="hero-enter hero-enter-delay-3 mt-7 max-w-xl">
              <div className="rounded-2xl border border-white/20 bg-black/40 p-4 sm:p-5 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#fce4ec]">
                  <Sparkles className="h-3.5 w-3.5 text-[#f8b4c4]" />
                  Unlock Your Custom Invitation
                </div>
                <p className="mt-1 text-xs text-white/80">
                  Enter your private invite code to view your personalized card and RSVP.
                </p>

                <form onSubmit={handleUnlock} className="mt-3.5 flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={e => { setInputCode(e.target.value); setLookupError(''); }}
                      placeholder="e.g. Anr-658"
                      className="w-full rounded-xl border border-white/30 bg-white/95 px-4 py-2.5 text-sm font-mono font-bold uppercase tracking-wider text-stone-900 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-stone-400 focus:border-[#f8b4c4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f8b4c4]"
                      spellCheck={false}
                      autoComplete="one-time-code"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLookingUp}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f8b4c4] to-[#ea93a7] px-5 text-xs font-bold text-[#4a1220] shadow-md hover:from-[#fad0da] hover:to-[#f8b4c4] disabled:opacity-60 transition transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarHeart className="h-4 w-4" />}
                    Open Custom Invite
                  </button>
                </form>

                {lookupError && (
                  <p className="mt-2 text-xs text-rose-300 font-medium">{lookupError}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10 text-[11px] text-white/70">
                  <span>Sample codes:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('Anr-658')}
                    className="rounded-full bg-white/10 border border-white/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#f8b4c4] hover:bg-white/20 transition"
                  >
                    Anr-658 (Anri &amp; Henk)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTest('Cam-101')}
                    className="rounded-full bg-white/10 border border-white/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#c9e8d4] hover:bg-white/20 transition"
                  >
                    Cam-101 (Cam &amp; Abby)
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => onNavigate('rsvp')} className="button-primary min-h-11 px-6 text-xs shadow-md">
                  Go to RSVP
                </button>
                <button type="button" onClick={() => onNavigate('details')} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 bg-white/15 px-6 text-xs font-semibold text-white backdrop-blur-sm shadow-md transition-colors hover:border-white hover:bg-white/25">
                  Explore the venue
                  <ArrowDown className="h-4 w-4 text-[#f8b4c4] transition-transform group-hover:translate-y-1" />
                </button>
              </div>
            </div>
          )}
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
