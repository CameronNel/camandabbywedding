import { useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock3,
  KeyRound,
  LockKeyhole,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { SectionId } from './Navbar';
import { Reveal } from './Reveal';
import { type ListingView, useGuestExperience } from './guestExperience';
import { formatWeddingDate } from '../utils/dates';
import { useWedding } from '../context/WeddingContext';
import { generateIcsFile } from '../utils/storage';
import { PastelTulip } from './decorations/TulipAccents';

interface VenueTravelProps {
  onNavigate: (section: SectionId) => void;
}

function ListingCard({ item, kind }: { item: ListingView; kind: 'stay' | 'service' }) {
  return (
    <article className="group flex h-full flex-col rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-[0_14px_45px_rgba(64,48,39,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(64,48,39,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf5f0] text-[#3d664f]">
          {kind === 'stay' ? <BedDouble className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </span>
        <span className="rounded-full bg-[#fdf2f5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b85b73]">
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
  const { site, activeHousehold, accommodations, services, isUnlocked } = useGuestExperience();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    <section id="details" className="anchor-section relative z-10 min-h-[calc(100svh-76px)] w-full max-w-full overflow-hidden bg-gradient-to-b from-transparent via-[#f5f8ef]/40 to-transparent">
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
            We’ll gather at {site.venueName} in George. {isUnlocked ? 'The celebration timings and schedule are confirmed below.' : 'The confirmed celebration date and timings unlock with your private invitation.'}
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-8 overflow-hidden rounded-[2rem] border-2 border-[#e8ded6] bg-gradient-to-br from-[#ffffff] via-[#fffdfa] to-[#faf5ec] text-stone-800 shadow-[0_24px_70px_rgba(60,50,45,0.06)] sm:mt-10">
          <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative min-h-[340px] overflow-hidden sm:min-h-[460px]">
              <img src={`${import.meta.env.BASE_URL}images/arendsrus-grounds.jpg`} alt="ArendsRus Country Lodge grounds" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent" />
            </div>
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12 bg-gradient-to-br from-[#fffdfa]/95 via-[#fffefc]/90 to-[#faf6ef]/95">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#b85b73]">George · Western Cape</p>
                <h3 className="mt-4 font-display text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl">{site.venueName}</h3>
                <dl className="mt-9 space-y-6 text-sm">
                  <div className="flex gap-3">
                    {isUnlocked ? (
                      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#b85b73]" />
                    ) : (
                      <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#b85b73]" />
                    )}
                    <div>
                      <dt className="text-stone-500 font-medium">Date</dt>
                      <dd className="mt-1 font-semibold text-stone-800">
                        {isUnlocked ? (
                          <time dateTime={site.dateIsTbc ? undefined : site.weddingDate.slice(0, 10)}>{formattedDate}</time>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigate('rsvp')}
                            className="inline-flex items-center gap-1 text-[#b85b73] hover:underline underline-offset-2 font-medium"
                          >
                            Revealed with invitation →
                          </button>
                        )}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {isUnlocked ? (
                      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#b85b73]" />
                    ) : (
                      <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#b85b73]" />
                    )}
                    <div>
                      <dt className="text-stone-500 font-medium">Times</dt>
                      <dd className="mt-1 font-semibold text-stone-800">
                        {isUnlocked ? (
                          site.ceremonyIsTbc || !site.ceremonyTime ? 'To be confirmed' : site.ceremonyTime
                        ) : (
                          <span className="text-stone-500 font-normal">Shared with confirmed guests</span>
                        )}
                      </dd>
                    </div>
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
                {isUnlocked ? (
                  !site.dateIsTbc && (
                    <button
                      type="button"
                      onClick={() => generateIcsFile(wedding.config)}
                      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#ded5cb] bg-white/90 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-[#544c46] transition hover:border-[#c97a8b] hover:bg-[#faf6f2] hover:text-stone-900 shadow-2xs"
                      title="Download .ics calendar event for Apple Calendar, Outlook, and Google Calendar"
                    >
                      <CalendarPlus className="h-4 w-4 text-[#b85b73]" /> Add to calendar
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('rsvp')}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#ded5cb] bg-white/90 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-[#544c46] transition hover:border-[#c97a8b] hover:bg-[#faf6f2] hover:text-stone-900 shadow-2xs"
                    title="Unlock invitation to view date and download calendar event"
                  >
                    <KeyRound className="h-4 w-4 text-[#b85b73]" /> Unlock date &amp; calendar
                  </button>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Dress Code Card */}
        <Reveal delay={120} className="mt-8 sm:mt-10">
          <div className="overflow-hidden rounded-[2rem] border-2 border-[#e8ded6] bg-gradient-to-br from-[#ffffff] via-[#fffdfa] to-[#faf5ec] p-6 sm:p-8 shadow-[0_16px_50px_rgba(60,50,45,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <p className="eyebrow flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#c97a8b]" />
                  <span>Dress Code</span>
                </p>
                <h3 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-stone-900">
                  Dress Code: Formal
                </h3>
                <p className="mt-2 text-sm sm:text-base text-stone-600">
                  {wedding.config.dressCode?.description || 'Dress code formal, come as you are.'}
                </p>
              </div>

              <div className="shrink-0 self-start sm:self-auto flex items-center gap-2 rounded-2xl border border-[#d48b9b]/50 bg-[#faf2f4] px-4 py-2.5 text-xs font-bold text-[#b85b73] shadow-2xs">
                <PastelTulip color="pink" size={18} className="drop-shadow-xs" />
                <span>{wedding.config.dressCode?.title || 'Formal Attire'}</span>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 border-t border-stone-200/60 pt-12 sm:mt-24 sm:pt-16">
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
            <Reveal delay={80} className="mt-8 rounded-[2rem] border border-[#e8ded6] bg-[#faf6f2] p-8 sm:p-10">
              <LockKeyhole className="h-7 w-7 text-[#c97a8b]" />
              <h4 className="mt-5 font-display text-3xl text-stone-800">Private details unlock with your invitation.</h4>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Accommodation and service recommendations are personalized for each attending household.</p>
              <button type="button" onClick={() => onNavigate('rsvp')} className="button-primary mt-6 min-h-11 px-6"><KeyRound className="h-4 w-4" /> Open invitation</button>
            </Reveal>
          ) : !isAttending ? (
            <Reveal delay={80} className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-8 sm:p-10">
              <Clock3 className="h-7 w-7 text-[#698f75]" />
              <h4 className="mt-5 font-display text-3xl text-stone-800">Available after an attending RSVP</h4>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Confirm that someone in your household is attending to view the relevant stay and service information.</p>
              <button type="button" onClick={() => onNavigate('rsvp')} className="button-secondary mt-6 min-h-11 px-6">Review RSVP</button>
            </Reveal>
          ) : hasComplimentaryStay ? (
            <Reveal delay={80} className="mt-8 overflow-hidden rounded-[2rem] border border-[#9bbeab]/60 bg-[#edf5f0] p-8 sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2d4f39]"><Check className="h-3.5 w-3.5" /> Venue stay included</span>
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
