import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Gift,
  GlassWater,
  Heart,
  Home,
  MapPin,
  PartyPopper,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import type { SectionId } from './Navbar';
import { useGuestExperience } from './guestExperience';
import { formatWeddingDate } from '../utils/dates';

interface SageHelperCatProps {
  onNavigate: (section: SectionId) => void;
}

interface FAQItem {
  id: string;
  icon: React.ReactNode;
  question: string;
  shortLabel: string;
  category: 'Popular' | 'Parties' | 'Logistics' | 'Fun';
  answer: string;
  actionText?: string;
  actionSection?: SectionId;
  actionDetails?: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'bachelorette',
    icon: <GlassWater className="h-4 w-4 text-pink-500" />,
    question: 'Where is the Bachelorette party page?',
    shortLabel: 'Bachelorette Party 🥂',
    category: 'Parties',
    answer:
      "Abby's Bachelorette Hub is right here on the website! It has party details, activity ideas, and voting for the bridal party. You can jump straight there below:",
    actionText: 'Go to Bachelorette Page ✨',
    actionSection: 'bachelorette',
  },
  {
    id: 'accommodation',
    icon: <Home className="h-4 w-4 text-emerald-600" />,
    question: 'Where can I find accommodation?',
    shortLabel: 'Accommodation & Stays 🏡',
    category: 'Logistics',
    answer:
      "Accommodation recommendations are in our Setting & Stays section! Arendsrus Country Lodge offers tranquil mountain chalets, and nearby George options are listed. Note: Guest-specific stay details unlock automatically once you enter your invitation code in the RSVP section.",
    actionText: 'View Accommodations 🏡',
    actionSection: 'details',
    actionDetails: 'accommodations',
  },
  {
    id: 'bachelor',
    icon: <Target className="h-4 w-4 text-amber-600" />,
    question: 'Where is the Bachelor party page?',
    shortLabel: 'Bachelor Party 🎯',
    category: 'Parties',
    answer:
      "Cameron's Bachelor Party Hub is a private page dedicated to the Best Man and Groomsmen to vote on weekend ideas, plan braais, and coordinate details!",
    actionText: 'Go to Bachelor Page 🎯',
    actionSection: 'bachelor',
  },
  {
    id: 'venue_date',
    icon: <MapPin className="h-4 w-4 text-rose-500" />,
    question: 'Where and when is the wedding?',
    shortLabel: 'Venue & Date ⛪',
    category: 'Logistics',
    answer:
      'The wedding will be celebrated at Arendsrus Country Lodge in George, Western Cape. The date and timings unlock with your invitation code in the RSVP section.',
    actionText: 'View Venue & Map 📍',
    actionSection: 'details',
  },
  {
    id: 'rsvp',
    icon: <Heart className="h-4 w-4 text-rose-600" />,
    question: 'How do I RSVP?',
    shortLabel: 'How to RSVP 💌',
    category: 'Popular',
    answer:
      "Head down to the RSVP section, enter your personal or household invite code (like on your invitation card), and tell us if you'll be joining us, along with any dietary preferences.",
    actionText: 'Go to RSVP Section 💌',
    actionSection: 'rsvp',
  },
  {
    id: 'registry',
    icon: <Gift className="h-4 w-4 text-purple-500" />,
    question: 'Where is the gift registry?',
    shortLabel: 'Gift Registry 🎁',
    category: 'Logistics',
    answer:
      "Your presence is our greatest present! If you'd like to honor us with a gift, we've created a Honeymoon & Future Fund registry where you can contribute to our new beginning together.",
    actionText: 'View Gift Registry 🎁',
    actionSection: 'gifts',
  },
  {
    id: 'dress_code',
    icon: <Sparkles className="h-4 w-4 text-amber-500" />,
    question: 'What is the dress code?',
    shortLabel: 'Dress Code 👗',
    category: 'Popular',
    answer:
      "The dress code is Formal! Abby and Cameron want you looking stylish and feeling comfortable: 'Dress code formal, come as you are.'",
    actionText: 'View Details & Dress Code 👗',
    actionSection: 'details',
  },
  {
    id: 'who_is_sage',
    icon: <PartyPopper className="h-4 w-4 text-sky-500" />,
    question: 'Who is Sage the cat?',
    shortLabel: 'Who are you? 🐱',
    category: 'Fun',
    answer:
      "That's me! 🐾 I'm Cameron and Abby's calico cat! You might have noticed my funny slouched sitting pose on the stairs in the Photo Gallery. I'm here on the website to keep an eye on things and give all our wedding guests a helping paw!",
    actionText: 'See Me in Photo Gallery 📸',
    actionSection: 'gallery',
  },
];

export const SageHelperCat: React.FC<SageHelperCatProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [speechBubbleDismissed, setSpeechBubbleDismissed] = useState(false);
  const [showBubble] = useState(true);
  const [selectedFaq, setSelectedFaq] = useState<FAQItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // When a chat message is selected, scroll smoothly into view
  useEffect(() => {
    if (selectedFaq && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedFaq]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const { isUnlocked, site } = useGuestExperience();
  const formattedDate = site.dateIsTbc ? 'Date to be confirmed' : formatWeddingDate(site.weddingDate);

  const faqs = useMemo(() => {
    return FAQ_LIST.map(item => {
      if (item.id === 'venue_date') {
        return {
          ...item,
          answer: isUnlocked
            ? `The wedding will be celebrated at ${site.venueName} on Koesterbos Road, Geelhoutboom in George, Western Cape. The celebration takes place on ${formattedDate} at ${site.ceremonyTime || '15:00'}!`
            : `The celebration takes place at ${site.venueName} in George, Western Cape. The confirmed celebration date, ceremony time, and schedule unlock as soon as you enter your invitation code in the RSVP section below! 💌`,
        };
      }
      return item;
    });
  }, [isUnlocked, site.venueName, site.ceremonyTime, formattedDate]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      item =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.shortLabel.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [searchQuery, faqs]);

  const handleActionClick = (faq: FAQItem) => {
    if (faq.actionSection) {
      onNavigate(faq.actionSection);
      // If accommodations, scroll specifically to the stays element
      if (faq.actionDetails === 'accommodations') {
        setTimeout(() => {
          const el = document.getElementById('details');
          if (el) {
            const stayBlock = el.querySelector('.mt-16.border-t');
            if (stayBlock) {
              stayBlock.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }, 300);
      }
    }
    setSelectedFaq(null);
    setIsOpen(false);
  };

  const handleCatClick = () => {
    setIsOpen(prev => !prev);
    setSpeechBubbleDismissed(true);
  };

  return (
    <aside
      aria-label="Helper Cat and Wedding FAQs"
      className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-40 flex flex-col items-start select-none"
    >
      {/* 1. CHAT WINDOW / FAQ DRAWER */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Chat with Sage"
          className="mb-3 w-[330px] sm:w-[380px] max-w-[calc(100vw-2rem)] rounded-3xl border border-[#eedce2] bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#f3e5e9] bg-gradient-to-r from-[#fff3f5] via-[#fdf5f6] to-[#f7f0f3] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={`${import.meta.env.BASE_URL}images/sage-helper.png`}
                  alt="Sage the cat"
                  className="h-10 w-10 object-contain drop-shadow-xs"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  Sage 🐾
                  <span className="rounded-full bg-[#b85b73]/10 px-2 py-0.5 text-[10px] font-bold text-[#b85b73]">
                    Wedding Guide
                  </span>
                </h3>
                <p className="text-[11px] text-stone-500">Always here to help you · Meow!</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {/* Sage initial greeting */}
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 shrink-0 rounded-full bg-[#fdf2f4] border border-[#e4aeb5]/40 flex items-center justify-center text-sm shadow-2xs">
                🐱
              </div>
              <div className="rounded-2xl rounded-tl-none bg-[#fdf5f7] border border-[#f3e3e7] p-3 text-stone-700 leading-relaxed shadow-2xs">
                <p>
                  <strong>Meow! I&apos;m Sage</strong>, Cameron and Abby&apos;s cat 🐾
                </p>
                <p className="mt-1">
                  Need help finding something on our wedding website? Pick a question below or search what you need!
                </p>
              </div>
            </div>

            {/* Selected Question & Sage Answer */}
            {selectedFaq && (() => {
              const activeFaq = faqs.find(f => f.id === selectedFaq.id) || selectedFaq;
              return (
                <>
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-none bg-[#b85b73] text-white p-3 max-w-[85%] shadow-2xs">
                      <p className="font-medium">{activeFaq.question}</p>
                    </div>
                  </div>

                  {/* Sage response */}
                  <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-[#fdf2f4] border border-[#e4aeb5]/40 flex items-center justify-center text-sm shadow-2xs">
                      🐾
                    </div>
                    <div data-testid="sage-answer" className="rounded-2xl rounded-tl-none bg-[#fdf5f7] border border-[#f3e3e7] p-3 text-stone-700 leading-relaxed space-y-2.5 shadow-2xs">
                      <p>{activeFaq.answer}</p>
                      {activeFaq.actionText && (
                        <button
                          type="button"
                          data-testid="sage-action-btn"
                          onClick={() => handleActionClick(activeFaq)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#b85b73] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#a04255] transition transform active:scale-95"
                        >
                          <span>{activeFaq.actionText}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reset button to choose another */}
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedFaq(null)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#b85b73] hover:underline"
                    >
                      ← Ask another question
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Question Suggestion Chips */}
            {!selectedFaq && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  Frequently Asked Questions
                </p>

                <div className="space-y-1.5">
                  {filteredFaqs.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedFaq(item)}
                      className="w-full text-left flex items-center justify-between gap-2 rounded-xl border border-stone-200/80 bg-stone-50/70 p-2.5 hover:border-[#e4aeb5] hover:bg-[#fff9fa] transition group"
                    >
                      <span className="flex items-center gap-2 text-stone-700 group-hover:text-[#b85b73] font-medium text-xs">
                        <span>{item.icon}</span>
                        <span>{item.question}</span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#b85b73] shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}

                  {filteredFaqs.length === 0 && (
                    <div className="py-4 text-center text-stone-600 text-xs">
                      No matching questions found for &ldquo;{searchQuery}&rdquo;. Try asking about &ldquo;bachelorette&rdquo;, &ldquo;hotel&rdquo;, or &ldquo;rsvp&rdquo;!
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Search Footer */}
          <div className="border-t border-stone-100 bg-stone-50/80 p-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (selectedFaq) setSelectedFaq(null);
                }}
                placeholder="Search FAQs (e.g. bachelorette, stay)..."
                className="w-full rounded-full border border-stone-200 bg-white pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-600 focus:border-[#e4aeb5] focus:outline-none focus:ring-1 focus:ring-[#e4aeb5]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. FLOATING HELPER CAT & SPEECH BUBBLE TRIGGER */}
      <div className="flex items-end gap-2.5">
        {/* The Animated Cat Button */}
        <button
          type="button"
          onClick={handleCatClick}
          aria-expanded={isOpen}
          aria-label="Ask Sage for help"
          className="group relative flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none"
        >
          {/* Subtle warm glow behind Sage */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#e4aeb5]/40 to-[#f5d0c6]/50 blur-sm opacity-70 group-hover:opacity-100 transition-opacity" />

          {/* Sage Cartoon Sticker */}
          <div className="relative h-14 w-14 sm:h-22 sm:w-22 drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)] transition-transform group-hover:-translate-y-1">
            <img
              src={`${import.meta.env.BASE_URL}images/sage-helper.png`}
              alt="Sage the helper cat"
              className="h-full w-full object-contain pointer-events-none"
            />

            {/* Notification Badge / Online Dot */}
            <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>
        </button>

        {/* 'Need help?' Speech Bubble */}
        {!isOpen && showBubble && !speechBubbleDismissed && (
          <div
            role="status"
            className="mb-2 sm:mb-4 relative rounded-2xl border-2 border-[#e4aeb5] bg-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-stone-800 shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Speech bubble pointer arrow */}
            <div className="absolute -left-2 bottom-3 h-3 w-3 -rotate-45 border-l-2 border-b-2 border-[#e4aeb5] bg-white" />

            <button
              type="button"
              onClick={handleCatClick}
              className="flex items-center gap-1.5 text-stone-800 hover:text-[#b85b73] transition"
            >
              <span>Need help?</span>
              <span className="text-sm">🐾</span>
            </button>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSpeechBubbleDismissed(true);
              }}
              className="ml-1 rounded-full p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
              title="Dismiss"
              aria-label="Dismiss speech bubble"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SageHelperCat;

