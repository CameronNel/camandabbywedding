import React, { useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import {
  MapPin,
  Car,
  Plane,
  Globe,
  Copy,
  Check,
  Sparkles,
  Clock,
  Compass,
  Heart
} from 'lucide-react';

export const VenueTravel: React.FC = () => {
  const { config } = useWedding();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <section id="venue" className="py-20 bg-gradient-to-b from-[#FFFDFB] via-[#FFF8FA] to-[#FFFDFB] relative">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-blush-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-champagne-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-blush-600 mb-3 bg-blush-50 px-3 py-1 rounded-full border border-blush-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Wedding Destination</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            ArendsRus Country Lodge
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg sm:text-xl text-stone-600">
            Geelhoutboom, George, Garden Route — At the foot of the magnificent Outeniqua Mountains.
          </p>
        </div>

        {/* Hero Venue Showcase Banner */}
        <div className="rounded-3xl overflow-hidden relative shadow-2xl border border-blush-200 mb-16 group bg-stone-900">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-arendsrus.jpg`}
            alt="ArendsRus Country Lodge Wedding Venue"
            className="w-full h-80 sm:h-[480px] object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-blush-100 text-xs font-medium uppercase tracking-wider mb-3">
              <MapPin className="w-3.5 h-3.5 text-blush-300" />
              <span>George, Western Cape, South Africa</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-serif font-light mb-2">
              ArendsRus Country Lodge &amp; Barn Yard
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-4">
              Nestled in the tranquil valley of Geelhoutboom, ArendsRus offers sweeping views of the Outeniqua mountain range, fragrant rose gardens, and a magical wooden barn setting.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={config.ceremonyVenue.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-stone-900 hover:bg-blush-50 text-xs font-semibold uppercase tracking-wider shadow-lg transition"
              >
                <Compass className="w-4 h-4 text-blush-600" />
                <span>Open in Google Maps</span>
              </a>
              <a
                href="https://arendsrus.co.za"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-medium uppercase tracking-wider transition border border-white/30"
              >
                <Globe className="w-4 h-4" />
                <span>Visit Lodge Website</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2-Column: Ceremony Chapel vs Reception Barn Yard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Ceremony: The Chapel */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-blush-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="relative mb-6 rounded-2xl overflow-hidden h-52 sm:h-60 shadow-md">
              <img
                src={`${import.meta.env.BASE_URL}images/chapel.jpg`}
                alt="The ArendsRus Country Chapel"
                className="w-full h-full object-cover hover:scale-105 transition duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-rosewood border border-blush-200">
                The Ceremony
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl sm:text-2xl font-serif text-stone-800 font-medium">
                  {config.ceremonyVenue.name}
                </h4>
                <span className="text-xs uppercase tracking-wider font-semibold text-blush-600 bg-blush-50 px-3 py-1 rounded-full border border-blush-100">
                  {config.ceremonyVenue.time}
                </span>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                {config.ceremonyVenue.description}
              </p>
            </div>

            <div className="pt-4 border-t border-blush-100 text-xs text-stone-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blush-500 shrink-0" />
                <span>{config.ceremonyVenue.address}, {config.ceremonyVenue.city}</span>
              </div>
            </div>
          </div>

          {/* Reception: The Barn Yard */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-blush-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="relative mb-6 rounded-2xl overflow-hidden h-52 sm:h-60 shadow-md">
              <img
                src={`${import.meta.env.BASE_URL}images/venue.jpg`}
                alt="The ArendsRus Barn Yard"
                className="w-full h-full object-cover hover:scale-105 transition duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-rosewood border border-blush-200">
                The Reception &amp; Party
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl sm:text-2xl font-serif text-stone-800 font-medium">
                  {config.receptionVenue.name}
                </h4>
                <span className="text-xs uppercase tracking-wider font-semibold text-blush-600 bg-blush-50 px-3 py-1 rounded-full border border-blush-100">
                  {config.receptionVenue.time}
                </span>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                {config.receptionVenue.description}
              </p>
            </div>

            <div className="pt-4 border-t border-blush-100 text-xs text-stone-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-blush-500 shrink-0" />
                <span>Dining, toasts, first dance, and midnight celebrations!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Travel & Airport Information */}
        <div className="bg-gradient-to-br from-white via-blush-50/40 to-white rounded-3xl p-8 border border-blush-200 shadow-md mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-blush-100 text-blush-600 flex items-center justify-center shadow-sm">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-semibold text-xl text-stone-800">
                Getting To George &amp; ArendsRus
              </h4>
              <p className="text-xs text-stone-500">Travel details for our local and out-of-town guests</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600">
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="flex items-center gap-2 text-stone-800 font-semibold mb-2">
                <Plane className="w-4 h-4 text-blush-500" />
                <span>George Airport (GRJ)</span>
              </div>
              <p className="leading-relaxed">
                The closest airport is George Airport (GRJ), serviced with daily direct flights from Cape Town, Johannesburg, and Durban. It is just a <strong>15-minute drive</strong> to ArendsRus Country Lodge.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="flex items-center gap-2 text-stone-800 font-semibold mb-2">
                <Car className="w-4 h-4 text-blush-500" />
                <span>Driving &amp; Parking</span>
              </div>
              <p className="leading-relaxed">
                Take the R102 / Geelhoutboom turnoff towards Koesterbos Road. The route is scenic and paved. <strong>Complimentary secure on-site parking</strong> is available for all wedding guests at the lodge.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
              <div className="flex items-center gap-2 text-stone-800 font-semibold mb-2">
                <Clock className="w-4 h-4 text-blush-500" />
                <span>Guest Shuttle Service</span>
              </div>
              <p className="leading-relaxed">
                Complimentary luxury shuttle vans will operate between Fancourt Estate / Protea Hotel and ArendsRus from <strong>2:30 PM</strong> until the early hours of the morning.
              </p>
            </div>
          </div>
        </div>

        {/* Accommodation Section */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-serif text-stone-800 font-medium mb-2">
              Guest Accommodations &amp; Lodging
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm">
              We have arranged special room rates at ArendsRus Country Lodge and nearby luxury partner resorts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Arendsrus on-site */}
            <div className="bg-white rounded-3xl p-6 border-2 border-blush-300 shadow-lg relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blush-500 to-rose-500 text-white text-[10px] uppercase tracking-widest font-semibold px-3 py-0.5 rounded-full shadow-sm">
                On-Site at Wedding Venue
              </div>

              <div>
                <h5 className="font-serif font-bold text-lg text-stone-800 mb-1 mt-2">
                  ArendsRus Country Lodge
                </h5>
                <p className="text-xs text-stone-500 mb-3">Koesterbos Road, Geelhoutboom, George</p>
                <div className="inline-block px-2.5 py-1 rounded-lg bg-blush-50 text-blush-700 text-xs font-semibold mb-4 border border-blush-100">
                  Log Cabins &amp; En-Suite Rooms
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  Stay right on the estate in rustic-chic wooden chalets with mountain panoramas. Limited rooms available.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Phone:</span>
                  <a href="tel:+27440500256" className="font-medium text-blush-600 hover:underline">+27 (0)44 050 0256</a>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Email:</span>
                  <a href="mailto:info@arendsrus.co.za" className="font-medium text-blush-600 hover:underline">info@arendsrus.co.za</a>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-stone-400 font-mono text-[11px]">Code: CAM-ABBY</span>
                  <button
                    onClick={() => copyToClipboard('CAM-ABBY', 0)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blush-600 hover:text-blush-800"
                  >
                    {copiedIndex === 0 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 0 ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Fancourt Estate */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm relative flex flex-col justify-between hover:shadow-md transition">
              <div>
                <h5 className="font-serif font-bold text-lg text-stone-800 mb-1">
                  Fancourt Luxury Estate
                </h5>
                <p className="text-xs text-stone-500 mb-3">Montagu Street, Blanco, George (10 mins away)</p>
                <div className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold mb-4">
                  5-Star Golf &amp; Spa Resort
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  World-renowned luxury resort featuring award-winning spas, championship golf courses, and fine dining.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Phone:</span>
                  <a href="tel:+27448040000" className="font-medium text-stone-800 hover:underline">+27 (0)44 804 0000</a>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Rate:</span>
                  <span className="font-semibold text-stone-800">From R2,450 / night</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-stone-400 font-mono text-[11px]">Code: CAM-ABBY-2027</span>
                  <button
                    onClick={() => copyToClipboard('CAM-ABBY-2027', 1)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blush-600 hover:text-blush-800"
                  >
                    {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 1 ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Protea Hotel King George */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm relative flex flex-col justify-between hover:shadow-md transition">
              <div>
                <h5 className="font-serif font-bold text-lg text-stone-800 mb-1">
                  Protea Hotel King George
                </h5>
                <p className="text-xs text-stone-500 mb-3">King George Drive, George (15 mins away)</p>
                <div className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold mb-4">
                  Marriott Hotel &amp; Suites
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  Contemporary comfort overlooking the George Golf Course, ideal for families and traveling friends.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Phone:</span>
                  <a href="tel:+27448747664" className="font-medium text-stone-800 hover:underline">+27 (0)44 874 7664</a>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Rate:</span>
                  <span className="font-semibold text-stone-800">From R1,250 / night</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-stone-400 font-mono text-[11px]">Code: WEDDING2027</span>
                  <button
                    onClick={() => copyToClipboard('WEDDING2027', 2)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blush-600 hover:text-blush-800"
                  >
                    {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 2 ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
