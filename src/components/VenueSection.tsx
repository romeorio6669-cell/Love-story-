import React from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

interface VenueSectionProps {
  venueName: string;
  venueCity: string;
  venueAddress: string;
  venueDescription?: string;
  venueMapUrl: string;
  venueImage?: string;
}

export const VenueSection: React.FC<VenueSectionProps> = ({
  venueName,
  venueCity,
  venueAddress,
  venueDescription,
  venueMapUrl,
  venueImage
}) => {
  return (
    <section id="venue" className="py-20 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16 space-y-3">
        <span className="text-[#c89d5c] text-xs uppercase tracking-widest font-serif">
          موقع الحفل والضيافة
        </span>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#fbf7f0]">
          مكان الاحتفال المبارك
        </h2>
        <div className="w-12 h-0.5 bg-[#c89d5c]/60 mx-auto mt-4" />
      </div>

      <div className="bg-[#231b17] rounded-3xl overflow-hidden border border-[#4a382e]/80 shadow-2xl grid grid-cols-1 lg:grid-cols-2">
        {/* Venue Image */}
        {venueImage && (
          <div className="relative min-h-[300px] lg:min-h-[420px] bg-[#1a130f]">
            <img
              src={venueImage}
              alt={venueName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#231b17] via-transparent to-transparent lg:hidden opacity-80" />
          </div>
        )}

        {/* Venue Information */}
        <div className="p-8 sm:p-12 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-[#c89d5c] text-xs uppercase tracking-wider font-semibold">
              <MapPin className="w-4 h-4" />
              <span>{venueCity}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#fbf7f0]">
              {venueName}
            </h3>

            <p className="text-sm sm:text-base text-[#d8cfc4] leading-relaxed">
              {venueAddress}
            </p>

            {venueDescription && (
              <div className="p-4 rounded-xl bg-[#1c1512] border border-[#3d2c23] text-xs sm:text-sm text-[#b09e90] leading-relaxed">
                {venueDescription}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#3d2c23]">
            <a
              href={venueMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] font-medium text-sm transition-all shadow-lg hover:shadow-[#c89d5c]/30 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-[#140e0b]" />
              <span>عرض الموقع على الخريطة (Google Maps)</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#140e0b]/80" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
