import React from 'react';
import { Heart, Settings } from 'lucide-react';

interface FooterProps {
  groomName: string;
  brideName: string;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  groomName,
  brideName,
  onOpenAdmin
}) => {
  return (
    <footer className="border-t border-[#4a382e]/50 bg-[#140e0b] py-14 px-4 text-center">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="w-10 h-10 rounded-full border border-[#c89d5c]/40 flex items-center justify-center mx-auto bg-[#231b17] text-[#c89d5c]">
          <Heart className="w-4 h-4 text-[#c89d5c]" />
        </div>

        <div className="space-y-2">
          <p className="font-heading text-xl sm:text-2xl text-[#fbf7f0] font-bold">
            {groomName} & {brideName}
          </p>
          <p className="text-xs sm:text-sm text-[#a8978a] font-light max-w-md mx-auto">
            بارك الله لهما وبارك عليهما وجمع بينهما في خير ومحبة وبركة
          </p>
        </div>

        <div className="pt-6 border-t border-[#2a1c15] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6e5d52]">
          <p>© {new Date().getFullYear()} دعوة زفاف إلكترونية فاخرة. جميع الحقوق محفوظة.</p>

          {/* Small subtle English "Settings" button at bottom of site */}
          <button
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#7e6d62] hover:text-[#c89d5c] hover:bg-[#1f1713] border border-transparent hover:border-[#4a382e] transition-all cursor-pointer font-sans"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
