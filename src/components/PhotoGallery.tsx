import React, { useState } from 'react';
import { Camera, X, ZoomIn } from 'lucide-react';

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
    title: 'The Engagement in Provence',
    subtitle: 'Golden afternoon amidst the blooming heritage roses'
  },
  {
    id: 2,
    src: `${import.meta.env.BASE_URL}images/venue.jpg`,
    category: 'venue',
    title: 'Château Reception Grounds',
    subtitle: 'Al fresco dining under crystal chandeliers and fairy lights'
  },
  {
    id: 3,
    src: `${import.meta.env.BASE_URL}images/details.jpg`,
    category: 'details',
    title: 'Deckled Stationery & Velvet Rings',
    subtitle: 'Gold calligraphy, wax seal, and heirloom diamond bands'
  },
  {
    id: 4,
    src: `${import.meta.env.BASE_URL}images/hero-floral.jpg`,
    category: 'details',
    title: 'Botanical Watercolor Artistry',
    subtitle: 'Hand-painted blush peonies and golden olive foliage'
  }
];

export const PhotoGallery: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'couple' | 'venue' | 'details'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  const filteredItems = filter === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === filter);

  return (
    <section id="gallery" className="py-24 relative bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blush-50 border border-blush-200 text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <Camera className="w-3.5 h-3.5 text-blush-500" />
            <span>Captured Memories</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Photo Gallery
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            A glimpse into our favorite moments, the venue grounds, and wedding aesthetic.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
          {[
            { id: 'all', label: 'All Photos' },
            { id: 'couple', label: 'Couple Moments' },
            { id: 'venue', label: 'The Estate & Grounds' },
            { id: 'details', label: 'Details & Stationery' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as 'all' | 'couple' | 'venue' | 'details')}
              className={`px-5 py-2 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
                filter === tab.id
                  ? 'bg-rosewood text-white shadow-md'
                  : 'bg-stone-50 text-stone-600 hover:bg-blush-50 hover:text-blush-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="group relative rounded-3xl overflow-hidden shadow-lg border border-blush-200 cursor-pointer aspect-[16/10] bg-stone-100"
            >
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-lg text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-stone-300 font-display italic">{item.subtitle}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 backdrop-blur-md transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/20 mb-4"
            />
            <div className="text-center text-white">
              <h3 className="font-serif text-xl mb-1">{selectedPhoto.title}</h3>
              <p className="text-stone-400 text-sm font-display italic">{selectedPhoto.subtitle}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
