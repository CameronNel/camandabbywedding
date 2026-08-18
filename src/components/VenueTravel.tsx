import React from 'react';
import { useWedding } from '../context/WeddingContext';
import { initialAccommodations } from '../data/initialData';
import { MapPin, Navigation, Hotel, Car, Bus, Phone, Copy, Check, ExternalLink } from 'lucide-react';

export const VenueTravel: React.FC = () => {
  const { config } = useWedding();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section id="venue" className="py-24 relative bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blush-50 border border-blush-200 text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <MapPin className="w-3.5 h-3.5 text-blush-500" />
            <span>Destination &amp; Accommodations</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Venue &amp; Travel
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            Napa Valley, California — A weekend of wine country romance and celebration.
          </p>
        </div>

        {/* Venue Showcase Banner */}
        <div className="rounded-3xl overflow-hidden relative shadow-2xl border border-blush-200 mb-16 group">
          <img
            src={`${import.meta.env.BASE_URL}images/venue.jpg`}
            alt="Château de Lumière Wedding Venue"
            className="w-full h-80 sm:h-[440px] object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent"></div>
          
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white max-w-2xl">
            <span className="text-xs uppercase tracking-[0.25em] text-blush-200 font-semibold mb-2 block">
              The Wedding Estate
            </span>
            <h3 className="text-2xl sm:text-4xl font-serif font-light mb-2">
              Château de Lumière &amp; Rosewood Conservatory
            </h3>
            <p className="text-sm text-stone-200 font-display italic max-w-xl">
              Surrounded by rolling vineyards, fragrant rose gardens, and illuminated by starlit chandeliers.
            </p>
          </div>
        </div>

        {/* Two Venue Cards: Ceremony vs Reception */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Ceremony */}
          <div className="glass-card rounded-3xl p-8 border border-blush-200/90 shadow-sm glass-card-hover flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-serif font-semibold uppercase tracking-widest text-blush-600 bg-blush-50 px-3 py-1 rounded-full border border-blush-200">
                  The Ceremony
                </span>
                <span className="text-xs text-stone-500 font-medium">3:00 PM</span>
              </div>
              <h4 className="text-2xl font-serif text-stone-800 mb-2">
                {config.ceremonyVenue.name}
              </h4>
              <p className="text-stone-600 text-sm mb-4 leading-relaxed">
                {config.ceremonyVenue.description}
              </p>
              <div className="flex items-start gap-2 text-stone-500 text-xs mb-6">
                <Navigation className="w-4 h-4 text-blush-500 shrink-0 mt-0.5" />
                <span>{config.ceremonyVenue.address}, {config.ceremonyVenue.city}</span>
              </div>
            </div>

            <a
              href={config.ceremonyVenue.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-rosewood bg-blush-50 hover:bg-blush-100 border border-blush-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Get Directions to Ceremony</span>
            </a>
          </div>

          {/* Reception */}
          <div className="glass-card rounded-3xl p-8 border border-blush-200/90 shadow-sm glass-card-hover flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-serif font-semibold uppercase tracking-widest text-blush-600 bg-blush-50 px-3 py-1 rounded-full border border-blush-200">
                  Dinner &amp; Reception
                </span>
                <span className="text-xs text-stone-500 font-medium">5:00 PM – Late</span>
              </div>
              <h4 className="text-2xl font-serif text-stone-800 mb-2">
                {config.receptionVenue.name}
              </h4>
              <p className="text-stone-600 text-sm mb-4 leading-relaxed">
                {config.receptionVenue.description}
              </p>
              <div className="flex items-start gap-2 text-stone-500 text-xs mb-6">
                <Navigation className="w-4 h-4 text-blush-500 shrink-0 mt-0.5" />
                <span>{config.receptionVenue.address}, {config.receptionVenue.city}</span>
              </div>
            </div>

            <a
              href={config.receptionVenue.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-rosewood bg-blush-50 hover:bg-blush-100 border border-blush-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Get Directions to Reception</span>
            </a>
          </div>
        </div>

        {/* Travel, Shuttle & Parking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blush-100 flex items-center justify-center text-blush-600 shrink-0">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-serif font-semibold text-stone-800 text-base mb-1">
                Complimentary Guest Shuttles
              </h5>
              <p className="text-stone-600 text-xs leading-relaxed">
                Continuous round-trip private shuttles will run between all 3 recommended partner hotels and the venue from 1:45 PM until 12:30 AM.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blush-100 flex items-center justify-center text-blush-600 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-serif font-semibold text-stone-800 text-base mb-1">
                Complimentary Valet Parking
              </h5>
              <p className="text-stone-600 text-xs leading-relaxed">
                If you choose to drive or rent a car, complimentary white-glove valet parking is located at the main estate entrance gates.
              </p>
            </div>
          </div>
        </div>

        {/* Accommodations / Hotel Blocks */}
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-rosewood font-serif text-sm font-semibold uppercase tracking-wider mb-1">
              <Hotel className="w-4 h-4 text-blush-500" />
              <span>Recommended Accommodations &amp; Room Blocks</span>
            </div>
            <p className="text-stone-500 text-xs">
              We have reserved discounted room blocks for our guests. Please book early before May 1, 2027.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {initialAccommodations.map((hotel, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 border border-blush-200/80 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-medium text-blush-600 bg-blush-50 px-2.5 py-0.5 rounded-full">
                      {hotel.distance}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">{hotel.rate}</span>
                  </div>

                  <h5 className="font-serif font-semibold text-stone-800 text-lg mb-1">
                    {hotel.name}
                  </h5>
                  <p className="text-stone-500 text-xs mb-3">{hotel.address}</p>

                  <div className="flex items-center gap-2 text-xs text-stone-600 mb-4">
                    <Phone className="w-3.5 h-3.5 text-blush-500" />
                    <span>{hotel.phone}</span>
                  </div>

                  {/* Promo Code Copy Box */}
                  <div className="bg-blush-50/70 rounded-xl p-2.5 border border-blush-100 flex items-center justify-between mb-4">
                    <div className="text-left">
                      <div className="text-[10px] uppercase text-stone-400 font-medium">Group Promo Code</div>
                      <div className="text-xs font-mono font-bold text-rosewood">{hotel.bookingCode}</div>
                    </div>
                    <button
                      onClick={() => handleCopyCode(hotel.bookingCode)}
                      className="p-1.5 rounded-lg bg-white hover:bg-blush-100 text-stone-600 text-xs font-medium border border-blush-200 flex items-center gap-1 transition"
                      title="Copy Code"
                    >
                      {copiedCode === hotel.bookingCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-stone-400" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <a
                  href={hotel.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-2.5 rounded-full text-xs font-medium text-stone-700 bg-white hover:bg-blush-50 border border-blush-200 shadow-sm transition"
                >
                  Book Online
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
