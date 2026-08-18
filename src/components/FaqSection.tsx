import React, { useState } from 'react';
import { initialFaqs } from '../data/initialData';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(initialFaqs[0].id);

  const toggle = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-24 relative bg-white overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blush-50 border border-blush-200 text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-blush-500" />
            <span>Common Questions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            Everything you need to know about our big celebration weekend.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {initialFaqs.map(faq => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="glass-card rounded-2xl border border-blush-200/90 overflow-hidden transition-all shadow-sm hover:border-blush-300"
              >
                <button
                  onClick={() => toggle(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif text-base sm:text-lg text-stone-800 hover:text-blush-700 transition"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-gold shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-stone-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 text-blush-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 border-t border-blush-100 text-stone-600 text-sm leading-relaxed font-sans animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need more help contact box */}
        <div className="mt-12 text-center text-xs text-stone-500 bg-blush-50/60 p-6 rounded-3xl border border-blush-100 max-w-md mx-auto">
          <span className="block font-serif font-medium text-stone-800 text-sm mb-1">
            Have additional questions or special needs?
          </span>
          <span>Please feel free to reach out to our wedding coordinators at </span>
          <a href="mailto:wedding.planning@example.com" className="text-blush-600 font-medium underline">
            sophia.alex.wedding@example.com
          </a>
        </div>
      </div>
    </section>
  );
};
