import React from 'react';
import { initialRegistry } from '../data/initialData';
import { Gift, Plane, Wine, ExternalLink, Heart, Sparkles } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Plane: <Plane className="w-6 h-6" />,
  Gift: <Gift className="w-6 h-6" />,
  Wine: <Wine className="w-6 h-6" />
};

export const Registry: React.FC = () => {
  return (
    <section id="registry" className="py-24 relative bg-gradient-to-b from-[#FFFDFB] via-[#FFF6F9] to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-blush-200 text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <Gift className="w-3.5 h-3.5 text-blush-500" />
            <span>Registry &amp; Wishes</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Gift Registry
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            Your presence at our celebration is the greatest gift of all. Should you wish to honor us with a token of love, we have curated a few options below.
          </p>
        </div>

        {/* Registry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {initialRegistry.map(item => (
            <div
              key={item.id}
              className="glass-card rounded-3xl p-8 border border-blush-200 shadow-sm glass-card-hover flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blush-500 to-rose-400 text-white flex items-center justify-center mb-6 shadow-md shadow-blush-500/20">
                  {iconMap[item.icon] || <Gift className="w-6 h-6" />}
                </div>

                <h3 className="font-serif text-xl font-medium text-stone-800 mb-2">
                  {item.title}
                </h3>

                <p className="text-stone-600 text-xs leading-relaxed mb-6">
                  {item.description}
                </p>

                {/* Progress bar for honeymoon fund */}
                {item.type === 'honeymoon' && item.goalAmount && (
                  <div className="mb-6 p-4 rounded-2xl bg-blush-50/70 border border-blush-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-stone-700">Honeymoon Fund Goal</span>
                      <span className="font-semibold text-rosewood font-serif">
                        ${item.currentAmount} / ${item.goalAmount}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-blush-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blush-500 to-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, ((item.currentAmount || 0) / item.goalAmount) * 100)}%` }}
                      ></div>
                    </div>
                    {item.accountDetails && (
                      <div className="mt-3 pt-2 border-t border-blush-200/60 text-[11px] text-stone-500 font-mono">
                        {item.accountDetails}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-full bg-white hover:bg-blush-50 border border-blush-200 text-rosewood text-xs font-medium uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>View Registry Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div className="flex items-center justify-center gap-1.5 py-3 rounded-full bg-blush-100/60 text-rosewood text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span>Contribution Welcome</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Thank You Note */}
        <div className="mt-16 text-center max-w-xl mx-auto">
          <Heart className="w-6 h-6 text-blush-400 mx-auto mb-2 fill-blush-100" />
          <p className="font-display italic text-stone-600 text-sm">
            Thank you from the bottom of our hearts for your continuous warmth, love, and support!
          </p>
        </div>
      </div>
    </section>
  );
};
