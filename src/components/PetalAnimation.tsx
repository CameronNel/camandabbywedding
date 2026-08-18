import React, { useMemo } from 'react';

interface Petal {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
  animationClass: string;
}

export const PetalAnimation: React.FC = () => {
  const petals: Petal[] = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: Math.random() * 96 + 2, // 2% to 98%
      animationDuration: 11 + Math.random() * 12, // 11s - 23s
      animationDelay: Math.random() * 10,
      size: 14 + Math.random() * 16, // 14px - 30px
      opacity: 0.35 + Math.random() * 0.45,
      animationClass: i % 2 === 0 ? 'petal-1' : 'petal-2'
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden" aria-hidden="true">
      {petals.map(petal => (
        <div
          key={petal.id}
          className={`absolute top-[-40px] ${petal.animationClass}`}
          style={{
            left: `${petal.left}%`,
            animationDuration: `${petal.animationDuration}s`,
            animationDelay: `${petal.animationDelay}s`,
            opacity: petal.opacity,
            width: `${petal.size}px`,
            height: `${petal.size * 1.3}px`
          }}
        >
          {/* Delicate SVG Rose Petal */}
          <svg viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <path
              d="M15 0C25 10 32 25 22 36C15 44 2 34 0 25C-2 15 8 2 15 0Z"
              fill="url(#petalGradient)"
            />
            <defs>
              <linearGradient id="petalGradient" x1="0" y1="0" x2="30" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE2E4" />
                <stop offset="0.5" stopColor="#FFCCD5" />
                <stop offset="1" stopColor="#FBB1BD" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </div>
  );
};
