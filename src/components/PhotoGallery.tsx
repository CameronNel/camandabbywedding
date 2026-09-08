import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Expand, Images, Maximize2, Minimize2, Pause, Play, X } from 'lucide-react';
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
  const [imageFit, setImageFit] = useState<'contain' | 'cover'>('contain');
  const [isDetailsMinimized, setIsDetailsMinimized] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
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

  const isLightboxOpen = lightboxIndex !== null;

  useEffect(() => {
    if (!isLightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') moveLightbox(-1);
      if (event.key === 'ArrowRight') moveLightbox(1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxIndex, closeLightbox, moveLightbox]);

  const currentItem = galleryItems[currentIndex] || galleryItems[0];
  const lightboxItem = lightboxIndex !== null ? galleryItems[lightboxIndex] : null;

  return (
    <section id="gallery" className="anchor-section relative z-10 min-h-[calc(100svh-76px)] overflow-hidden bg-gradient-to-b from-[#f8eff4] via-[#f0f3fa] to-[#f8edf4] border-y border-[#ecd4de]/70 px-5 pt-8 pb-32 text-stone-800 sm:px-8 sm:pt-10 sm:pb-44">
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
                className="relative group overflow-hidden rounded-[2.5rem] border-2 border-[#eed5df] bg-[#fff9fb] shadow-[0_25px_80px_rgba(199,134,152,0.16)] w-full h-[540px] sm:h-[640px] md:h-[720px] lg:h-[780px] xl:h-[840px]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
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
                      {imageFit === 'contain' ? (
                        <>
                          {/* Ambient blurred background that fills the entire container */}
                          <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
                            <img
                              src={item.src}
                              alt=""
                              aria-hidden="true"
                              className="h-full w-full object-cover blur-2xl opacity-40 scale-110 saturate-150"
                            />
                            <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-xs" />
                          </div>

                          {/* Sharp, uncropped high-resolution photo */}
                          <div className="relative z-10 flex h-full w-full items-center justify-center p-3 sm:p-6 lg:p-8">
                            <img
                              src={item.src}
                              alt={item.alt}
                              className="max-h-full max-w-full object-contain rounded-2xl drop-shadow-[0_20px_45px_rgba(0,0,0,0.24)] transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                              loading={index === 0 ? 'eager' : 'lazy'}
                            />
                          </div>
                        </>
                      ) : (
                        <img
                          src={item.src}
                          alt={item.alt}
                          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Top right controls: Fit/Fill toggle and Expand to full screen */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImageFit(prev => prev === 'contain' ? 'cover' : 'contain')}
                    className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/60 bg-white/85 text-stone-700 backdrop-blur-md transition hover:bg-white hover:text-[#c97a8b] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c97a8b]"
                    aria-label={imageFit === 'contain' ? 'Fill frame' : 'Fit whole photo'}
                    title={imageFit === 'contain' ? 'Fill frame (zoom to fill)' : 'Fit whole photo (uncropped)'}
                  >
                    {imageFit === 'contain' ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => openLightbox(currentIndex)}
                    className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/60 bg-white/85 text-stone-700 backdrop-blur-md transition hover:bg-white hover:text-[#c97a8b] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c97a8b]"
                    aria-label="View photo in full screen"
                    title="View full screen"
                  >
                    <Expand className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick in-image prev/next hover arrows on left & right sides */}
                {total > 1 && (
                  <div className="absolute inset-x-3 top-1/2 z-20 flex -translate-y-1/2 justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:inset-x-6 pointer-events-none">
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 backdrop-blur-md transition hover:bg-white hover:text-[#c97a8b] hover:scale-105 shadow-md"
                      aria-label="Previous photo"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-700 backdrop-blur-md transition hover:bg-white hover:text-[#c97a8b] hover:scale-105 shadow-md"
                      aria-label="Next photo"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Small Text Block ON the Image (Bottom Left) */}
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 z-30">
                  {isDetailsMinimized ? (
                    <button
                      type="button"
                      onClick={() => setIsDetailsMinimized(false)}
                      className="inline-flex items-center gap-2.5 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-semibold text-stone-800 backdrop-blur-xl shadow-lg transition hover:bg-white hover:text-[#c97a8b] hover:scale-105"
                      title="Show photo details"
                    >
                      <PastelTulip color="pink" size={15} />
                      <span className="font-display font-medium text-sm">{currentItem.title}</span>
                      <span className="text-stone-300">|</span>
                      <span className="text-[11px] font-mono text-stone-500">{currentIndex + 1} / {total}</span>
                      <ChevronUp className="h-3.5 w-3.5 text-stone-500 ml-0.5" />
                    </button>
                  ) : (
                    <div className="w-full sm:max-w-md lg:max-w-lg rounded-3xl border border-white/80 bg-white/90 p-5 sm:p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-all duration-300">
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-[#fdf5f7] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a384b]">
                          <PastelTulip color="pink" size={13} />
                          {currentItem.category === 'venue' ? 'The Venue' : currentItem.category === 'couple' ? 'Our Moments' : (currentItem.category || 'Photograph')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                            Slide {currentIndex + 1} of {total}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsDetailsMinimized(true)}
                            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100/70 transition"
                            title="Minimize details"
                            aria-label="Minimize details"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Image Title & Caption */}
                      <h3 className="mt-2.5 font-display text-2xl sm:text-3xl font-semibold text-stone-900 leading-tight">
                        {currentItem.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-stone-600 line-clamp-2">
                        {currentItem.caption ||
                          (currentItem.category === 'venue'
                            ? 'The beautiful setting where our vows and celebration will unfold.'
                            : 'A cherished moment from our journey together as we count down to our wedding day.')}
                      </p>

                      {/* Progress bar */}
                      {total > 1 && isPlaying && !isHovered && (
                        <div className="mt-3.5 mb-2.5 h-1 w-full overflow-hidden rounded-full bg-stone-200/70">
                          <div
                            key={`${currentIndex}-${isPlaying}`}
                            className="h-full rounded-full bg-[#c97a8b]"
                            style={{
                              animation: `progressBar ${SLIDE_DURATION_MS}ms linear forwards`,
                            }}
                          />
                        </div>
                      )}

                      {/* Controls Row */}
                      {total > 1 && (
                        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-stone-200/60 pt-3">
                          <button
                            type="button"
                            onClick={() => setIsPlaying(prev => !prev)}
                            className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs font-semibold text-stone-700 transition hover:border-[#c97a8b] hover:bg-white hover:text-[#c97a8b]"
                            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                          >
                            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            <span>{isPlaying ? 'Pause' : 'Play'}</span>
                          </button>

                          {/* Dots */}
                          <div className="flex flex-wrap items-center gap-1.5 max-w-[180px] sm:max-w-[220px] overflow-hidden py-1">
                            {galleryItems.map((item, idx) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => goToSlide(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none ${
                                  idx === currentIndex
                                    ? 'w-6 bg-[#c97a8b]'
                                    : 'w-1.5 bg-stone-300 hover:bg-stone-400'
                                }`}
                                aria-label={`Go to slide ${idx + 1}: ${item.title}`}
                              />
                            ))}
                          </div>

                          {/* Prev/Next buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={prevSlide}
                              className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 bg-white/80 text-stone-600 transition hover:border-[#c97a8b] hover:bg-white hover:text-[#c97a8b] shadow-2xs"
                              aria-label="Previous photo"
                              title="Previous photo"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={nextSlide}
                              className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 bg-white/80 text-stone-600 transition hover:border-[#c97a8b] hover:bg-white hover:text-[#c97a8b] shadow-2xs"
                              aria-label="Next photo"
                              title="Next photo"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
            <div className="min-h-0 flex-1 bg-stone-950/90 flex items-center justify-center p-3 sm:p-6">
              <img src={lightboxItem.src} alt={lightboxItem.alt} className="mx-auto max-h-[78svh] sm:max-h-[82svh] max-w-full object-contain drop-shadow-2xl rounded-lg sm:rounded-xl" />
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
