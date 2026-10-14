import React from 'react';
import { Heart } from 'lucide-react';

interface CoupleSectionProps {
  groomName: string;
  brideName: string;
  groomBio?: string;
  brideBio?: string;
  groomImage: string;
  brideImage: string;
}

export const CoupleSection: React.FC<CoupleSectionProps> = ({
  groomName,
  brideName,
  groomBio,
  brideBio,
  groomImage,
  brideImage
}) => {
  return (
    <section id="couple" className="py-20 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-16 space-y-3">
        <span className="text-[#c89d5c] text-xs uppercase tracking-widest font-serif">
          العروسان المباركان
        </span>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#fbf7f0]">
          قلبان يجمعهما الميثاق الغليظ
        </h2>
        <div className="w-12 h-0.5 bg-[#c89d5c]/60 mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Groom Card */}
        <div className="group relative bg-[#231b17] rounded-3xl p-6 sm:p-8 border border-[#4a382e]/60 hover:border-[#c89d5c]/50 transition-all duration-300 shadow-xl">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-6 bg-[#1a130f]">
            <img
              src={groomImage}
              alt={groomName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#231b17] via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-4 right-4 bg-[#17120f]/80 backdrop-blur-sm border border-[#c89d5c]/40 text-[#c89d5c] text-xs px-3 py-1 rounded-full">
              العريس
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-heading font-bold text-[#fbf7f0]">
              {groomName}
            </h3>
            {groomBio && (
              <p className="text-sm text-[#d8cfc4] leading-relaxed max-w-md mx-auto pt-1">
                {groomBio}
              </p>
            )}
          </div>
        </div>

        {/* Bride Card */}
        <div className="group relative bg-[#231b17] rounded-3xl p-6 sm:p-8 border border-[#4a382e]/60 hover:border-[#c89d5c]/50 transition-all duration-300 shadow-xl">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-6 bg-[#1a130f]">
            <img
              src={brideImage}
              alt={brideName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#231b17] via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-4 right-4 bg-[#17120f]/80 backdrop-blur-sm border border-[#c89d5c]/40 text-[#c89d5c] text-xs px-3 py-1 rounded-full">
              العروس
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-heading font-bold text-[#fbf7f0]">
              {brideName}
            </h3>
            {brideBio && (
              <p className="text-sm text-[#d8cfc4] leading-relaxed max-w-md mx-auto pt-1">
                {brideBio}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
