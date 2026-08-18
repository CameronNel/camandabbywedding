import React from 'react';
import { useWedding } from '../context/WeddingContext';
import { initialStory } from '../data/initialData';
import { Heart, Sparkles, MapPin, Quote } from 'lucide-react';

export const Story: React.FC = () => {
  const { config } = useWedding();

  return (
    <section id="story" className="py-24 relative bg-white overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/3 -right-24 w-96 h-96 bg-blush-100/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 -left-24 w-96 h-96 bg-champagne-100/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blush-50 border border-blush-200 text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <Heart className="w-3.5 h-3.5 text-blush-500 fill-blush-500" />
            <span>How We Began</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Our Love Story
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            From a chance encounter in Wilderness to promising each other forever under the Outeniqua Mountains at ArendsRus.
          </p>
        </div>

        {/* Story Grid: Couple Photo + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          {/* Couple Photo Column */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group max-w-md">
              {/* Decorative arched border */}
              <div className="absolute -inset-3 rounded-[40px] bg-gradient-to-tr from-blush-200 via-champagne-200 to-blush-300 opacity-60 blur-sm group-hover:opacity-80 transition duration-500"></div>
              
              <div className="relative rounded-[36px] overflow-hidden border-4 border-white shadow-2xl bg-stone-100">
                <img
                  src={`${import.meta.env.BASE_URL}images/couple.jpg`}
                  alt={`${config.brideShortName} and ${config.groomShortName}`}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition duration-700 aspect-[3/4]"
                  loading="lazy"
                />
                
                {/* Overlay quote badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-blush-100 shadow-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="text-xs uppercase tracking-widest font-semibold text-rosewood font-serif">
                      Engaged in the Outeniqua Foothills
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-display italic">
                    &ldquo;I found the one whom my soul loves.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Column */}
          <div className="lg:col-span-7 space-y-8 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-6 top-4 bottom-4 w-[2px] bg-gradient-to-b from-blush-200 via-blush-400 to-blush-200 hidden sm:block"></div>

            {initialStory.map((milestone, idx) => (
              <div key={idx} className="relative sm:pl-16 group">
                {/* Bullet icon on line */}
                <div className="hidden sm:flex absolute left-3 top-1.5 -translate-x-1/2 w-7 h-7 rounded-full bg-white border-2 border-blush-400 items-center justify-center shadow-sm group-hover:scale-125 group-hover:border-blush-600 transition-transform">
                  <div className="w-2.5 h-2.5 rounded-full bg-blush-500"></div>
                </div>

                {/* Milestone Card */}
                <div className="glass-card rounded-2xl p-6 sm:p-7 border border-blush-200/80 shadow-sm group-hover:shadow-md group-hover:border-blush-300 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-blush-600 bg-blush-50 px-3 py-1 rounded-full border border-blush-100">
                      {milestone.year}
                    </span>
                    {milestone.location && (
                      <div className="flex items-center gap-1 text-stone-400 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blush-400" />
                        <span>{milestone.location}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-serif font-medium text-stone-800 mb-2 group-hover:text-blush-700 transition-colors">
                    {milestone.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed font-sans">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Romantic Center Quote Card */}
        <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-r from-blush-50 via-white to-blush-50 border border-blush-200 p-8 sm:p-10 text-center relative shadow-sm">
          <Quote className="w-8 h-8 text-blush-300 mx-auto mb-3 opacity-60" />
          <blockquote className="font-display italic text-xl sm:text-2xl text-stone-700 mb-3">
            &ldquo;{config.quote}&rdquo;
          </blockquote>
          <cite className="text-xs uppercase tracking-[0.2em] font-serif font-semibold text-rosewood not-italic">
            — {config.quoteAuthor}
          </cite>
        </div>
      </div>
    </section>
  );
};
