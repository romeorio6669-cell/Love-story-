import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface HeroSectionProps {
  groomName: string;
  brideName: string;
  weddingDateHijri?: string;
  weddingDate: string;
  venueName: string;
  venueCity: string;
  eventStartTimeText: string;
  bgImage: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  groomName,
  brideName,
  weddingDateHijri,
  weddingDate,
  venueName,
  venueCity,
  eventStartTimeText,
  bgImage
}) => {
  // Format Gregorian date in Arabic
  const formattedGregorian = React.useMemo(() => {
    try {
      const d = new Date(weddingDate);
      return d.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }, [weddingDate]);

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center text-center overflow-hidden py-20 px-4">
      {/* Background with measured luxury dark scrim */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.4] scale-100 transition-all duration-700"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#17120f]/80 via-transparent to-[#17120f]" />

      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        {/* Editorial Subtitle */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c89d5c]/40 bg-[#17120f]/80 text-[#c89d5c] text-xs sm:text-sm tracking-wider font-medium backdrop-blur-sm">
          <span>احتفال ليلة العمر</span>
        </div>

        {/* Couple Names */}
        <div className="py-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-bold text-[#fbf7f0] tracking-wide leading-tight">
            {groomName}
          </h1>
          <div className="my-2 text-3xl sm:text-4xl font-calligraphy text-[#c89d5c]">
            و
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-bold text-[#fbf7f0] tracking-wide leading-tight">
            {brideName}
          </h1>
        </div>

        {/* Elegant Gold Divider */}
        <div className="flex items-center justify-center gap-4 max-w-xs mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-[#c89d5c]/60 to-transparent flex-1" />
          <div className="w-2 h-2 rotate-45 border border-[#c89d5c] bg-[#c89d5c]/30" />
          <div className="h-px bg-gradient-to-r from-transparent via-[#c89d5c]/60 to-transparent flex-1" />
        </div>

        {/* Date & Location Highlights */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-[#e8dfd5]">
          {weddingDateHijri && (
            <div className="flex items-center gap-2 bg-[#231b17]/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-[#4a382e]/50">
              <Calendar className="w-4 h-4 text-[#c89d5c]" />
              <span>{weddingDateHijri}</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#231b17]/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-[#4a382e]/50">
            <Clock className="w-4 h-4 text-[#c89d5c]" />
            <span>{eventStartTimeText || 'الساعة 08:00 مساءً'}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#231b17]/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-[#4a382e]/50">
            <MapPin className="w-4 h-4 text-[#c89d5c]" />
            <span>{venueCity} · {venueName}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
