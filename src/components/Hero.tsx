import React, { useState, useEffect } from 'react';
import { useWedding } from '../context/WeddingContext';
import { generateIcsFile, getGoogleCalendarUrl } from '../utils/storage';
import { CutePrintButton } from './PrintInvitationModal';
import type { TabId } from './Navbar';
import {
  Calendar,
  MapPin,
  Heart,
  ChevronDown,
  Sparkles,
  Download,
  ExternalLink,
  Search,
  Clock,
  ArrowRight
} from 'lucide-react';

interface HeroProps {
  onNavigateTab: (tab: TabId) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigateTab }) => {
  const { config, searchGuest, setActiveGuest } = useWedding();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [searchError, setSearchError] = useState('');

  // Dynamic countdown timer
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(config.weddingDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [config.weddingDate]);

  const formattedDate = new Date(config.weddingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!quickSearch.trim()) {
      onNavigateTab('rsvp');
      return;
    }
    const match = searchGuest(quickSearch);
    if (match) {
      setActiveGuest(match);
      onNavigateTab('rsvp');
    } else {
      setSearchError(`Couldn't find an invitation for "${quickSearch}". Please check spelling or register on the RSVP tab.`);
    }
  };

  return (
    <section className="relative min-h-[90vh] pt-28 pb-16 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FFF9FA] via-[#FFFDFB] to-[#FFF5F8]">
      {/* Background Floral Overlay Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: `url("${import.meta.env.BASE_URL}images/hero-floral.jpg")` }}
      />

      {/* Soft Glow radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-pink-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Subtle Pre-header badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 border border-blush-200 shadow-sm mb-6 animate-pulse-subtle backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-blush-500" />
          <span className="text-xs uppercase tracking-[0.25em] text-rosewood font-medium">
            Save The Date &amp; Official RSVP
          </span>
          <Sparkles className="w-3.5 h-3.5 text-blush-500" />
        </div>

        {/* Invitation Calligraphy Heading */}
        <p className="font-script text-3xl sm:text-4xl md:text-5xl text-blush-600 mb-2 font-normal">
          Together with their families
        </p>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-stone-800 tracking-tight font-light leading-none mb-4">
          <span className="block">{config.brideShortName}</span>
          <span className="font-script text-4xl sm:text-6xl md:text-7xl text-blush-500 my-1 block font-normal">
            &amp;
          </span>
          <span className="block">{config.groomShortName}</span>
        </h1>

        {/* Romantic Tagline */}
        <p className="font-display italic text-lg sm:text-xl md:text-2xl text-stone-600 max-w-xl mx-auto mb-8 font-normal">
          &ldquo;{config.tagline}&rdquo;
        </p>

        {/* Wedding Date & Location Card */}
        <div className="max-w-lg mx-auto bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-blush-200/80 shadow-lg shadow-blush-900/5 mb-8 transition-all hover:shadow-xl hover:border-blush-300">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-stone-700">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blush-100/80 flex items-center justify-center text-blush-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">The Date</div>
                <div className="text-sm font-serif font-semibold text-stone-800">{formattedDate}</div>
              </div>
            </div>

            <div className="hidden sm:block w-[1px] h-10 bg-blush-200"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blush-100/80 flex items-center justify-center text-blush-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">The Setting</div>
                <div className="text-sm font-serif font-semibold text-stone-800">ArendsRus, George, South Africa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-3 font-medium">
            Counting Down To Our Forever
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Mins', value: timeLeft.minutes },
              { label: 'Secs', value: timeLeft.seconds }
            ].map((item, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-3 sm:p-4 text-center border border-blush-200/90 shadow-sm"
              >
                <div className="text-2xl sm:text-4xl font-serif font-semibold text-rosewood mb-0.5">
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto relative mb-6">
          {/* Switch to RSVP Tab */}
          <button
            onClick={() => onNavigateTab('rsvp')}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-blush-500 via-rose-500 to-blush-600 text-white shadow-lg shadow-blush-500/30 hover:shadow-blush-500/45 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>RSVP To Attend</span>
          </button>

          {/* Switch to Schedule & Venue Tab */}
          <button
            onClick={() => onNavigateTab('details')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium uppercase tracking-wider bg-white/90 hover:bg-white text-stone-700 border border-blush-300 shadow-md hover:border-blush-400 transition"
          >
            <Clock className="w-4 h-4 text-blush-600" />
            <span>Schedule &amp; Venue</span>
          </button>
        </div>

        {/* Cute Print Keepsake Invitation & Calendar Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <CutePrintButton />

          {/* Calendar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-medium uppercase tracking-wider bg-white/90 hover:bg-white text-stone-700 border border-blush-200 shadow-sm hover:border-blush-300 transition"
            >
              <Calendar className="w-3.5 h-3.5 text-blush-500" />
              <span>Add to Calendar</span>
              <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${calendarOpen ? 'rotate-180' : ''}`} />
            </button>

            {calendarOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 bg-white rounded-2xl shadow-xl border border-blush-100 p-2 z-30 animate-fadeIn text-left">
                <a
                  href={getGoogleCalendarUrl(config)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setCalendarOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blush-50 text-xs font-medium text-stone-700 transition"
                >
                  <ExternalLink className="w-4 h-4 text-blush-500" />
                  <span>Google Calendar</span>
                </a>
                <button
                  onClick={() => {
                    generateIcsFile(config);
                    setCalendarOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blush-50 text-xs font-medium text-stone-700 transition text-left"
                >
                  <Download className="w-4 h-4 text-blush-500" />
                  <span>Apple / Outlook (.ics)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Invitation Lookup Banner */}
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-blush-200 shadow-md text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-rosewood font-serif">
              Quick RSVP Search
            </span>
            <button
              onClick={() => onNavigateTab('rsvp')}
              className="text-[11px] text-blush-600 hover:text-blush-800 font-medium flex items-center gap-0.5"
            >
              <span>Open RSVP Tab</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <form onSubmit={handleQuickLookup} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter your name (e.g. Eleanor)"
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-blush-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blush-500 hover:bg-blush-600 text-white text-xs font-medium shrink-0 transition"
            >
              Lookup
            </button>
          </form>

          {searchError && (
            <p className="text-[11px] text-rose-600 mt-2">{searchError}</p>
          )}
        </div>
      </div>
    </section>
  );
};
