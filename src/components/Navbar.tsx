import { useEffect, useMemo, useState } from 'react';
import { Beer, CalendarCheck, Gift, Home, Images, MapPinned, Menu, Sparkles, X } from 'lucide-react';
import { useGuestExperience } from './guestExperience';
import { formatWeddingDate } from '../utils/dates';

export type SectionId = 'home' | 'rsvp' | 'details' | 'gallery' | 'gifts' | 'bachelor' | 'bachelorette';

interface NavbarProps {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

const baseNavigation: Array<{ id: SectionId; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'rsvp', label: 'RSVP', icon: CalendarCheck },
  { id: 'details', label: 'Venue & stay', icon: MapPinned },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'gifts', label: 'Gifts', icon: Gift },
];

export function Navbar({ activeSection, onNavigate }: NavbarProps) {
  const { activeHousehold, site, isGroomsmenEligible, isBridalPartyEligible } = useGuestExperience();
  const [menuOpen, setMenuOpen] = useState(false);
  const navDate = site.dateIsTbc
    ? 'Date TBC'
    : formatWeddingDate(site.weddingDate, { day: '2-digit', month: 'short', year: 'numeric' });

  const navigation = useMemo(() => {
    const items = [...baseNavigation];
    if (isGroomsmenEligible) {
      items.push({ id: 'bachelor' as SectionId, label: "Groom's Crew", icon: Beer });
    }
    if (isBridalPartyEligible) {
      items.push({ id: 'bachelorette' as SectionId, label: "Bridal Crew", icon: Sparkles });
    }
    return items;
  }, [isGroomsmenEligible, isBridalPartyEligible]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const choose = (section: SectionId) => {
    setMenuOpen(false);
    onNavigate(section);
  };

  return (
    <header className="site-nav fixed inset-x-0 top-0 z-50 h-[76px] border-b border-[#eed5dc] bg-[#faf3f5]/[0.92] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => choose('home')}
          className="group flex min-w-0 items-center gap-3 rounded-full text-left focus-visible:outline-none"
          aria-label={`${site.groomName} and ${site.brideName} wedding home`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#EDC9D4] bg-gradient-to-br from-[#fff7f9] via-white to-[#fff6f4] font-display text-base font-semibold leading-none text-[#a84b61] shadow-[0_6px_20px_rgba(237,201,212,0.35)] transition-transform duration-300 select-none group-hover:-rotate-3">
            <span className="inline-flex items-center justify-center whitespace-nowrap leading-none">
              <span>{site.groomName.charAt(0)}</span>
              <span className="mx-0.5 text-[10px] font-normal text-[#e597a8]">&amp;</span>
              <span>{site.brideName.charAt(0)}</span>
            </span>
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate font-display text-[17px] font-semibold tracking-[0.08em] text-stone-800">{site.groomName} &amp; {site.brideName}</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-500">{navDate}</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 rounded-full border border-stone-200/80 bg-white/[0.65] p-1.5 shadow-sm lg:flex" aria-label="Wedding website">
          {navigation.map(item => {
            const active = activeSection === item.id;
            const isBachelor = item.id === 'bachelor';
            const isBachelorette = item.id === 'bachelorette';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`nav-pill ${active ? 'is-active' : ''} ${
                  isBachelor && !active
                    ? 'border border-[#a2ac94] bg-[#f0f2ec] text-[#3e4437] font-bold hover:bg-[#e4e7de]'
                    : isBachelorette && !active
                      ? 'border border-[#e4aeb5] bg-[#fdf2f4] text-[#9c2743] font-bold hover:bg-[#fae4ea]'
                      : ''
                }`}
              >
                {isBachelor && (
                  <Beer
                    className={`inline-block mr-1.5 h-3.5 w-3.5 ${
                      active ? 'text-white' : 'text-[#404c24]'
                    } -mt-0.5`}
                  />
                )}
                {isBachelorette && (
                  <Sparkles
                    className={`inline-block mr-1.5 h-3.5 w-3.5 ${
                      active ? 'text-white' : 'text-[#9c2743]'
                    } -mt-0.5`}
                  />
                )}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {activeHousehold && (
            <span className="hidden max-w-40 truncate rounded-full border border-[#cde1a4] bg-[#f7faf2] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a6328] xl:block">
              Invitation found
            </span>
          )}
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm lg:hidden"
            onClick={() => setMenuOpen(open => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation"
        className={`absolute inset-x-0 top-full border-b border-pink-100/70 bg-[#fcf9f9]/[0.98] px-4 pb-5 pt-3 shadow-xl backdrop-blur-xl transition-all duration-200 lg:hidden ${
          menuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
        }`}
      >
        <nav className="mx-auto grid max-w-xl gap-1.5" aria-label="Mobile wedding website">
          {navigation.map(item => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            const isBachelor = item.id === 'bachelor';
            const isBachelorette = item.id === 'bachelorette';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold transition-colors ${
                  active
                    ? isBachelor
                      ? 'bg-[#404c24] text-white shadow-md shadow-[#404c24]/30'
                      : isBachelorette
                        ? 'bg-[#9c2743] text-white shadow-md shadow-rose-900/30'
                        : 'bg-[#c97a8b] text-white shadow-md shadow-pink-200/50'
                    : isBachelor
                      ? 'border border-[#a2ac94] bg-[#f0f2ec] text-[#3e4437] font-bold'
                      : isBachelorette
                        ? 'border border-[#e4aeb5] bg-[#fdf2f4] text-[#9c2743] font-bold'
                        : 'text-stone-700 hover:bg-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isBachelor && !active ? 'text-[#404c24]' : isBachelorette && !active ? 'text-[#9c2743]' : ''}`} />
                {item.label}
                {(isBachelor || isBachelorette) && (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isBachelor ? 'bg-[#404c24]/15 text-[#404c24]' : 'bg-[#9c2743]/15 text-[#9c2743]'
                  }`}>
                    Unlocked
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
