import { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  swayAmplitude: number;
  swayOffset: number;
  swaySpeed: number;
  opacity: number;
  color: string;
}

const SAKURA_COLORS = [
  'rgba(237, 201, 212, 0.85)', // 1. Dusty Rose (#EDC9D4)
  'rgba(255, 211, 201, 0.82)', // 2. Soft Peach (#FFD3C9)
  'rgba(255, 247, 207, 0.80)', // 3. Buttercream Yellow (#FFF7CF)
  'rgba(228, 240, 201, 0.80)', // 4. Matcha Sage (#E4F0C9)
  'rgba(199, 224, 255, 0.82)', // 5. Sky Blue (#C7E0FF)
  'rgba(207, 207, 255, 0.82)', // 6. Lavender (#CFCFFF)
  'rgba(186, 195, 255, 0.80)', // 7. Periwinkle (#BAC3FF)
];

export function SakuraPetals() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const petals: Petal[] = [];
    let lastSpawnTime = performance.now();

    const createPetal = (initialY?: number): Petal => ({
      x: Math.random() * width,
      y: initialY !== undefined ? initialY : -15 - Math.random() * 30,
      size: 7 + Math.random() * 9, // delicate small petals (7px to 16px)
      speedX: -0.3 + Math.random() * 0.75, // gentle soft breeze
      speedY: 0.75 + Math.random() * 1.1, // soft downward drift
      rotation: Math.random() * 360,
      rotationSpeed: (-1.5 + Math.random() * 3) * 0.02,
      flip: Math.random() * Math.PI,
      flipSpeed: 0.015 + Math.random() * 0.03,
      swayAmplitude: 0.7 + Math.random() * 1.3,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.018 + Math.random() * 0.024,
      opacity: 0.55 + Math.random() * 0.35,
      color: SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)],
    });

    // Realistic notched sakura petal drawing
    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const flipScale = Math.cos(p.flip);
      ctx.scale(1, flipScale);

      // Smooth fade-in as petal enters from the very top of the viewport
      const entryFade = Math.min(1, Math.max(0, (p.y + 15) / 50));
      ctx.globalAlpha = p.opacity * entryFade;

      ctx.beginPath();
      const s = p.size;
      ctx.moveTo(0, s * 0.8);
      ctx.bezierCurveTo(-s * 0.65, s * 0.3, -s * 0.6, -s * 0.65, -s * 0.14, -s * 0.95);
      ctx.lineTo(0, -s * 0.72);
      ctx.lineTo(s * 0.14, -s * 0.95);
      ctx.bezierCurveTo(s * 0.6, -s * 0.65, s * 0.65, s * 0.3, 0, s * 0.8);

      ctx.fillStyle = p.color;
      ctx.fill();

      // Subtle translucent vein highlight for realism
      ctx.beginPath();
      ctx.moveTo(0, s * 0.7);
      ctx.lineTo(0, -s * 0.5);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 0.65;
      ctx.stroke();

      ctx.restore();
    };

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 16.66, 2.5);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      if (!document.hidden) {
        const currentScroll = scrollYRef.current;

        // Gradual scroll calculation:
        // - Hero (< 60px): 0 petals.
        // - Starts gradually: 1..3 petals around 80-200px.
        // - Scales to full density (max 26 on desktop, 14 on mobile) around 600px+.
        let targetCount = 0;
        if (currentScroll >= 60) {
          const maxPetals = width > 768 ? 26 : 14;
          const scrollProgress = Math.min(1, (currentScroll - 60) / 500);
          const curved = Math.pow(scrollProgress, 1.4); // gentle gradual curve
          targetCount = Math.max(2, Math.round(curved * maxPetals));
        }

        // Spawn new petals one-by-one from the top at spaced intervals
        if (petals.length < targetCount && currentTime - lastSpawnTime > 260) {
          lastSpawnTime = currentTime;
          petals.push(createPetal(-15 - Math.random() * 20));
        }

        for (let i = 0; i < petals.length; i++) {
          const p = petals[i];
          p.swayOffset += p.swaySpeed * delta;
          p.x += (p.speedX + Math.sin(p.swayOffset) * p.swayAmplitude) * delta;
          p.y += p.speedY * delta;
          p.rotation += p.rotationSpeed * delta;
          p.flip += p.flipSpeed * delta;

          // Wrap horizontally if drift moves off sides
          if (p.x < -30) p.x = width + 20;
          if (p.x > width + 30) p.x = -20;

          // Exited bottom of screen
          if (p.y > height + 25) {
            if (petals.length <= targetCount) {
              // Recycle to above top of screen
              petals[i] = createPetal(-15 - Math.random() * 25);
            } else {
              // Remove petal to scale down count
              petals.splice(i, 1);
              i--;
              continue;
            }
          }

          drawPetal(p);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
