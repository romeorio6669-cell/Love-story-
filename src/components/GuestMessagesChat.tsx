import React, { useState, useEffect } from 'react';
import { MessageSquareHeart, Heart, Sparkles, User, Pause, Play } from 'lucide-react';
import { PublicGuestMessage } from '../types/invitation';
import { safeFetchJson } from '../utils/api';

interface GuestMessagesChatProps {
  refreshTrigger?: number;
}

export const GuestMessagesChat: React.FC<GuestMessagesChatProps> = ({ refreshTrigger = 0 }) => {
  const [messages, setMessages] = useState<PublicGuestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await safeFetchJson<{ messages: PublicGuestMessage[] }>('/api/guest-messages');
      if (res.ok && res.data) {
        setMessages(res.data.messages || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [refreshTrigger]);

  if (loading && messages.length === 0) return null;
  if (!loading && messages.length === 0) return null;

  // Duplicate items for continuous seamless infinite looping
  const loopedMessages = [
    ...messages,
    ...messages,
    ...messages,
    ...messages
  ];

  return (
    <section className="py-16 px-0 sm:px-4 max-w-7xl mx-auto overflow-hidden">
      {/* Section Header */}
      <div className="text-center mb-10 px-4 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#231b17] border border-[#c89d5c]/40 text-[#c89d5c] text-xs">
          <MessageSquareHeart className="w-3.5 h-3.5" />
          <span>رسائل وتهاني الأحبة</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[#fbf7f0]">
          نبض التهاني ومشاعر الضيوف
        </h2>
        <div className="w-12 h-0.5 bg-[#c89d5c]/60 mx-auto mt-2" />
        <p className="text-xs text-[#8c7b70]">
          رسائل التهنئة والمحبة المرسلة من الأهل والأصدقاء بمناسبة الزفاف المبارك
        </p>
      </div>

      {/* Marquee Track with Luxury Edge Vignette Gradients */}
      <div className="relative group w-full overflow-hidden py-2">
        {/* Right Vignette Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#17120f] to-transparent z-20 pointer-events-none" />

        {/* Left Vignette Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#17120f] to-transparent z-20 pointer-events-none" />

        {/* Continuous Chat Strip */}
        <div
          className="chat-marquee-track flex gap-4 sm:gap-6 items-stretch px-4"
          style={{
            animationPlayState: isPaused ? 'paused' : undefined
          }}
        >
          {loopedMessages.map((msg, index) => (
            <div
              key={`${msg.id}-${index}`}
              className="relative shrink-0 w-72 sm:w-88 rounded-2xl bg-[#231b17] border border-[#4a382e]/80 p-5 shadow-xl transition-all duration-300 hover:border-[#c89d5c] hover:bg-[#281f1b] flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Author Header */}
                <div className="flex items-center justify-between border-b border-[#3d2c23] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1c1512] border border-[#c89d5c]/50 text-[#c89d5c] flex items-center justify-center font-heading font-bold text-xs shrink-0">
                      {msg.guestName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-heading font-bold text-[#fbf7f0] leading-tight">
                        {msg.guestName}
                      </h4>
                      <span className="text-[10px] text-[#8c7b70] block">
                        ضيف كريم
                      </span>
                    </div>
                  </div>

                  <Heart className="w-4 h-4 text-[#c89d5c]/60 fill-[#c89d5c]/20" />
                </div>

                {/* Message Content */}
                <p className="text-xs sm:text-sm text-[#e8dfd5] leading-relaxed line-clamp-4 font-light">
                  «{msg.message}»
                </p>
              </div>

              {/* Timestamp */}
              <div className="mt-4 pt-2 flex items-center justify-between text-[10px] text-[#7e6d62]">
                <span>تهنئة مباركة</span>
                <span>{new Date(msg.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Pause/Resume Toggle */}
      <div className="mt-4 flex items-center justify-center">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#231b17] border border-[#4a382e] hover:border-[#c89d5c] text-xs text-[#8c7b70] hover:text-[#c89d5c] transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          <span>{isPaused ? 'استئناف حركة الرسائل' : 'إيقاف مؤقت للقراءة'}</span>
        </button>
      </div>
    </section>
  );
};
