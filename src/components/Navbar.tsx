import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface NavbarProps {
  groomName: string;
  brideName: string;
  onReopenSplash: () => void;
  rsvpEnabled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  groomName,
  brideName,
  onReopenSplash,
  rsvpEnabled
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#17120f]/90 backdrop-blur-md border-b border-[#c89d5c]/20 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReopenSplash}
            title="إعادة فتح شاشة الترحيب"
            className="flex items-center gap-2 text-right group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full border border-[#c89d5c]/40 flex items-center justify-center bg-[#231b17] text-[#c89d5c] group-hover:border-[#c89d5c] transition-colors">
              <Heart className="w-3.5 h-3.5 text-[#c89d5c]" />
            </div>
            <span className="font-heading text-base sm:text-lg text-[#fbf7f0] font-semibold whitespace-nowrap">
              {groomName} & {brideName}
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm text-[#d8cfc4]">
          <a href="#couple" className="hover:text-[#c89d5c] transition-colors whitespace-nowrap">
            العروسان
          </a>
          <a href="#invitation" className="hover:text-[#c89d5c] transition-colors whitespace-nowrap">
            رسالة الدعوة
          </a>
          <a href="#countdown" className="hover:text-[#c89d5c] transition-colors whitespace-nowrap">
            موعد الزفاف
          </a>
          <a href="#venue" className="hover:text-[#c89d5c] transition-colors whitespace-nowrap">
            مكان الحفل
          </a>
          <a href="#photos" className="hover:text-[#c89d5c] transition-colors whitespace-nowrap">
            الصور التذكارية
          </a>
          {rsvpEnabled && (
            <a href="#rsvp" className="hover:text-[#c89d5c] transition-colors whitespace-nowrap">
              تأكيد الحضور
            </a>
          )}
        </nav>

        {/* Zone 3: Primary Action - RSVP quick link (NO admin button in header) */}
        <div className="flex items-center gap-2.5">
          {rsvpEnabled && (
            <a
              href="#rsvp"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#c89d5c]/20 hover:bg-[#c89d5c]/30 text-[#e6c88b] text-xs font-medium border border-[#c89d5c]/40 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3 text-[#c89d5c]" />
              <span>تأكيد الحضور</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
