import React from 'react';
import {
  Calendar,
  Clock,
  Compass,
  Heart,
  Lock,
  MapPin,
  Sparkles,
  Unlock,
  Users,
  ChevronRight,
  PartyPopper,
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
  const { isUnlocked, activeHousehold, site } = useGuestExperience();

  const events: EventItem[] = [
    {
      id: 'bridal_shower',
      title: 'Bridal Shower',
      badge: isUnlocked ? 'Confirmed Date' : 'Pre-Wedding Celebration',
      badgeType: 'rose',
      dateDisplay: isUnlocked ? 'Tuesday, 5 January 2027' : '5 Jan 2027',
      timeDisplay: isUnlocked ? 'Afternoon Tea · 14:00' : 'Afternoon',
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
      badge: isUnlocked ? 'The Big Day' : 'Save The Date',
      badgeType: 'gold',
      dateDisplay: isUnlocked ? 'Sunday, 1 August 2027' : 'August 2027',
      timeDisplay: isUnlocked ? (site.ceremonyTime ? `Ceremony at ${site.ceremonyTime}` : 'Ceremony at 15:00') : 'Ceremony & Reception',
      locationDisplay: isUnlocked ? `${site.venueName}, George, Western Cape` : 'Arendsrus, George',
      audience: 'All Invited Wedding Guests',
      description:
        'The sacred moment Cameron and Abby exchange vows, followed by an evening of festive feast, heartfelt toasts, and dancing under the mountain stars!',
      icon: <Heart className="h-5 w-5 text-[#c59b48]" />,
      actionText: 'RSVP For The Wedding 💌',
      actionSection: 'rsvp',
      confirmed: true,
    },
  ];

  return (
    <section id="events" className="anchor-section relative z-10 scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="font-script text-2xl text-[#b85b73] sm:text-3xl">The Road to I Do</p>
          <h2 className="mt-1 font-serif text-3xl font-normal tracking-tight text-[#2b2624] sm:text-4xl md:text-5xl">
            Upcoming Celebrations
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#655e5b] sm:text-base">
            Key milestones, gatherings, and celebrations leading up to our wedding day.
          </p>

          {/* Invitation Status Banner */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#e8ded6] bg-white/80 px-4 py-1.5 text-xs text-[#655e5b] shadow-2xs backdrop-blur-xs">
            {isUnlocked && activeHousehold ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-[#527d65]" />
                <span>
                  Celebration itinerary unlocked for{' '}
                  <strong className="font-semibold text-[#2b2624]">{activeHousehold.name}</strong>
                </span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-[#b85b73]" />
                <span>
                  Enter your invitation code in the RSVP section to unlock celebration times & details
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('rsvp')}
                  className="ml-1 inline-flex items-center gap-1 font-semibold text-[#b85b73] hover:underline cursor-pointer"
                >
                  <span>Enter Code</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
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
                className="group relative flex flex-col justify-between rounded-3xl border border-[#ede5dd] bg-white/90 p-6 shadow-xs backdrop-blur-xs transition duration-300 hover:-translate-y-1 hover:border-[#c97a8b]/40 hover:shadow-lg hover:shadow-stone-200/50"
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
      </div>
    </section>
  );
};

export default UpcomingEvents;
