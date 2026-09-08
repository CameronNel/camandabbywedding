import { useId, useState, useEffect, useRef } from 'react';

export type TulipColor = 'pink' | 'sage' | 'mint' | 'peach' | 'cream' | 'terracotta' | 'yellow' | 'blue' | 'lavender' | 'periwinkle';

interface TulipPalette {
  front: [string, string, string]; // [highlight, mid, shadow]
  back: [string, string];          // [mid, shadow]
  centerTip: string;
}

const PALETTES: Record<TulipColor, TulipPalette> = {
  // 1. Dusty Rose (#E4AEB5)
  pink: {
    front: ['#faf0f2', '#E4AEB5', '#c88790'],
    back: ['#ecc2c8', '#a85f69'],
    centerTip: '#c88790',
  },
  // 2. Eucalyptus Sage Green (#9BBEAB)
  sage: {
    front: ['#f2f8f5', '#9BBEAB', '#789f8a'],
    back: ['#b4d0c1', '#5d826e'],
    centerTip: '#789f8a',
  },
  // 3. Soft Seafoam Mint (#C0DCCC)
  mint: {
    front: ['#f6faf8', '#C0DCCC', '#97bda7'],
    back: ['#d5e7dc', '#729881'],
    centerTip: '#97bda7',
  },
  // 4. Soft Peach (#F5D0C6)
  peach: {
    front: ['#fef6f4', '#F5D0C6', '#d9a99c'],
    back: ['#f8ded7', '#b97a6a'],
    centerTip: '#d9a99c',
  },
  // 5. Warm Linen / Blush (#ECE3DF)
  cream: {
    front: ['#fdfbfb', '#ECE3DF', '#cfc2bc'],
    back: ['#f2ece9', '#a89891'],
    centerTip: '#cfc2bc',
  },
  // 6. Dusty Terracotta (#E7AF9E)
  terracotta: {
    front: ['#fdf3f0', '#E7AF9E', '#c78471'],
    back: ['#eec3b5', '#a45743'],
    centerTip: '#c78471',
  },
  // Legacy / extra tints for bouquets
  yellow: {
    front: ['#fffeea', '#FFF7CF', '#fae58d'],
    back: ['#fff9db', '#deb83e'],
    centerTip: '#fae58d',
  },
  blue: {
    front: ['#f2f8ff', '#C7E0FF', '#9ac5fa'],
    back: ['#dcebff', '#679ae1'],
    centerTip: '#9ac5fa',
  },
  lavender: {
    front: ['#f7f7ff', '#CFCFFF', '#a8a8f8'],
    back: ['#e2e2ff', '#7c7cdb'],
    centerTip: '#a8a8f8',
  },
  periwinkle: {
    front: ['#f1f3ff', '#BAC3FF', '#8e9cf9'],
    back: ['#d2d9ff', '#6678e0'],
    centerTip: '#8e9cf9',
  },
};

const SPARKLE_EMOJIS = ['🌸', '✨', '💕', '🌷'];

interface SparkleParticle {
  id: number;
  dx: number;
  rot: number;
  emoji: string;
}

interface TulipSingleProps {
  color?: TulipColor;
  size?: number;
  tilt?: number;
  className?: string;
  bloomDelay?: number;
  interactive?: boolean;
}

/**
 * A cute, charming pastel tulip with delicate curved stem, soft sage leaves,
 * scroll-triggered blooming animation, and playful interactive bounce & sparkles.
 */
export function PastelTulip({
  color = 'pink',
  size = 28,
  tilt = 0,
  className = '',
  bloomDelay = 0,
  interactive = true,
}: TulipSingleProps) {
  const id = useId().replace(/:/g, '_');
  const palette = PALETTES[color];
  const containerRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [wiggling, setWiggling] = useState(false);
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -4% 0px', threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();

    // Remove focus outline if browser applies focus on click
    (e.currentTarget as HTMLElement)?.blur?.();

    // Trigger wiggle animation
    setWiggling(true);
    window.setTimeout(() => setWiggling(false), 700);

    // Emit 3 cute pastel sparkles
    const newSparkles: SparkleParticle[] = [
      { id: Date.now() + 1, dx: -18, rot: -15, emoji: SPARKLE_EMOJIS[Math.floor(Math.random() * SPARKLE_EMOJIS.length)] },
      { id: Date.now() + 2, dx: 0, rot: 5, emoji: SPARKLE_EMOJIS[Math.floor(Math.random() * SPARKLE_EMOJIS.length)] },
      { id: Date.now() + 3, dx: 18, rot: 20, emoji: SPARKLE_EMOJIS[Math.floor(Math.random() * SPARKLE_EMOJIS.length)] },
    ];
    setSparkles(newSparkles);
    window.setTimeout(() => setSparkles([]), 750);
  };

  const animClass = wiggling
    ? 'animate-tulip-wiggle'
    : inView
    ? 'animate-tulip-bloom'
    : 'opacity-0 scale-0';

  return (
    <span
      ref={containerRef}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center select-none outline-none focus:outline-none focus-visible:outline-none ${
        interactive ? 'tulip-interactive' : ''
      }`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`${color} pastel tulip`}
      onKeyDown={e => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      <svg
        viewBox="0 0 100 140"
        width={size}
        height={size * 1.4}
        className={`inline-block shrink-0 ${animClass} ${className}`}
        style={{
          transform: tilt && !wiggling ? `rotate(${tilt}deg)` : undefined,
          animationDelay: inView && !wiggling ? `${bloomDelay}ms` : undefined,
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`stem-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9cb89c" />
            <stop offset="100%" stopColor="#759475" />
          </linearGradient>
          <linearGradient id={`leaf-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#aecdab" />
            <stop offset="100%" stopColor="#81a580" />
          </linearGradient>
          <linearGradient id={`backPetal-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.back[0]} />
            <stop offset="100%" stopColor={palette.back[1]} />
          </linearGradient>
          <linearGradient id={`frontPetal-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.front[0]} />
            <stop offset="65%" stopColor={palette.front[1]} />
            <stop offset="100%" stopColor={palette.front[2]} />
          </linearGradient>
        </defs>

        {/* Stem */}
        <path
          d="M50 50 Q48 85 50 135"
          stroke={`url(#stem-${id})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left Leaf */}
        <path
          d="M50 115 Q30 90 28 65 Q38 85 50 100 Z"
          fill={`url(#leaf-${id})`}
        />

        {/* Right Leaf */}
        <path
          d="M50 105 Q72 80 75 52 Q64 75 50 90 Z"
          fill={`url(#leaf-${id})`}
        />

        {/* Tulip Bloom */}
        {/* Left Back Petal */}
        <path
          d="M50 52 C35 52 30 35 34 22 C37 12 45 28 50 38 Z"
          fill={`url(#backPetal-${id})`}
        />

        {/* Right Back Petal */}
        <path
          d="M50 52 C65 52 70 35 66 22 C63 12 55 28 50 38 Z"
          fill={`url(#backPetal-${id})`}
        />

        {/* Center Back Tip */}
        <path
          d="M43 32 Q50 12 57 32 Q50 38 43 32 Z"
          fill={palette.centerTip}
        />

        {/* Front Center Main Petal */}
        <path
          d="M37 35 C37 50 42 56 50 56 C58 56 63 50 63 35 C59 38 55 30 50 34 C45 30 41 38 37 35 Z"
          fill={`url(#frontPetal-${id})`}
        />
      </svg>

      {/* Cute floating sparkles on click */}
      {sparkles.map(sp => (
        <span
          key={sp.id}
          className="pointer-events-none absolute left-1/2 top-1/3 text-[11px] select-none"
          style={{
            animation: 'float-sparkle 0.75s ease-out forwards',
            '--dx': `${sp.dx}px`,
            '--rot': `${sp.rot}deg`,
          } as React.CSSProperties}
          aria-hidden="true"
        >
          {sp.emoji}
        </span>
      ))}
    </span>
  );
}

/**
 * A charming duo of pastel tulips leaning together (pink & lavender).
 * Each blooms smoothly as you scroll to the section.
 */
export function TulipDuo({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-end gap-[-6px] ${className}`} aria-hidden="true">
      <PastelTulip color="pink" size={size} tilt={-8} className="-mr-2.5" bloomDelay={0} />
      <PastelTulip color="lavender" size={size * 0.9} tilt={10} bloomDelay={120} />
    </span>
  );
}

/**
 * A bouquet cluster of 3 cute pastel tulips (peach, pink, lavender).
 * Staggered bloom entrance on scroll.
 */
export function TulipTrio({ className = '', size = 34 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-end justify-center ${className}`} aria-hidden="true">
      <PastelTulip color="peach" size={size * 0.85} tilt={-14} className="-mr-3" bloomDelay={0} />
      <PastelTulip color="pink" size={size} tilt={0} className="z-10" bloomDelay={100} />
      <PastelTulip color="lavender" size={size * 0.88} tilt={14} className="-ml-3" bloomDelay={200} />
    </span>
  );
}

/**
 * A decorative horizontal section divider with a cute pastel tulip cluster and subtle trailing vines.
 * When scrolled into view, lines unfold and the tulips pop up sequentially.
 */
export function TulipDivider({ className = '' }: { className?: string }) {
  const dividerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = dividerRef.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -4% 0px', threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <div ref={dividerRef} className={`relative flex items-center justify-center py-6 select-none ${className}`} aria-hidden="true">
      {/* Left leafy trailing line */}
      <div className="flex flex-1 items-center justify-end">
        <div className={`h-px w-full max-w-[140px] bg-gradient-to-r from-transparent via-[#d6c4b2]/40 to-[#c5b09d] transition-all duration-700 origin-right ${
          inView ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
        }`} />
        <span className={`mx-2 h-1.5 w-1.5 rounded-full bg-[#e8c5b2] transition-transform duration-500 delay-150 ${
          inView ? 'scale-100' : 'scale-0'
        }`} />
        <span className={`mr-3 h-2 w-2 rounded-full bg-[#fbcfe8] transition-transform duration-500 delay-300 ${
          inView ? 'scale-100' : 'scale-0'
        }`} />
      </div>

      {/* Center Tulip Bouquet */}
      <TulipTrio size={28} className="mx-3 drop-shadow-sm" />

      {/* Right leafy trailing line */}
      <div className="flex flex-1 items-center justify-start">
        <span className={`ml-3 h-2 w-2 rounded-full bg-[#e9d5ff] transition-transform duration-500 delay-300 ${
          inView ? 'scale-100' : 'scale-0'
        }`} />
        <span className={`mx-2 h-1.5 w-1.5 rounded-full bg-[#fed7aa] transition-transform duration-500 delay-150 ${
          inView ? 'scale-100' : 'scale-0'
        }`} />
        <div className={`h-px w-full max-w-[140px] bg-gradient-to-r from-[#c5b09d] via-[#d6c4b2]/40 to-transparent transition-all duration-700 origin-left ${
          inView ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
        }`} />
      </div>
    </div>
  );
}

/**
 * Charming corner ornament for invitation cards and modal boxes.
 */
export function TulipCorner({ position = 'top-right', className = '' }: { position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'; className?: string }) {
  const positionClasses = {
    'top-right': 'top-2 right-2 rotate-12',
    'top-left': 'top-2 left-2 -rotate-12 -scale-x-100',
    'bottom-right': 'bottom-2 right-2 rotate-180',
    'bottom-left': 'bottom-2 left-2 rotate-180 scale-x-100',
  }[position];

  return (
    <div className={`pointer-events-auto absolute ${positionClasses} opacity-85 transition-transform duration-300 ${className}`} aria-hidden="true">
      <TulipDuo size={24} />
    </div>
  );
}

/**
 * A sweet horizontal row of blooming pastel tulips for the footer.
 * Blooms sequentially from left to right when scrolling to the footer!
 */
export function TulipGardenRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-end justify-center gap-2 sm:gap-3 py-3 select-none ${className}`} aria-hidden="true">
      <PastelTulip color="pink" size={26} tilt={-10} bloomDelay={0} />
      <PastelTulip color="sage" size={28} tilt={-4} bloomDelay={80} />
      <PastelTulip color="mint" size={25} tilt={5} bloomDelay={160} />
      <PastelTulip color="peach" size={27} tilt={-2} bloomDelay={240} />
      <PastelTulip color="cream" size={24} tilt={6} bloomDelay={320} />
      <PastelTulip color="terracotta" size={28} tilt={-5} bloomDelay={400} />
    </div>
  );
}
