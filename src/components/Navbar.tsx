import { useEffect, useMemo, useState } from 'react';
import { Beer, CalendarCheck, Gift, Home, Images, LockKeyhole, MapPinned, Menu, Sparkles, X } from 'lucide-react';
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
  const { activeHousehold, site, isGroomsmenEligible, isBridalPartyEligible, isUnlocked, clearInvitation } = useGuestExperience();
  const [menuOpen, setMenuOpen] = useState(false);
  const navDate = isUnlocked
    ? site.dateIsTbc
      ? 'Date TBC'
      : formatWeddingDate(site.weddingDate, { day: '2-digit', month: 'short', year: 'numeric' })
    : site.venueCity?.includes('Western Cape')
      ? site.venueCity
      : `${site.venueCity}, Western Cape`;

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
    <header className="site-nav fixed inset-x-0 top-0 z-50 h-[76px] border-b border-[#e8e2dc] bg-[#faf8f5]/[0.92] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => choose('home')}
          className="group flex min-w-0 items-center gap-3 rounded-full text-left focus-visible:outline-none"
          aria-label={`${site.groomName} and ${site.brideName} wedding home`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e2dad2] bg-gradient-to-br from-[#fffdfb] via-white to-[#faf6f2] font-display text-base font-semibold leading-none text-[#b85b73] shadow-[0_6px_20px_rgba(60,50,45,0.06)] transition-transform duration-300 select-none group-hover:-rotate-3">
            <span className="inline-flex items-center justify-center whitespace-nowrap leading-none">
              <span>{site.groomName.charAt(0)}</span>
              <span className="mx-0.5 text-[10px] font-normal text-[#c97a8b]">&amp;</span>
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
                    ? 'border border-[#9bbeab] bg-[#edf5f0] text-[#2d4f39] font-bold hover:bg-[#e1ede6]'
                    : isBachelorette && !active
                      ? 'border border-[#e4aeb5] bg-[#fdf2f4] text-[#b85b73] font-bold hover:bg-[#fae4ea]'
                      : ''
                }`}
              >
                {isBachelor && (
                  <Beer
                    className={`inline-block mr-1.5 h-3.5 w-3.5 ${
                      active ? 'text-white' : 'text-[#3d664f]'
                    } -mt-0.5`}
                  />
                )}
                {isBachelorette && (
                  <Sparkles
                    className={`inline-block mr-1.5 h-3.5 w-3.5 ${
                      active ? 'text-white' : 'text-[#b85b73]'
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
            <div className="hidden items-center gap-1.5 rounded-full border border-[#9bbeab] bg-[#edf5f0] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2d4f39] sm:flex">
              <span className="max-w-32 truncate">{activeHousehold.name}</span>
              <button
                type="button"
                onClick={clearInvitation}
                className="ml-1 rounded-full p-0.5 text-stone-500 transition hover:bg-stone-200/70 hover:text-stone-900"
                title="Lock invitation and hide date/time"
                aria-label="Lock invitation"
              >
                <LockKeyhole className="h-3.5 w-3.5" />
              </button>
            </div>
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
        className={`absolute inset-x-0 top-full border-b border-[#e8e2dc] bg-[#faf8f5]/[0.98] px-4 pb-5 pt-3 shadow-xl backdrop-blur-xl transition-all duration-200 lg:hidden ${
          menuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
        }`}
      >
        <nav className="mx-auto grid max-w-xl gap-1.5" aria-label="Mobile wedding website">
          {activeHousehold && (
            <div className="mb-2 flex items-center justify-between rounded-2xl border border-[#9bbeab] bg-[#edf5f0] p-3 text-xs font-semibold text-[#2d4f39]">
              <span className="truncate">Unlocked for: {activeHousehold.name}</span>
              <button
                type="button"
                onClick={() => {
                  clearInvitation();
                  setMenuOpen(false);
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-[11px] font-bold text-stone-700 shadow-2xs hover:bg-stone-50 transition"
              >
                <LockKeyhole className="h-3 w-3 text-stone-500" /> Lock
              </button>
            </div>
          )}
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
                      ? 'bg-[#3d664f] text-white shadow-md shadow-[#3d664f]/30'
                    : isBachelorette
                      ? 'bg-[#b85b73] text-white shadow-md shadow-[#b85b73]/30'
                      : 'bg-[#c97a8b] text-white shadow-md shadow-pink-200/50'
                    : isBachelor
                      ? 'border border-[#9bbeab] bg-[#edf5f0] text-[#2d4f39] font-bold'
                      : isBachelorette
                        ? 'border border-[#e4aeb5] bg-[#fdf2f4] text-[#b85b73] font-bold'
                        : 'text-stone-700 hover:bg-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isBachelor && !active ? 'text-[#3d664f]' : isBachelorette && !active ? 'text-[#b85b73]' : ''}`} />
                {item.label}
                {(isBachelor || isBachelorette) && (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isBachelor ? 'bg-[#3d664f]/15 text-[#3d664f]' : 'bg-[#b85b73]/15 text-[#b85b73]'
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
