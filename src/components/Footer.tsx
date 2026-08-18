import React from 'react';
import { useWedding } from '../context/WeddingContext';
import { Lock, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const { config, setIsAdminOpen } = useWedding();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-900 text-stone-300 py-14 relative overflow-hidden border-t border-stone-800">
      {/* Subtle top rose glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-24 bg-blush-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Monogram */}
        <div className="w-12 h-12 rounded-full border border-stone-700 bg-stone-800/80 mx-auto flex items-center justify-center mb-4 shadow-inner">
          <span className="font-script text-2xl text-blush-300">
            {config.brideShortName[0]} &amp; {config.groomShortName[0]}
          </span>
        </div>

        {/* Names */}
        <h3 className="font-serif text-xl sm:text-2xl text-white font-light tracking-wide mb-1">
          {config.brideShortName} &amp; {config.groomShortName}
        </h3>

        <div className="text-blush-400 font-medium text-xs uppercase tracking-[0.25em] mb-4">
          {config.hashtag}
        </div>

        <p className="font-display italic text-sm text-stone-400 max-w-md mx-auto mb-6">
          &ldquo;Whatever our souls are made of, his and mine are the same.&rdquo;
        </p>

        {/* Tab Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-400 uppercase tracking-widest mb-8">
          <button onClick={() => navigateTo('#home')} className="hover:text-blush-300 transition">Home</button>
          <button onClick={() => navigateTo('#rsvp')} className="hover:text-blush-300 transition text-blush-400 font-semibold">RSVP</button>
          <button onClick={() => navigateTo('#details')} className="hover:text-blush-300 transition">Schedule &amp; Venue</button>
          <button onClick={() => navigateTo('#story')} className="hover:text-blush-300 transition">Our Story &amp; Gallery</button>
          <button onClick={() => navigateTo('#registry')} className="hover:text-blush-300 transition">Registry &amp; Wishes</button>
        </div>

        {/* Admin and Back to top */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-stone-800/80 text-xs text-stone-400 gap-4">
          <p>© 2027 {config.brideShortName} &amp; {config.groomShortName}. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1.5 text-stone-400 hover:text-blush-300 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Organizer Portal</span>
            </button>

            <button
              onClick={scrollToTop}
              className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              title="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
