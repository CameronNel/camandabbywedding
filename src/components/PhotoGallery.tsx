import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand, Images, Pause, Play, X } from 'lucide-react';
import { Reveal } from './Reveal';
import { useGuestExperience } from './guestExperience';
import { TulipDuo, PastelTulip } from './decorations/TulipAccents';

const SLIDE_DURATION_MS = 5000;

export function PhotoGallery() {
  const { galleryItems } = useGuestExperience();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const total = galleryItems.length;

  const nextSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex(prev => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex(prev => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isPlaying || isHovered || total <= 1 || lightboxIndex !== null) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % total);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, total, lightboxIndex, currentIndex]);

  const openLightbox = (index: number) => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setLightboxIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  const moveLightbox = useCallback((direction: -1 | 1) => {
    setLightboxIndex(current => {
      if (current === null || !total) return null;
      return (current + direction + total) % total;
    });
  }, [total]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') moveLightbox(-1);
      if (event.key === 'ArrowRight') moveLightbox(1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxIndex, closeLightbox, moveLightbox]);

  const currentItem = galleryItems[currentIndex] || galleryItems[0];
  const lightboxItem = lightboxIndex !== null ? galleryItems[lightboxIndex] : null;

  return (
    <section id="gallery" className="anchor-section relative z-10 min-h-[calc(100svh-76px)] overflow-hidden bg-[#343832] px-5 pt-8 pb-32 text-white sm:px-8 sm:pt-10 sm:pb-44">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <Reveal className="grid items-end gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="eyebrow flex items-center gap-2 text-[#d9c8b4]">
              <TulipDuo size={20} />
              <span>A few glimpses</span>
            </p>
            <h2 className="section-title text-white">Our love story</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/[0.62] lg:pb-2">
            A glimpse into the laughter, adventures, and quiet moments that brought us here. We can’t wait to celebrate the beginning of our forever with the people who mean the most to us.
          </p>
        </Reveal>

        {/* Slideshow */}
        {total > 0 ? (
          <div className="mt-10 sm:mt-12">
            <Reveal delay={120}>
              <div
                className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-stretch"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Big Picture (Left Column, 7 cols on desktop) */}
                <div className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900 shadow-2xl lg:col-span-7 aspect-[4/3] sm:aspect-[16/11] lg:aspect-auto lg:min-h-[520px]">
                  {galleryItems.map((item, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <div
                        key={item.id}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                          isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                        aria-hidden={!isActive}
                      >
                        <img
                          src={item.src}
                          alt={item.alt}
                          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                      </div>
                    );
                  })}

                  {/* Subtle dark gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top right: Expand to full screen */}
                  <button
                    type="button"
                    onClick={() => openLightbox(currentIndex)}
                    className="absolute top-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:bg-white hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="View photo in full screen"
                    title="View full screen"
                  >
                    <Expand className="h-4 w-4" />
                  </button>

                  {/* Quick in-image prev/next overlays on hover */}
                  {total > 1 && (
                    <div className="absolute inset-x-4 top-1/2 z-30 flex -translate-y-1/2 justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:inset-x-6">
                      <button
                        type="button"
                        onClick={prevSlide}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:bg-white hover:text-stone-900"
                        aria-label="Previous photo"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={nextSlide}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:bg-white hover:text-stone-900"
                        aria-label="Next photo"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {/* Small badge bottom-left of the photo */}
                  <div className="absolute bottom-5 left-5 z-30 sm:bottom-6 sm:left-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3.5 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d9c8b4] animate-pulse" />
                      {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Text on the Right with Image Name / Description (Right Column, 5 cols on desktop) */}
                <div className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8 lg:col-span-5 lg:p-10 backdrop-blur-sm">
                  {/* Top content */}
                  <div>
                    {/* Eyebrow / Category badge */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9c8b4]">
                        <PastelTulip color="pink" size={15} />
                        {currentItem.category === 'venue' ? 'The Venue' : currentItem.category === 'couple' ? 'Our Moments' : (currentItem.category || 'Photograph')}
                      </span>
                      <span className="text-xs font-medium tracking-widest text-white/50 uppercase">
                        Slide {currentIndex + 1} of {total}
                      </span>
                    </div>

                    {/* Image Name / Title */}
                    <h3 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.6rem] leading-tight tracking-tight">
                      {currentItem.title}
                    </h3>

                    {/* Image Description */}
                    <div className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                      <p>
                        {currentItem.caption ||
                          (currentItem.category === 'venue'
                            ? 'The beautiful setting where our vows and celebration will unfold.'
                            : 'A cherished moment from our journey together as we count down to our wedding day.')}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Controls & Indicators */}
                  <div className="mt-8 pt-6 border-t border-white/10 sm:mt-10">
                    {/* Auto-slideshow Progress Bar */}
                    {total > 1 && isPlaying && !isHovered && (
                      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          key={`${currentIndex}-${isPlaying}`}
                          className="h-full rounded-full bg-[#d9c8b4]"
                          style={{
                            animation: `progressBar ${SLIDE_DURATION_MS}ms linear forwards`,
                          }}
                        />
                      </div>
                    )}

                    {/* Control buttons & Dots */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Dots / indicators */}
                      <div className="flex flex-wrap items-center gap-2">
                        {galleryItems.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => goToSlide(idx)}
                            className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none ${
                              idx === currentIndex
                                ? 'w-8 bg-[#d9c8b4]'
                                : 'w-2.5 bg-white/20 hover:bg-white/40'
                            }`}
                            aria-label={`Go to slide ${idx + 1}: ${item.title}`}
                          />
                        ))}
                      </div>

                      {/* Navigation buttons */}
                      {total > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsPlaying(prev => !prev)}
                            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                            title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={prevSlide}
                            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                            aria-label="Previous photo"
                            title="Previous photo"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={nextSlide}
                            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                            aria-label="Next photo"
                            title="Next photo"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        ) : (
          <div className="mt-14 rounded-[2rem] border border-white/15 bg-white/5 p-10 text-center">
            <Images className="mx-auto h-7 w-7 text-[#d9c8b4]" />
            <p className="mt-4 text-sm text-white/65">The gallery is being prepared.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#161714]/95 p-3 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${lightboxItem.title}`}
          onMouseDown={event => {
            if (event.currentTarget === event.target) closeLightbox();
          }}
        >
          <div className="relative flex max-h-[92svh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#272a26] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/[0.55]">
                {lightboxIndex! + 1} of {galleryItems.length}
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeLightbox}
                className="grid h-11 w-11 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white"
                aria-label="Close photo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-black/20">
              <img src={lightboxItem.src} alt={lightboxItem.alt} className="mx-auto max-h-[68svh] w-full object-contain" />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl font-semibold text-white sm:text-2xl">{lightboxItem.title}</h3>
                {lightboxItem.caption && <p className="mt-1 truncate text-xs text-white/[0.55]">{lightboxItem.caption}</p>}
              </div>
              {galleryItems.length > 1 && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => moveLightbox(-1)}
                    className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:bg-white hover:text-stone-900"
                    aria-label="Previous photo"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLightbox(1)}
                    className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:bg-white hover:text-stone-900"
                    aria-label="Next photo"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
