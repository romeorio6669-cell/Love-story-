import React from 'react';
import { Sparkles } from 'lucide-react';

interface InvitationCardProps {
  title: string;
  verse?: string;
  familyNamesText?: string;
  message: string;
  textAlign?: 'center' | 'right' | 'justify';
  bgStyle?: 'dark' | 'chocolate' | 'gold-border' | 'minimal';
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  title,
  verse,
  familyNamesText,
  message,
  textAlign = 'center',
  bgStyle = 'gold-border'
}) => {
  const getCardStyle = () => {
    switch (bgStyle) {
      case 'chocolate':
        return 'bg-[#2a1c15] border border-[#5a3e2c] shadow-2xl';
      case 'gold-border':
        return 'bg-[#201713] border-2 border-[#c89d5c]/50 shadow-2xl shadow-[#c89d5c]/10';
      case 'minimal':
        return 'bg-transparent border border-[#4a382e]/40 shadow-none';
      case 'dark':
      default:
        return 'bg-[#1c1512] border border-[#3d2c23] shadow-xl';
    }
  };

  const getAlignClass = () => {
    switch (textAlign) {
      case 'right':
        return 'text-right';
      case 'justify':
        return 'text-justify';
      case 'center':
      default:
        return 'text-center';
    }
  };

  return (
    <section id="invitation" className="py-20 px-4 max-w-4xl mx-auto">
      <div className={`relative p-8 sm:p-14 rounded-3xl transition-all duration-300 ${getCardStyle()}`}>
        {/* Subtle Decorative Gold Corners */}
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#c89d5c]/60 pointer-events-none" />
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#c89d5c]/60 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#c89d5c]/60 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#c89d5c]/60 pointer-events-none" />

        <div className="space-y-6">
          {/* Family Names Banner */}
          {familyNamesText && (
            <p className="text-sm sm:text-base font-medium text-[#c89d5c] tracking-wide text-center">
              {familyNamesText}
            </p>
          )}

          {/* Section Title */}
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#fbf7f0] text-center">
            {title}
          </h2>

          {/* Quranic Verse */}
          {verse && (
            <div className="max-w-xl mx-auto my-4 text-center">
              <p className="text-sm sm:text-base font-heading italic text-[#e6c88b] leading-relaxed">
                {verse}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 my-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#c89d5c]/50 to-transparent w-24" />
            <Sparkles className="w-4 h-4 text-[#c89d5c]" />
            <div className="h-px bg-gradient-to-r from-transparent via-[#c89d5c]/50 to-transparent w-24" />
          </div>

          {/* Main Invitation Message */}
          <div className={`max-w-2xl mx-auto text-base sm:text-lg leading-relaxed text-[#f0e6da] font-light ${getAlignClass()}`}>
            <p className="whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Closing Blessing */}
          <div className="pt-6 text-center text-xs sm:text-sm text-[#a39284]">
            <span>دام الله أفراحكم ومسراتكم</span>
          </div>
        </div>
      </div>
    </section>
  );
};
