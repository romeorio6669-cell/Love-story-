import React from 'react';
import { TimelineEvent } from '../types/invitation';
import { Clock } from 'lucide-react';

interface TimelineSectionProps {
  events: TimelineEvent[];
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ events }) => {
  if (!events || events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => a.order - b.order);

  return (
    <section className="py-20 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-16 space-y-3">
        <span className="text-[#c89d5c] text-xs uppercase tracking-widest font-serif">
          برنامج الاحتفال
        </span>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#fbf7f0]">
          جدول مواعيد ليلة العمر
        </h2>
        <div className="w-12 h-0.5 bg-[#c89d5c]/60 mx-auto mt-4" />
      </div>

      <div className="relative border-r border-[#c89d5c]/40 mr-4 sm:mr-8 space-y-8 pr-6 sm:pr-8">
        {sortedEvents.map((evt) => (
          <div key={evt.id} className="relative group">
            {/* Timeline Marker Dot */}
            <div className="absolute -right-[31px] sm:-right-[39px] top-1.5 w-4 h-4 rounded-full border-2 border-[#c89d5c] bg-[#17120f] group-hover:bg-[#c89d5c] transition-colors" />

            <div className="bg-[#231b17] border border-[#4a382e]/70 rounded-2xl p-6 shadow-lg hover:border-[#c89d5c]/40 transition-colors">
              <div className="flex items-center gap-2 text-[#c89d5c] text-xs sm:text-sm font-semibold mb-2">
                <Clock className="w-4 h-4" />
                <span>{evt.time}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-bold text-[#fbf7f0] mb-2">
                {evt.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#d8cfc4] leading-relaxed">
                {evt.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
