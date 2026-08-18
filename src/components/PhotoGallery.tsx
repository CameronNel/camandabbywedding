import React, { useState } from 'react';
import { Camera, X, ZoomIn, Heart, MapPin } from 'lucide-react';

interface GalleryItem {
  id: number;
  src: string;
  category: 'couple' | 'venue' | 'details';
  title: string;
  subtitle: string;
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    src: `${import.meta.env.BASE_URL}images/couple.jpg`,
    category: 'couple',
    title: 'Cam & Abby on the Golf Course at Sunset',
    subtitle: 'Golden hour stroll along the fairway under the Outeniqua Mountain peaks'
  },
  {
    id: 2,
    src: `${import.meta.env.BASE_URL}images/hero-arendsrus.jpg`,
    category: 'venue',
    title: 'ArendsRus Country Lodge & Wooden Deck',
    subtitle: 'Rustic wooden chalets and swimming pool surrounded by fynbos and Outeniqua Mountains'
  },
  {
    id: 3,
    src: `${import.meta.env.BASE_URL}images/venue.jpg`,
    category: 'venue',
    title: 'The ArendsRus Barn Yard Reception Hall',
    subtitle: 'Exposed wooden trusses, cascading crystal chandeliers, and glowing candlelight'
  },
  {
    id: 4,
    src: `${import.meta.env.BASE_URL}images/chapel.jpg`,
    category: 'venue',
    title: 'The ArendsRus Country Chapel',
    subtitle: 'Rustic wooden chapel framed by mountain peaks and rose-lined aisles'
  }
];

export const PhotoGallery: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'couple' | 'venue'>('all');
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);

  const filteredPhotos = filter === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === filter);

  return (
    <section id="gallery" className="py-20 bg-[#FFFDFB] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-blush-600 mb-3 bg-blush-50 px-3 py-1 rounded-full border border-blush-100">
            <Camera className="w-3.5 h-3.5" />
            <span>Captured Moments</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Photo Gallery
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg sm:text-xl text-stone-600">
            A glimpse into our love story and the magical grounds of ArendsRus Country Lodge.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {(['all', 'couple', 'venue'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === tab
                  ? 'bg-blush-500 text-white shadow-md shadow-blush-500/25 scale-105'
                  : 'bg-white text-stone-600 hover:bg-blush-50 border border-stone-200'
              }`}
            >
              {tab === 'all' ? 'All Photos' : tab === 'couple' ? 'The Couple' : 'ArendsRus Venue'}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPhotos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="group relative rounded-3xl overflow-hidden shadow-lg border border-blush-100 cursor-pointer bg-stone-900 aspect-[16/10]"
            >
              <img
                src={photo.src}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-95 group-hover:opacity-100"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition duration-300"></div>

              {/* Hover Zoom Icon */}
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                <ZoomIn className="w-5 h-5" />
              </div>

              {/* Photo Caption */}
              <div className="absolute bottom-6 left-6 right-6 text-white transform group-hover:-translate-y-1 transition duration-300">
                <div className="flex items-center gap-1.5 text-blush-300 text-xs font-semibold uppercase tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>ArendsRus • George</span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-medium text-white mb-1">
                  {photo.title}
                </h3>
                <p className="text-stone-300 text-xs font-light line-clamp-2">
                  {photo.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={activePhoto.src}
              alt={activePhoto.title}
              className="max-w-full max-h-[75vh] w-auto h-auto object-contain mx-auto"
            />

            <div className="p-6 bg-stone-950 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-serif text-xl sm:text-2xl font-normal text-white mb-1">
                    {activePhoto.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-400 font-light">
                    {activePhoto.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-blush-300 text-xs font-medium shrink-0">
                  <Heart className="w-3.5 h-3.5 fill-blush-300" />
                  <span>ArendsRus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
