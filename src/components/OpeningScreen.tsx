import React from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Heart } from 'lucide-react';

interface OpeningScreenProps {
  groomName: string;
  brideName: string;
  headline: string;
  subheadline: string;
  buttonText: string;
  bgImage: string;
  bgVideo?: string;
  onOpen: () => void;
  isOpen: boolean;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({
  groomName,
  brideName,
  headline,
  subheadline,
  buttonText,
  bgImage,
  bgVideo,
  onOpen,
  isOpen
}) => {
  if (isOpen) return null;

  const handleOpenClick = () => {
    // Luxury golden confetti burst
    try {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#c89d5c', '#e6c88b', '#ffffff', '#8b6938']
      });
    } catch {
      // Fallback gracefully if confetti fails
    }
    onOpen();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#140e0b] transition-all duration-1000 ease-in-out">
      {/* Background Media */}
      {bgVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-75 scale-105"
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 filter brightness-70 scale-105 transition-transform duration-10000 ease-out"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Luxury Vignette & Grain Overlay */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#140e0b]/70 to-[#140e0b] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 max-w-lg w-full mx-4 p-8 sm:p-12 text-center border border-[#c89d5c]/30 rounded-2xl bg-[#1c1512]/90 backdrop-blur-md shadow-2xl shadow-black/80">
        {/* Subtle Decorative Arch */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-[#c89d5c]/40 flex items-center justify-center bg-[#241a15]/80 text-[#c89d5c]">
          <Heart className="w-7 h-7 stroke-[1.25] text-[#c89d5c]" />
        </div>

        {/* Headline / Bismillah */}
        <p className="text-[#c89d5c] text-sm tracking-widest font-heading mb-3">
          {headline || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
        </p>

        {/* Subheadline Quranic Verse */}
        <p className="text-[#d8cfc4] text-xs sm:text-sm leading-relaxed font-heading max-w-sm mx-auto mb-8 opacity-90">
          {subheadline}
        </p>

        {/* Divider with Monogram */}
        <div className="flex items-center justify-center gap-4 my-6">
          <div className="h-px bg-gradient-to-r from-transparent via-[#c89d5c]/60 to-transparent flex-1" />
          <span className="text-[#c89d5c] text-xs uppercase tracking-widest font-serif px-2">
            دعوة خاصة
          </span>
          <div className="h-px bg-gradient-to-r from-transparent via-[#c89d5c]/60 to-transparent flex-1" />
        </div>

        {/* Groom & Bride Names in Luxury Typography */}
        <div className="py-2 mb-8">
          <h1 className="text-3xl sm:text-4xl text-[#fbf7f0] font-heading font-bold mb-2">
            {groomName}
          </h1>
          <div className="text-[#c89d5c] font-calligraphy text-2xl my-1">
            و
          </div>
          <h1 className="text-3xl sm:text-4xl text-[#fbf7f0] font-heading font-bold">
            {brideName}
          </h1>
        </div>

        {/* Open Invitation CTA */}
        <button
          onClick={handleOpenClick}
          className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#b38546] via-[#c89d5c] to-[#b38546] text-[#140e0b] font-medium text-sm sm:text-base shadow-xl shadow-[#c89d5c]/20 hover:shadow-[#c89d5c]/40 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#140e0b] group-hover:rotate-12 transition-transform" />
          <span>{buttonText || 'افتح الدعوة'}</span>
        </button>

        <p className="text-[#8c7b70] text-xs mt-6 tracking-wide">
          يسرنا ويشرفنا حضوركم ومشاركتنا فرحتنا
        </p>
      </div>
    </div>
  );
};
