import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Compass,
  Heart,
  KeyRound,
  Lock,
  MapPin,
  Sparkles,
  Unlock,
  Users,
  ChevronRight,
  PartyPopper,
  Loader2,
} from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';

interface UpcomingEventsProps {
  onNavigate: (section: SectionId) => void;
}

interface EventItem {
  id: string;
  title: string;
  badge: string;
  badgeType: 'rose' | 'sage' | 'gold' | 'champagne';
  dateDisplay: string;
  timeDisplay?: string;
  locationDisplay: string;
  audience: string;
  description: string;
  icon: React.ReactNode;
  actionText?: string;
  actionSection?: SectionId;
  confirmed: boolean;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ onNavigate }) => {
  const { isUnlocked, activeHousehold, site, lookupInvitation } = useGuestExperience();
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = unlockCode.trim();
    if (!clean) {
      setUnlockError('Please enter your invitation code.');
      return;
    }

    setIsUnlocking(true);
    setUnlockError('');
    try {
      const found = await lookupInvitation(clean);
      if (!found) {
        setUnlockError('Could not find an invitation with that code. Please check and try again.');
      }
    } catch {
      setUnlockError('Unable to verify code right now. Please try again shortly.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const events: EventItem[] = [
    {
      id: 'bridal_shower',
      title: 'Bridal Shower',
      badge: 'Confirmed Date',
      badgeType: 'rose',
      dateDisplay: 'Tuesday, 5 January 2027',
      timeDisplay: 'Afternoon Tea · 14:00',
      locationDisplay: 'George, Western Cape',
      audience: "Abby's Loved Ones & Ladies",
      description:
        'An intimate and joyous celebration showering Abby with love, advice, and blessings as she prepares to walk down the aisle.',
      icon: <Sparkles className="h-5 w-5 text-[#b85b73]" />,
      confirmed: true,
    },
    {
      id: 'bachelorette',
      title: "Abby's Bachelorette",
      badge: 'Date TBA',
      badgeType: 'champagne',
      dateDisplay: 'Date To Be Announced (TBA)',
      timeDisplay: 'Celebration Weekend',
      locationDisplay: 'Western Cape Getaway',
      audience: 'Abby & The Bridal Party',
      description:
        'A fun-filled celebratory getaway for Abby and her bridal party! Details, voting on activities, and stay coordination are underway on the hub.',
      icon: <PartyPopper className="h-5 w-5 text-[#c59b48]" />,
      actionText: 'View Bachelorette Hub ✨',
      actionSection: 'bachelorette',
      confirmed: false,
    },
    {
      id: 'bachelor',
      title: "Cameron's Bachelor Party",
      badge: 'Date TBA',
      badgeType: 'sage',
      dateDisplay: 'Date To Be Announced (TBA)',
      timeDisplay: 'Adventure Weekend',
      locationDisplay: 'Western Cape',
      audience: 'Cameron & The Groomsmen',
      description:
        'A weekend of braais, brotherhood, and outdoor adventure for Cameron and his groomsmen. Trip ideas and voting are live on the hub.',
      icon: <Compass className="h-5 w-5 text-[#527d65]" />,
      actionText: 'View Bachelor Hub 🎯',
      actionSection: 'bachelor',
      confirmed: false,
    },
    {
      id: 'wedding_day',
      title: 'The Wedding Celebration',
      badge: 'The Big Day',
      badgeType: 'gold',
      dateDisplay: 'Sunday, 1 August 2027',
      timeDisplay: site.ceremonyTime ? `Ceremony at ${site.ceremonyTime}` : 'Ceremony at 15:00',
      locationDisplay: `${site.venueName}, George, Western Cape`,
      audience: 'All Invited Wedding Guests',
      description:
        'The sacred moment Cameron and Abby exchange vows, followed by an evening of festive feast, heartfelt toasts, and dancing under the mountain stars!',
      icon: <Heart className="h-5 w-5 text-[#c59b48]" />,
      actionText: 'Go to RSVP 💌',
      actionSection: 'rsvp',
      confirmed: true,
    },
  ];

  return (
    <div id="events" className="relative min-h-[92vh] w-full max-w-full overflow-hidden bg-[#faf8f5] pt-[96px] pb-20 px-4 sm:px-6 lg:px-8">
      {/* Top Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-[#f8efe6]/60 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Top Breadcrumb & Status Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 rounded-full border border-[#ede5dd] bg-white/90 px-4 py-2 text-xs font-semibold text-[#2b2624] shadow-2xs backdrop-blur-xs hover:border-[#b85b73] hover:text-[#b85b73] transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Wedding Website</span>
          </button>

          {isUnlocked && activeHousehold && (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3.5 py-1.5 text-xs text-emerald-900 shadow-2xs">
              <Unlock className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                Celebration itinerary unlocked for <strong className="font-semibold">{activeHousehold.name}</strong>
              </span>
            </div>
          )}
        </div>

        {/* ACCESS GUARD: If not unlocked, display the private locked gate */}
        {!isUnlocked ? (
          <div className="mx-auto my-12 max-w-md w-full rounded-3xl border border-[#ede5dd] bg-white/95 p-8 shadow-xl text-center backdrop-blur-md">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-[#f5bdcd] bg-[#fdf2f5] text-[#b85b73] shadow-inner">
              <Lock className="h-7 w-7" />
            </div>

            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#f5bdcd] bg-[#fdf2f5] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#b85b73]">
              Private Itinerary
            </span>

            <h1 className="mt-3 font-serif text-2xl sm:text-3xl font-normal text-[#2b2624]">
              Celebrations Itinerary
            </h1>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#655e5b]">
              Our pre-wedding celebrations, bridal shower, and bachelor &amp; bachelorette party schedules are private for invited guests. Enter your invitation code below to unlock the schedule and times.
            </p>

            <form onSubmit={handleUnlock} className="mt-6 space-y-3 text-left">
              <label htmlFor="events-invite-code" className="block text-[11px] font-bold uppercase tracking-wider text-[#655e5b]">
                Enter Invitation Code
              </label>
              <div className="flex gap-2">
                <input
                  id="events-invite-code"
                  type="text"
                  value={unlockCode}
                  onChange={e => {
                    setUnlockCode(e.target.value);
                    setUnlockError('');
                  }}
                  placeholder="e.g. 4321 or Cam-101"
                  className="flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#b85b73] focus:outline-none focus:ring-2 focus:ring-[#b85b73]/20"
                />
                <button
                  type="submit"
                  disabled={isUnlocking}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#b85b73] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#a24b61] transition disabled:opacity-50 cursor-pointer"
                >
                  {isUnlocking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                  <span>{isUnlocking ? 'Unlocking…' : 'Unlock'}</span>
                </button>
              </div>

              {unlockError && (
                <p className="text-xs font-medium text-rose-600 animate-in fade-in duration-150">
                  {unlockError}
                </p>
              )}
            </form>

            <div className="mt-6 pt-5 border-t border-[#f3ece6] flex items-center justify-between text-xs text-[#736a65]">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="hover:text-[#2b2624] underline underline-offset-2 cursor-pointer"
              >
                ← Return to Home
              </button>
              <button
                type="button"
                onClick={() => onNavigate('rsvp')}
                className="font-medium text-[#b85b73] hover:underline underline-offset-2 cursor-pointer"
              >
                Find code in RSVP →
              </button>
            </div>
          </div>
        ) : (
          /* UNLOCKED FULL PAGE VIEW */
          <div>
            {/* Header */}
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="font-script text-2xl text-[#b85b73] sm:text-3xl">The Road to I Do</p>
              <h1 className="mt-1 font-serif text-3xl font-normal tracking-tight text-[#2b2624] sm:text-4xl md:text-5xl">
                Upcoming Celebrations
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#655e5b] sm:text-base">
                Key milestones, gatherings, and celebrations leading up to our wedding day.
              </p>
            </div>

            {/* Events Cards Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {events.map(event => {
                const badgeClasses = {
                  rose: 'bg-[#fdf2f5] text-[#b85b73] border-[#f5bdcd]',
                  sage: 'bg-[#f0f5f2] text-[#3d634f] border-[#c8dbcd]',
                  gold: 'bg-[#fdf7ea] text-[#9a7428] border-[#ebdcd2]',
                  champagne: 'bg-[#faf7f5] text-[#8f705d] border-[#ebdcd2]',
                }[event.badgeType];

                return (
                  <div
                    key={event.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-[#ede5dd] bg-white/95 p-6 shadow-xs backdrop-blur-xs transition duration-300 hover:-translate-y-1 hover:border-[#c97a8b]/40 hover:shadow-lg hover:shadow-stone-200/50"
                  >
                    <div>
                      {/* Top Bar with Icon & Badge */}
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#faf7f5] border border-[#ede4dc] shadow-2xs">
                          {event.icon}
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${badgeClasses}`}
                        >
                          {event.badge}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-xl font-medium text-[#2b2624] group-hover:text-[#b85b73] transition-colors">
                        {event.title}
                      </h3>

                      {/* Date & Time details */}
                      <div className="mt-3 space-y-1.5 border-t border-[#f3ece6] pt-3 text-xs text-[#655e5b]">
                        <div className="flex items-start gap-2">
                          <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b85b73]" />
                          <span className="font-medium text-[#2b2624]">{event.dateDisplay}</span>
                        </div>

                        {event.timeDisplay && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            <span>{event.timeDisplay}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                          <span>{event.locationDisplay}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                          <span>{event.audience}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-xs leading-relaxed text-[#736a65]">
                        {event.description}
                      </p>
                    </div>

                    {/* Card Action Button (if present) */}
                    {event.actionText && event.actionSection && (
                      <div className="mt-5 pt-3 border-t border-[#f3ece6]">
                        <button
                          type="button"
                          onClick={() => onNavigate(event.actionSection!)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#faf7f5] hover:bg-[#b85b73] px-3.5 py-2 text-xs font-semibold text-[#2b2624] hover:text-white border border-[#e8ded6] hover:border-transparent transition-all shadow-2xs group-hover:bg-[#b85b73] group-hover:text-white cursor-pointer"
                        >
                          <span>{event.actionText}</span>
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="button-secondary min-h-11 px-6 text-xs font-semibold"
              >
                ← Return to Home
              </button>
              <button
                type="button"
                onClick={() => onNavigate('rsvp')}
                className="button-primary min-h-11 px-6 text-xs font-bold"
              >
                Continue to RSVP 💌
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEvents;
