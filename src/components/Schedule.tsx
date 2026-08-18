import React from 'react';
import { useWedding } from '../context/WeddingContext';
import { Clock, MapPin, Sparkles, HeartHandshake, Wine, Utensils, Music, Flame, Shirt } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5" />,
  HeartHandshake: <HeartHandshake className="w-5 h-5" />,
  Wine: <Wine className="w-5 h-5" />,
  Utensils: <Utensils className="w-5 h-5" />,
  Music: <Music className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />
};

export const Schedule: React.FC = () => {
  const { config, scheduleEvents } = useWedding();

  const formattedDate = new Date(config.weddingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <section id="schedule" className="py-24 relative bg-gradient-to-b from-[#FFFDFB] via-[#FFF8FA] to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blush-50 border border-blush-200 text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <Clock className="w-3.5 h-3.5 text-blush-500" />
            <span>Itinerary &amp; Timeline</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            The Wedding Day
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            {formattedDate} • An unforgettable celebration under the Outeniqua Mountains.
          </p>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {scheduleEvents.map((event, idx) => (
            <div
              key={idx}
              className="glass-card rounded-3xl p-7 border border-blush-200/90 shadow-sm glass-card-hover flex flex-col justify-between"
            >
              <div>
                {/* Time & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-serif font-semibold tracking-wider text-rosewood bg-blush-100/70 px-3.5 py-1.5 rounded-full border border-blush-200">
                    {event.time}
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blush-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-blush-500/20">
                    {iconMap[event.icon] || <Sparkles className="w-5 h-5" />}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-serif font-medium text-stone-800 mb-2">
                  {event.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium mb-3">
                  <MapPin className="w-3.5 h-3.5 text-blush-500 shrink-0" />
                  <span>{event.location}</span>
                </div>

                {/* Description */}
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                  {event.description}
                </p>
              </div>

              {event.dressCode && (
                <div className="mt-4 pt-3 border-t border-blush-100/60 flex items-center gap-1.5 text-[11px] text-blush-700 font-medium">
                  <Shirt className="w-3.5 h-3.5" />
                  <span>{event.dressCode}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dress Code Palette Card */}
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-blush-200 p-8 shadow-sm text-center">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-blush-600 mb-2">
            <Shirt className="w-4 h-4" />
            <span>Dress Code &amp; Palette</span>
          </div>
          <h4 className="text-xl font-serif font-medium text-stone-800 mb-3">
            {config.dressCode.title}
          </h4>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
            {config.dressCode.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold w-full sm:w-auto">
              Inspirational Tones:
            </span>
            {config.dressCode.palette.map((color, idx) => (
              <div
                key={idx}
                className="w-7 h-7 rounded-full border border-stone-200 shadow-sm transition hover:scale-125"
                style={{ backgroundColor: color }}
                title={`Color Swatch ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
