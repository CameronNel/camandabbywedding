import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const PETS_STORAGE_KEY = 'wedding_anne_pets_count';

interface FloatingHeart {
  id: number;
  emoji: string;
  leftOffset: number;
}

const PURR_PHRASES = [
  'Purrrr... ❤️',
  'Meow! 🐾',
  'Happy purrs! ✨',
  'Chin scratches are the best! 😻',
  'Anne approves of you! 💖',
  'Purr purr purr... 🧶',
];

export const AnnePeekingCat: React.FC = () => {
  const [petsCount, setPetsCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = window.localStorage.getItem(PETS_STORAGE_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [isPeeking, setIsPeeking] = useState(false);
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [currentPhrase, setCurrentPhrase] = useState(PURR_PHRASES[0]);

  // Periodic Pop-up Easter Egg Timers
  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;
    let nextPeekTimeout: ReturnType<typeof setTimeout> | null = null;

    // First appearance after 8 seconds of browsing
    const initialTimeout = setTimeout(() => {
      setIsPeeking(true);
    }, 8000);

    return () => {
      clearTimeout(initialTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
      if (nextPeekTimeout) clearTimeout(nextPeekTimeout);
    };
  }, []);

  // Handle auto-hide and rescheduling next appearance
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let nextTimer: ReturnType<typeof setTimeout> | null = null;

    if (isPeeking) {
      // Stay visible for 12 seconds if not interacting
      hideTimer = setTimeout(() => {
        setIsPeeking(false);
        setIsBubbleOpen(false);
      }, 12000);
    } else {
      // Next peek between 25 and 45 seconds later
      const delay = Math.floor(Math.random() * 20000) + 25000;
      nextTimer = setTimeout(() => {
        setIsPeeking(true);
      }, delay);
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      if (nextTimer) clearTimeout(nextTimer);
    };
  }, [isPeeking]);

  // Save to localStorage whenever count changes
  useEffect(() => {
    if (typeof window !== 'undefined' && petsCount > 0) {
      try {
        window.localStorage.setItem(PETS_STORAGE_KEY, petsCount.toString());
      } catch {}
    }
  }, [petsCount]);

  const triggerPeek = () => {
    setIsPeeking(true);
  };

  const duckDown = () => {
    setIsPeeking(false);
    setIsBubbleOpen(false);
  };

  const handlePet = () => {
    const nextCount = petsCount + 1;
    setPetsCount(nextCount);
    setIsBubbleOpen(true);

    // Keep Anne visible longer while being actively petted
    setIsPeeking(true);

    // Pick a cute purr phrase
    const randomPhrase = PURR_PHRASES[Math.floor(Math.random() * PURR_PHRASES.length)];
    setCurrentPhrase(randomPhrase);

    // Spawn floating heart particle
    const emojis = ['❤️', '🐾', '✨', '😻', '💕'];
    const newHeart: FloatingHeart = {
      id: Date.now() + Math.random(),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      leftOffset: Math.floor(Math.random() * 60) - 30, // -30px to +30px offset
    };
    setFloatingHearts(prev => [...prev, newHeart]);

    // Clean up heart particle after 1.2s
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1200);
  };

  return (
    <>
      {/* Invisible corner hover trigger / easter egg hotspot when Anne is hiding */}
      {!isPeeking && (
        <div
          onMouseEnter={triggerPeek}
          onClick={triggerPeek}
          title="Psst... looking for something?"
          aria-hidden="true"
          className="fixed bottom-0 right-0 w-16 h-12 z-20 cursor-pointer opacity-0 hover:opacity-100 transition-opacity flex items-end justify-end p-2 pointer-events-auto"
        >
          <span className="text-[11px] select-none text-stone-400 font-mono">🐾</span>
        </div>
      )}

      <aside
        aria-label="Anne the Cat Easter Egg"
        className={`fixed bottom-0 right-4 sm:right-6 z-30 flex flex-col items-end select-none transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isPeeking
            ? 'translate-y-2 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Speech Bubble & Pet Counter */}
        {isBubbleOpen && (
          <div
            role="status"
            className="mb-2 relative max-w-[240px] rounded-2xl border-2 border-[#e4aeb5] bg-white/95 backdrop-blur-md p-3 text-xs font-medium text-stone-800 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            {/* Bubble Tail */}
            <div className="absolute -bottom-2 right-8 h-3 w-3 -rotate-45 border-l-2 border-b-2 border-[#e4aeb5] bg-white" />

            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => setIsBubbleOpen(false)}
              className="absolute top-1.5 right-1.5 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              title="Close speech bubble"
              aria-label="Close speech bubble"
            >
              <X className="h-3 w-3" />
            </button>

            <div className="space-y-1.5 pr-3">
              <p className="font-bold text-[#b85b73] flex items-center gap-1.5 text-[13px]">
                <span>{currentPhrase}</span>
              </p>
              <p className="text-[11px] text-stone-600 leading-snug">
                You found <strong>Anne</strong>!
              </p>
              <div className="mt-1 flex items-center justify-between pt-1 border-t border-pink-100 text-[11px]">
                <span className="font-bold text-stone-800">
                  Pets given: <span className="text-[#b85b73] font-mono">{petsCount}</span> 🐾
                </span>
                <span className="text-[10px] text-stone-400">Pet again!</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Hearts Container */}
        <div className="relative w-full pointer-events-none">
          {floatingHearts.map(h => (
            <span
              key={h.id}
              className="absolute bottom-16 text-lg animate-float-heart transition"
              style={{
                left: `calc(50% + ${h.leftOffset}px)`,
                animation: 'floatUp 1.2s ease-out forwards',
              }}
            >
              {h.emoji}
            </span>
          ))}
        </div>

        {/* The Peeking Cat Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={handlePet}
            onMouseEnter={() => {
              if (!isBubbleOpen && petsCount === 0) {
                setIsBubbleOpen(true);
              }
            }}
            aria-label="Pet Anne the cat"
            className="relative block transform transition-all duration-300 ease-out hover:-translate-y-2 active:scale-95 focus:outline-none cursor-pointer"
          >
            {/* Gentle warm aura on hover */}
            <div className="absolute -inset-1 rounded-full bg-[#e4aeb5]/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Anne Peeking Cartoon Sticker */}
            <div className="relative h-20 w-24 sm:h-24 sm:w-28 drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
              <img
                src={`${import.meta.env.BASE_URL}images/anne-peeking.png`}
                alt="Anne peeking tabby cat"
                className="h-full w-full object-contain pointer-events-none"
              />
            </div>
          </button>

          {/* Duck down button */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              duckDown();
            }}
            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-stone-400 hover:text-stone-700 rounded-full p-1 border border-stone-200 shadow-xs text-[10px]"
            title="Send Anne back down"
            aria-label="Send Anne back down"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Floating animation keyframes style tag */}
        <style>{`
          @keyframes floatUp {
            0% {
              opacity: 1;
              transform: translateY(0) scale(0.8);
            }
            50% {
              opacity: 0.9;
              transform: translateY(-24px) scale(1.1);
            }
            100% {
              opacity: 0;
              transform: translateY(-48px) scale(0.9);
            }
          }
        `}</style>
      </aside>
    </>
  );
};
export default AnnePeekingCat;
