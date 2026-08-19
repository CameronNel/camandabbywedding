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

interface VenueTravelProps {
  onNavigate: (section: SectionId) => void;
}

function ListingCard({ item, kind }: { item: ListingView; kind: 'stay' | 'service' }) {
  return (
    <article className="group flex h-full flex-col rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-[0_14px_45px_rgba(64,48,39,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(64,48,39,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef1e9] text-[#596651]">
          {kind === 'stay' ? <BedDouble className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </span>
        <span className="rounded-full bg-[#f2ece5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#704b3d]">
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
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#704b3d] underline decoration-[#c7aa98] underline-offset-4">
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
    <section id="details" className="anchor-section bg-[#fbfaf7]">
      <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <Reveal className="grid items-end gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <p className="eyebrow">The setting</p>
            <h2 className="section-title max-w-3xl">Our setting in George</h2>
          </div>
          <p className="section-copy lg:pb-2">
            We’ll gather at {site.venueName} in George. The final ceremony and reception timings will be shared with invited guests once confirmed.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-14 overflow-hidden rounded-[2rem] bg-[#30342e] text-white shadow-[0_30px_90px_rgba(33,38,31,0.2)]">
          <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative min-h-[340px] overflow-hidden sm:min-h-[460px]">
              <img src={`${import.meta.env.BASE_URL}images/hero-arendsrus.jpg`} alt="ArendsRus Country Lodge" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d9c8b4]">George · Western Cape</p>
                <h3 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">{site.venueName}</h3>
                <dl className="mt-9 space-y-6 text-sm">
                  <div className="flex gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#d9c8b4]" />
                    <div><dt className="text-white/50">Date</dt><dd className="mt-1 font-medium"><time dateTime={site.dateIsTbc ? undefined : site.weddingDate.slice(0, 10)}>{formattedDate}</time></dd></div>
                  </div>
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#d9c8b4]" />
                    <div><dt className="text-white/50">Times</dt><dd className="mt-1 font-medium">{site.ceremonyIsTbc || !site.ceremonyTime ? 'To be confirmed' : site.ceremonyTime}</dd></div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#d9c8b4]" />
                    <div><dt className="text-white/50">Location</dt><dd className="mt-1 font-medium">{site.venueAddress ? `${site.venueAddress}, ` : ''}{site.venueCity}</dd></div>
                  </div>
                </dl>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href={site.mapUrl} target="_blank" rel="noopener noreferrer" className="button-light min-h-12 justify-center px-6">
                  Open in maps <ArrowUpRight className="h-4 w-4" />
                </a>
                {!site.dateIsTbc && (
                  <button
                    type="button"
                    onClick={() => generateIcsFile(wedding.config)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition hover:bg-white hover:text-stone-900"
                    title="Download .ics calendar event for Apple Calendar, Outlook, and Google Calendar"
                  >
                    <CalendarPlus className="h-4 w-4" /> Add to calendar
                  </button>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-24">
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
            <Reveal delay={80} className="mt-8 rounded-[2rem] border border-stone-200 bg-[#f1ece4] p-8 sm:p-10">
              <LockKeyhole className="h-7 w-7 text-[#704b3d]" />
              <h4 className="mt-5 font-display text-3xl text-stone-800">Private details unlock with your invitation.</h4>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Accommodation and service recommendations are personalized for each attending household.</p>
              <button type="button" onClick={() => onNavigate('rsvp')} className="button-primary mt-6 min-h-11 px-6"><KeyRound className="h-4 w-4" /> Open invitation</button>
            </Reveal>
          ) : !isAttending ? (
            <Reveal delay={80} className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-8 sm:p-10">
              <Clock3 className="h-7 w-7 text-[#7a8870]" />
              <h4 className="mt-5 font-display text-3xl text-stone-800">Available after an attending RSVP</h4>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">Confirm that someone in your household is attending to view the relevant stay and service information.</p>
              <button type="button" onClick={() => onNavigate('rsvp')} className="button-secondary mt-6 min-h-11 px-6">Review RSVP</button>
            </Reveal>
          ) : hasComplimentaryStay ? (
            <Reveal delay={80} className="mt-8 overflow-hidden rounded-[2rem] border border-[#abb7a1] bg-[#eef1e9] p-8 sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#596651]"><Check className="h-3.5 w-3.5" /> Venue stay included</span>
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
