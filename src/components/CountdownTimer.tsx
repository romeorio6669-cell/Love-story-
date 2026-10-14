import React, { useEffect, useState } from 'react';
import { CalendarPlus, Clock } from 'lucide-react';
import { createGoogleCalendarUrl } from '../utils/calendar';

interface CountdownTimerProps {
  targetDate: string; // ISO date string
  siteTitle: string;
  venueName: string;
  venueAddress: string;
  startTimeText: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  siteTitle,
  venueName,
  venueAddress,
  startTimeText
}) => {
  const calculateTimeLeft = (): TimeLeft => {
    try {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isPast: false
      };
    } catch {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
    }
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    // Initial compute
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const calendarUrl = createGoogleCalendarUrl(
    siteTitle,
    `حفل زفاف مبارك - حضوركم شرف لنا وسعادة. الموعد: ${startTimeText}`,
    `${venueName}, ${venueAddress}`,
    targetDate
  );

  return (
    <section id="countdown" className="py-20 px-4 max-w-4xl mx-auto text-center">
      <div className="space-y-4 mb-12">
        <span className="text-[#c89d5c] text-xs uppercase tracking-widest font-serif">
          العد التنازلي لليوم المنتظر
        </span>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#fbf7f0]">
          {timeLeft.isPast ? 'تم حفل الزفاف المبارك بحمد الله' : 'نعد الثواني بشوق للقياكم'}
        </h2>
        <p className="text-xs sm:text-sm text-[#b09e90]">
          موعد انطلاق الحفل: {startTimeText}
        </p>
      </div>

      {/* Countdown Grid with Tabular Numerals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto mb-10">
        {/* Days */}
        <div className="bg-[#231b17] border border-[#4a382e]/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#c89d5c]/50 transition-colors">
          <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-[#e6c88b] mb-1">
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div className="text-xs sm:text-sm text-[#b09e90] font-medium">
            يوم
          </div>
        </div>

        {/* Hours */}
        <div className="bg-[#231b17] border border-[#4a382e]/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#c89d5c]/50 transition-colors">
          <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-[#e6c88b] mb-1">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-xs sm:text-sm text-[#b09e90] font-medium">
            ساعة
          </div>
        </div>

        {/* Minutes */}
        <div className="bg-[#231b17] border border-[#4a382e]/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#c89d5c]/50 transition-colors">
          <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-[#e6c88b] mb-1">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-xs sm:text-sm text-[#b09e90] font-medium">
            دقيقة
          </div>
        </div>

        {/* Seconds */}
        <div className="bg-[#231b17] border border-[#4a382e]/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#c89d5c]/50 transition-colors">
          <div className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-[#c89d5c] mb-1">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs sm:text-sm text-[#b09e90] font-medium">
            ثانية
          </div>
        </div>
      </div>

      {/* Add to Google Calendar Action */}
      {calendarUrl && (
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#231b17] border border-[#c89d5c]/60 text-[#e6c88b] text-xs sm:text-sm hover:bg-[#2c221d] hover:border-[#c89d5c] transition-all shadow-lg hover:shadow-[#c89d5c]/20"
        >
          <CalendarPlus className="w-4 h-4 text-[#c89d5c]" />
          <span>إضافة الموعد إلى تقويم جوجل (Google Calendar)</span>
        </a>
      )}
    </section>
  );
};
