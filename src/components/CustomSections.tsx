import React from 'react';
import { CustomSectionItem } from '../types/invitation';
import { Sparkles } from 'lucide-react';

interface CustomSectionsProps {
  sections: CustomSectionItem[];
}

export const CustomSections: React.FC<CustomSectionsProps> = ({ sections }) => {
  if (!sections || sections.length === 0) return null;

  const visibleSections = sections
    .filter(s => s.isVisible)
    .sort((a, b) => a.order - b.order);

  if (visibleSections.length === 0) return null;

  return (
    <div className="space-y-12 py-12 px-4 max-w-4xl mx-auto">
      {visibleSections.map((sec) => (
        <section
          key={sec.id}
          className="bg-[#231b17] border border-[#4a382e]/80 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden"
        >
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            {sec.subtitle && (
              <span className="text-[#c89d5c] text-xs uppercase tracking-widest font-serif block">
                {sec.subtitle}
              </span>
            )}
            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#fbf7f0]">
              {sec.title}
            </h3>

            <div className="flex items-center justify-center gap-3 my-4">
              <div className="h-px bg-gradient-to-r from-transparent via-[#c89d5c]/40 to-transparent w-20" />
              <Sparkles className="w-3.5 h-3.5 text-[#c89d5c]" />
              <div className="h-px bg-gradient-to-r from-transparent via-[#c89d5c]/40 to-transparent w-20" />
            </div>

            {sec.imageUrl && (
              <div className="my-6 rounded-2xl overflow-hidden max-w-md mx-auto aspect-video bg-[#18120e]">
                <img
                  src={sec.imageUrl}
                  alt={sec.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <p className="text-sm sm:text-base text-[#d8cfc4] leading-relaxed whitespace-pre-line">
              {sec.content}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
};
