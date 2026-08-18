import React from 'react';
import { initialBridalParty } from '../data/initialData';
import { Sparkles, Users } from 'lucide-react';

export const BridalParty: React.FC = () => {
  return (
    <section id="bridal-party" className="py-24 relative bg-gradient-to-b from-[#FFF5F8] via-[#FFFDFB] to-[#FFF9FA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-blush-200 text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <Users className="w-3.5 h-3.5 text-blush-500" />
            <span>The Wedding Entourage</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Our Bridal Party
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            Our dearest siblings, lifelong best friends, and the pillars of our journey.
          </p>
        </div>

        {/* Bridal Party Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {initialBridalParty.map(member => (
            <div
              key={member.id}
              className="glass-card rounded-3xl p-6 border border-blush-200 shadow-sm glass-card-hover text-center flex flex-col items-center justify-between"
            >
              <div>
                {/* Circular Floral Border Avatar */}
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blush-300 via-champagne-300 to-blush-400 mx-auto mb-4 shadow-md">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-rosewood font-serif text-2xl font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>

                {/* Role Badge */}
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blush-50 border border-blush-200 text-blush-700 text-[11px] font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3 text-gold" />
                  <span>{member.role}</span>
                </div>

                <h4 className="text-lg font-serif font-medium text-stone-800 mb-1">
                  {member.name}
                </h4>

                <p className="text-xs text-rosewood font-medium mb-3">
                  {member.relation}
                </p>

                <p className="text-stone-600 text-xs leading-relaxed font-sans">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
