import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand, Images, X } from 'lucide-react';
import { Reveal } from './Reveal';
import { useGuestExperience } from './guestExperience';

export function PhotoGallery() {
  const { galleryItems } = useGuestExperience();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const activeItem = activeIndex === null ? null : galleryItems[activeIndex];

  const open = (index: number) => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setActiveIndex(index);
  };

  const close = useCallback(() => {
    setActiveIndex(null);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  const move = useCallback((direction: -1 | 1) => {
    setActiveIndex(current => {
      if (current === null || !galleryItems.length) return null;
      return (current + direction + galleryItems.length) % galleryItems.length;
    });
  }, [galleryItems.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeIndex, close, move]);

  return (
    <section id="gallery" className="anchor-section overflow-hidden bg-[#343832] px-5 py-24 text-white sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="grid items-end gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="eyebrow text-[#d9c8b4]">A few glimpses</p>
            <h2 className="section-title text-white">The place, and us</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/[0.62] lg:pb-2">
            A quiet preview of ArendsRus Country Lodge and a few moments from our life together. We’ll add more photographs as the celebration draws closer.
          </p>
        </Reveal>

        <div className="mt-14 grid auto-rows-[230px] gap-4 sm:auto-rows-[300px] sm:grid-cols-2 lg:grid-cols-12">
          {galleryItems.map((item, index) => (
            <Reveal
              key={item.id}
              delay={Math.min(index, 3) * 60}
              className={index === 0 ? 'sm:col-span-2 lg:col-span-7 lg:row-span-2' : index === 1 ? 'lg:col-span-5' : 'lg:col-span-5'}
            >
              <button
                type="button"
                onClick={() => open(index)}
                className="gallery-card group relative h-full w-full overflow-hidden rounded-[1.5rem] bg-stone-800 text-left focus-visible:outline-none"
                aria-label={`Open photo: ${item.title}`}
              >
                <img src={item.src} alt={item.alt} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" loading={index === 0 ? 'eager' : 'lazy'} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
                  <span>
                    <span className="block font-display text-2xl font-semibold text-white">{item.title}</span>
                    {item.caption && <span className="mt-1 block max-w-xl text-xs leading-5 text-white/[0.65]">{item.caption}</span>}
                  </span>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-sm transition group-hover:bg-white group-hover:text-stone-800">
                    <Expand className="h-4 w-4" />
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>

        {!galleryItems.length && (
          <div className="mt-14 rounded-[2rem] border border-white/15 bg-white/5 p-10 text-center">
            <Images className="mx-auto h-7 w-7 text-[#d9c8b4]" />
            <p className="mt-4 text-sm text-white/65">The gallery is being prepared.</p>
          </div>
        )}
      </div>

      {activeItem && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#161714]/95 p-3 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${activeItem.title}`}
          onMouseDown={event => {
            if (event.currentTarget === event.target) close();
          }}
        >
          <div className="relative flex max-h-[92svh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#272a26] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/[0.55]">{activeIndex! + 1} of {galleryItems.length}</span>
              <button ref={closeButtonRef} type="button" onClick={close} className="grid h-11 w-11 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white" aria-label="Close photo">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-black/20">
              <img src={activeItem.src} alt={activeItem.alt} className="mx-auto max-h-[68svh] w-full object-contain" />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl font-semibold text-white sm:text-2xl">{activeItem.title}</h3>
                {activeItem.caption && <p className="mt-1 truncate text-xs text-white/[0.55]">{activeItem.caption}</p>}
              </div>
              {galleryItems.length > 1 && (
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => move(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:bg-white hover:text-stone-900" aria-label="Previous photo"><ArrowLeft className="h-4 w-4" /></button>
                  <button type="button" onClick={() => move(1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:bg-white hover:text-stone-900" aria-label="Next photo"><ArrowRight className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
