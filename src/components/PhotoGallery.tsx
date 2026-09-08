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
    <section id="gallery" className="anchor-section relative z-10 min-h-[calc(100svh-76px)] overflow-hidden bg-transparent px-5 pt-8 pb-32 text-stone-800 sm:px-8 sm:pt-10 sm:pb-44">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <Reveal className="grid items-end gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <TulipDuo size={20} />
              <span>A few glimpses</span>
            </p>
            <h2 className="section-title text-stone-900">Our love story</h2>
          </div>
          <p className="section-copy lg:pb-2">
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
                <div className="relative group overflow-hidden rounded-[2rem] border border-[#f0d5de] bg-[#fcf8fa] shadow-[0_20px_60px_rgba(201,122,139,0.08)] lg:col-span-7 aspect-[4/3] sm:aspect-[16/11] lg:aspect-auto lg:min-h-[520px]">
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

                  {/* Top right: Expand to full screen */}
                  <button
                    type="button"
                    onClick={() => openLightbox(currentIndex)}
                    className="absolute top-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/80 text-stone-700 backdrop-blur-md transition hover:bg-white hover:text-[#c97a8b] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c97a8b]"
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
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/80 text-stone-700 backdrop-blur-md transition hover:bg-white hover:text-[#c97a8b] shadow-sm"
                        aria-label="Previous photo"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={nextSlide}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/80 text-stone-700 backdrop-blur-md transition hover:bg-white hover:text-[#c97a8b] shadow-sm"
                        aria-label="Next photo"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {/* Small badge bottom-left of the photo */}
                  <div className="absolute bottom-5 left-5 z-30 sm:bottom-6 sm:left-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f0d5de] bg-white/90 px-3.5 py-1 text-xs font-medium tracking-wide text-stone-700 shadow-sm backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c97a8b] animate-pulse" />
                      {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Text on the Right with Image Name / Description (Right Column, 5 cols on desktop) */}
                <div className="flex flex-col justify-between rounded-[2rem] border border-[#f0d5de] bg-white/95 p-6 sm:p-8 lg:col-span-5 lg:p-10 backdrop-blur-sm shadow-[0_20px_60px_rgba(201,122,139,0.06)]">
                  {/* Top content */}
                  <div>
                    {/* Eyebrow / Category badge */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-[#fdf5f7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a384b]">
                        <PastelTulip color="pink" size={15} />
                        {currentItem.category === 'venue' ? 'The Venue' : currentItem.category === 'couple' ? 'Our Moments' : (currentItem.category || 'Photograph')}
                      </span>
                      <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
                        Slide {currentIndex + 1} of {total}
                      </span>
                    </div>

                    {/* Image Name / Title */}
                    <h3 className="mt-5 font-display text-3xl font-semibold text-stone-900 sm:text-4xl lg:text-[2.6rem] leading-tight tracking-tight">
                      {currentItem.title}
                    </h3>

                    {/* Image Description */}
                    <div className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
                      <p>
                        {currentItem.caption ||
                          (currentItem.category === 'venue'
                            ? 'The beautiful setting where our vows and celebration will unfold.'
                            : 'A cherished moment from our journey together as we count down to our wedding day.')}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Controls & Indicators */}
                  <div className="mt-8 pt-6 border-t border-[#f0d5de]/80 sm:mt-10">
                    {/* Auto-slideshow Progress Bar */}
                    {total > 1 && isPlaying && !isHovered && (
                      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-[#f3e3e8]">
                        <div
                          key={`${currentIndex}-${isPlaying}`}
                          className="h-full rounded-full bg-[#c97a8b]"
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
                                ? 'w-8 bg-[#c97a8b]'
                                : 'w-2.5 bg-stone-200 hover:bg-stone-300'
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
                            className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 text-stone-600 transition hover:border-[#c97a8b] hover:bg-[#fff7f9] hover:text-[#c97a8b]"
                            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                            title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={prevSlide}
                            className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 text-stone-600 transition hover:border-[#c97a8b] hover:bg-[#fff7f9] hover:text-[#c97a8b]"
                            aria-label="Previous photo"
                            title="Previous photo"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={nextSlide}
                            className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 text-stone-600 transition hover:border-[#c97a8b] hover:bg-[#fff7f9] hover:text-[#c97a8b]"
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
          <div className="mt-14 rounded-[2rem] border border-dashed border-pink-200 bg-white/60 p-10 text-center">
            <Images className="mx-auto h-7 w-7 text-[#c97a8b]" />
            <p className="mt-4 text-sm text-stone-500">The gallery is being prepared.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/75 p-3 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${lightboxItem.title}`}
          onMouseDown={event => {
            if (event.currentTarget === event.target) closeLightbox();
          }}
        >
          <div className="relative flex max-h-[92svh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-[#f0d5de] bg-[#fcf9fa] text-stone-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#f0d5de] px-4 py-3 sm:px-5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                {lightboxIndex! + 1} of {galleryItems.length}
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeLightbox}
                className="grid h-11 w-11 place-items-center rounded-full text-stone-500 transition hover:bg-stone-200/60 hover:text-stone-900"
                aria-label="Close photo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-stone-100/50">
              <img src={lightboxItem.src} alt={lightboxItem.alt} className="mx-auto max-h-[68svh] w-full object-contain" />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#f0d5de] px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl font-semibold text-stone-900 sm:text-2xl">{lightboxItem.title}</h3>
                {lightboxItem.caption && <p className="mt-1 truncate text-xs text-stone-500">{lightboxItem.caption}</p>}
              </div>
              {galleryItems.length > 1 && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => moveLightbox(-1)}
                    className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-white hover:text-stone-900 shadow-2xs"
                    aria-label="Previous photo"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLightbox(1)}
                    className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-white hover:text-stone-900 shadow-2xs"
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
