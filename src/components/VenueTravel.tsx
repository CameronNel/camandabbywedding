import { useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCheck,
  Clock3,
  Copy,
  KeyRound,
  LockKeyhole,
  MapPin,
  Palette,
  Sparkles,
} from 'lucide-react';
import type { SectionId } from './Navbar';
import { Reveal } from './Reveal';
import { type ListingView, useGuestExperience } from './guestExperience';
import { formatWeddingDate } from '../utils/dates';
import { useWedding } from '../context/WeddingContext';
import { generateIcsFile } from '../utils/storage';
import { PastelTulip } from './decorations/TulipAccents';
import { WEDDING_COLOR_PALETTE } from '../utils/seatingConstants';

interface VenueTravelProps {
  onNavigate: (section: SectionId) => void;
}

function ListingCard({ item, kind }: { item: ListingView; kind: 'stay' | 'service' }) {
  return (
    <article className="group flex h-full flex-col rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-[0_14px_45px_rgba(64,48,39,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(64,48,39,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf6ec] text-[#547552]">
          {kind === 'stay' ? <BedDouble className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </span>
        <span className="rounded-full bg-[#fdebf0] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b8697a]">
          {item.priceLabel}
        </span>
      </div>
      <h4 className="mt-5 font-display text-2xl font-semibold text-stone-800">{item.name}</h4>
      {item.address && <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-stone-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{item.address}</p>}
      {item.description && <p className="mt-4 text-sm leading-7 text-stone-600">{item.description}</p>}
      <div className="mt-auto pt-6">
        {item.bookingCode && (
          <p className="mb-3 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
            Booking code: <strong className="font-mono text-stone-800">{item.bookingCode}</strong>
          </p>
        )}
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#c97a8b] underline decoration-[#e8b9c4] underline-offset-4">
            View details <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}

export function VenueTravel({ onNavigate }: VenueTravelProps) {
  const wedding = useWedding();
  const { site, activeHousehold, accommodations, services } = useGuestExperience();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      window.setTimeout(() => setCopiedHex(null), 2000);
    } catch {
      setCopiedHex(null);
    }
  };

  const sortListings = (items: ListingView[]) => [...items].sort((a, b) => {
    if (a.price === b.price) return 0;
    return sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
  });

  const isAttending = activeHousehold?.status === 'attending';
  const hasComplimentaryStay = Boolean(activeHousehold?.complimentaryVenueStay);
  const freeVenueStays = accommodations.filter(item => item.visibility === 'free_venue_housing' || item.isVenueHousing);
  const generalStays = accommodations.filter(item => item.visibility === 'general' && !item.isVenueHousing);
  const generalServices = services.filter(item => item.visibility === 'general' && !item.isVenueHousing);
  const sortedStays = sortListings(hasComplimentaryStay ? freeVenueStays : generalStays);
  const sortedServices = sortListings(hasComplimentaryStay ? [] : generalServices);
  const formattedDate = site.dateIsTbc ? 'Date to be confirmed' : formatWeddingDate(site.weddingDate);

  return (
    <section id="details" className="anchor-section relative z-10 min-h-[calc(100svh-76px)] bg-gradient-to-b from-transparent via-[#f5f8ef]/40 to-transparent">
      <div className="relative z-10 mx-auto max-w-[1440px] px-5 pt-8 pb-32 sm:px-8 sm:pt-10 sm:pb-44 lg:px-14">
        <Reveal className="grid items-end gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <PastelTulip color="peach" size={20} className="drop-shadow-sm" />
              <span>The setting</span>
            </p>
            <h2 className="section-title max-w-3xl">Our setting in George</h2>
          </div>
          <p className="section-copy lg:pb-2">
            We’ll gather at {site.venueName} in George. The final ceremony and reception timings will be shared with invited guests once confirmed.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-8 overflow-hidden rounded-[2rem] border-2 border-[#eedce2] bg-gradient-to-br from-[#fffdfd] via-[#fffafc] to-[#faf5ec] text-stone-800 shadow-[0_24px_70px_rgba(201,122,139,0.1)] sm:mt-10">
          <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative min-h-[340px] overflow-hidden sm:min-h-[460px]">
              <img src={`${import.meta.env.BASE_URL}images/arendsrus-grounds.jpg`} alt="ArendsRus Country Lodge grounds" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent" />
            </div>
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12 bg-gradient-to-br from-[#fff8fa]/90 via-[#fffcfd]/80 to-[#faf5ec]/90">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a384b]">George · Western Cape</p>
                <h3 className="mt-4 font-display text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl">{site.venueName}</h3>
                <dl className="mt-9 space-y-6 text-sm">
                  <div className="flex gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#b85b73]" />
                    <div><dt className="text-stone-500 font-medium">Date</dt><dd className="mt-1 font-semibold text-stone-800"><time dateTime={site.dateIsTbc ? undefined : site.weddingDate.slice(0, 10)}>{formattedDate}</time></dd></div>
                  </div>
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#b85b73]" />
                    <div><dt className="text-stone-500 font-medium">Times</dt><dd className="mt-1 font-semibold text-stone-800">{site.ceremonyIsTbc || !site.ceremonyTime ? 'To be confirmed' : site.ceremonyTime}</dd></div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#b85b73]" />
                    <div><dt className="text-stone-500 font-medium">Location</dt><dd className="mt-1 font-semibold text-stone-800">{site.venueAddress ? `${site.venueAddress}, ` : ''}{site.venueCity}</dd></div>
                  </div>
                </dl>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="button-primary min-h-12 justify-center px-6">
                  Open in maps <ArrowUpRight className="h-4 w-4" />
                </a>
                {!site.dateIsTbc && (
                  <button
                    type="button"
                    onClick={() => generateIcsFile(wedding.config)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#e8c7d2] bg-white/90 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-[#8a384b] transition hover:border-[#c97a8b] hover:bg-[#fff2f6] hover:text-stone-900 shadow-2xs"
                    title="Download .ics calendar event for Apple Calendar, Outlook, and Google Calendar"
                  >
                    <CalendarPlus className="h-4 w-4 text-[#b85b73]" /> Add to calendar
                  </button>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Wedding Colour Palette & Attire Card */}
        <Reveal delay={120} className="mt-12 sm:mt-16">
          <div className="overflow-hidden rounded-[2.2rem] border-2 border-[#edd3dc] bg-gradient-to-br from-[#fffdfd] via-[#fdf7fa] to-[#faf3f7] p-7 sm:p-10 shadow-[0_24px_70px_rgba(201,122,139,0.1)]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-pink-200/60">
              <div>
                <p className="eyebrow flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5 text-[#c97a8b]" />
                  <span>Dress Code &amp; Palette</span>
                </p>
                <h3 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-stone-900">
                  Dress Code: Formal
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">
                  {wedding.config.dressCode?.description ||
                    'Dress code is formal. Please come as you are—while our wedding brand colours are shown below, wear any colour you already have and love! If you need ideas, we love this palette:'}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 rounded-2xl border border-[#e4aeb5] bg-[#fdf5f6] px-4 py-2.5 text-xs font-bold text-[#8a424e] shadow-2xs">
                <PastelTulip color="pink" size={20} className="drop-shadow-xs" />
                <span>{wedding.config.dressCode?.title || 'Formal Attire'}</span>
              </div>
            </div>

            {/* 6 Brand Color Circles (Bouncy & Playful with Blooming Tulips) */}
            <div className="mt-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-6 place-items-center">
                {WEDDING_COLOR_PALETTE.map(color => {
                  const isCopied = copiedHex === color.hex;
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => handleCopyHex(color.hex)}
                      className="group flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 focus:outline-none cursor-pointer"
                      title={`Click to copy ${color.hex}`}
                    >
                      {/* Bouncy Pastel Circle with glossy highlight shine & floating ring */}
                      <div className="relative">
                        {/* Outer soft glow ring on hover */}
                        <div
                          className="absolute -inset-2 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-85"
                          style={{ backgroundColor: color.hex }}
                        />

                        {/* Main Circle */}
                        <div
                          className="relative flex h-24 w-24 sm:h-26 sm:w-26 md:h-28 md:w-28 items-center justify-center rounded-full border-3 shadow-[0_10px_25px_rgba(0,0,0,0.07)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_16px_35px_rgba(0,0,0,0.14)] overflow-hidden"
                          style={{
                            backgroundColor: color.hex,
                            borderColor: color.borderTint,
                          }}
                        >
                          {/* Glossy top-light reflection arc */}
                          <div className="pointer-events-none absolute inset-x-2 top-1.5 h-7 rounded-full bg-gradient-to-b from-white/65 via-white/20 to-transparent" />

                          {/* Center cute blooming tulip & hex indicator */}
                          <div className="flex flex-col items-center justify-center transition-transform duration-200 group-hover:scale-110">
                            {isCopied ? (
                              <div className="flex flex-col items-center">
                                <CheckCheck className="h-6 w-6 text-emerald-700 animate-bounce" />
                                <span className="text-[10px] font-bold text-emerald-800">Copied!</span>
                              </div>
                            ) : (
                              <>
                                <div className="my-0.5 flex items-center justify-center">
                                  <PastelTulip color={color.tulipColor} size={28} interactive={false} className="filter drop-shadow-xs pointer-events-none" />
                                </div>
                                <span
                                  className="mt-0.5 font-mono text-[10px] sm:text-[11px] font-extrabold tracking-wider rounded-full px-2 py-0.5 shadow-2xs backdrop-blur-xs"
                                  style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                                    color: color.textTint,
                                  }}
                                >
                                  {color.hex.replace('#', '')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Cute floating badge tag */}
                        <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-white bg-white text-stone-600 shadow-xs text-[11px] transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110">
                          {isCopied ? '✨' : <Copy className="h-3 w-3 text-stone-500" />}
                        </span>
                      </div>

                      {/* Cute Name Label below */}
                      <span className="mt-3 block font-serif text-sm sm:text-base font-bold text-stone-800 transition-colors group-hover:text-[#c97a8b]">
                        {color.name}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-400">
                        {color.hex}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-stone-500">
                <Sparkles className="h-3.5 w-3.5 text-[#e597a8]" />
                <span>Tap any circle to copy its colour hex for dresses, suits, or accessories!</span>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-32 border-t border-stone-200/60 pt-12 sm:mt-48 sm:pt-16">
          <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">For invited guests</p>
              <h3 className="font-display text-4xl font-semibold tracking-tight text-stone-800 sm:text-5xl">Stay &amp; local services</h3>
            </div>
            {isAttending && !hasComplimentaryStay && (sortedStays.length > 1 || sortedServices.length > 1) && (
              <button
                type="button"
                onClick={() => setSortDirection(current => current === 'asc' ? 'desc' : 'asc')}
                className="button-secondary min-h-11 self-start px-5 sm:self-auto"
                aria-label={`Sort prices ${sortDirection === 'asc' ? 'high to low' : 'low to high'}`}
              >
                {sortDirection === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                {sortDirection === 'asc' ? 'Lowest price first' : 'Highest price first'}
              </button>
            )}
          </Reveal>

          {!activeHousehold ? (
            <Reveal delay={80} className="mt-8 rounded-[2rem] border border-pink-100 bg-[#fdf5f7] p-8 sm:p-10">
              <LockKeyhole className="h-7 w-7 text-[#c97a8b]" />
              <h4 className="mt-5 font-display text-3xl text-stone-800">Private details unlock with your invitation.</h4>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Accommodation and service recommendations are personalized for each attending household.</p>
              <button type="button" onClick={() => onNavigate('rsvp')} className="button-primary mt-6 min-h-11 px-6"><KeyRound className="h-4 w-4" /> Open invitation</button>
            </Reveal>
          ) : !isAttending ? (
            <Reveal delay={80} className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-8 sm:p-10">
              <Clock3 className="h-7 w-7 text-[#5c7a59]" />
              <h4 className="mt-5 font-display text-3xl text-stone-800">Available after an attending RSVP</h4>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Confirm that someone in your household is attending to view the relevant stay and service information.</p>
              <button type="button" onClick={() => onNavigate('rsvp')} className="button-secondary mt-6 min-h-11 px-6">Review RSVP</button>
            </Reveal>
          ) : hasComplimentaryStay ? (
            <Reveal delay={80} className="mt-8 overflow-hidden rounded-[2rem] border border-[#b8cfb6] bg-[#edf6ec] p-8 sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#4c6b4b]"><Check className="h-3.5 w-3.5" /> Venue stay included</span>
              <h4 className="mt-5 max-w-2xl font-display text-4xl text-stone-800">Your accommodation at the venue is provided by us.</h4>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">There is no need to book an alternative stay. Room and arrival details will be shared directly with your household.</p>
              {sortedStays.length > 0 && (
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {sortedStays.map(item => <ListingCard key={item.id} item={item} kind="stay" />)}
                </div>
              )}
            </Reveal>
          ) : (
            <>
              <Reveal delay={80} className="mt-8">
                <h4 className="font-display text-2xl font-semibold text-stone-800">Accommodation</h4>
                {sortedStays.length ? (
                  <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {sortedStays.map(item => <ListingCard key={item.id} item={item} kind="stay" />)}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-7 text-sm leading-7 text-stone-600">No accommodation recommendations have been published yet. Please check back once the couple has finalized the list.</div>
                )}
              </Reveal>

              <Reveal delay={100} className="mt-12">
                <h4 className="font-display text-2xl font-semibold text-stone-800">Guest services</h4>
                {sortedServices.length ? (
                  <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {sortedServices.map(item => <ListingCard key={item.id} item={item} kind="service" />)}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-7 text-sm leading-7 text-stone-600">No local services have been published yet. Any recommendations added by the couple will appear here.</div>
                )}
              </Reveal>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
