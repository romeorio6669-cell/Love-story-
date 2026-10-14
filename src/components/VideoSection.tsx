import React from 'react';
import { VideoItem } from '../types/invitation';
import { PlayCircle } from 'lucide-react';

interface VideoSectionProps {
  videos: VideoItem[];
}

export const VideoSection: React.FC<VideoSectionProps> = ({ videos }) => {
  if (!videos || videos.length === 0) return null;

  const sortedVideos = [...videos].sort((a, b) => a.order - b.order);
  const mainVideo = sortedVideos.find(v => v.type === 'main') || sortedVideos[0];
  const galleryVideos = sortedVideos.filter(v => v.id !== mainVideo?.id);

  return (
    <section id="videos" className="py-20 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16 space-y-3">
        <span className="text-[#c89d5c] text-xs uppercase tracking-widest font-serif">
          فيديو ليلة العمر
        </span>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#fbf7f0]">
          توثيق اللحظات الاستثنائية
        </h2>
        <div className="w-12 h-0.5 bg-[#c89d5c]/60 mx-auto mt-4" />
      </div>

      {/* Main Highlight Video */}
      {mainVideo && (
        <div className="bg-[#231b17] rounded-3xl overflow-hidden border border-[#4a382e]/80 shadow-2xl mb-12">
          <div className="relative aspect-video w-full bg-[#120c09]">
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            >
              <source src={mainVideo.url} type="video/mp4" />
              متصفحك لا يدعم تشغيل ملفات الفيديو مباشرة.
            </video>
          </div>
          <div className="p-6 sm:p-8 space-y-2">
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-[#fbf7f0]">
              {mainVideo.title}
            </h3>
            {mainVideo.description && (
              <p className="text-xs sm:text-sm text-[#d8cfc4] leading-relaxed">
                {mainVideo.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Additional Videos Gallery */}
      {galleryVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {galleryVideos.map((vid) => (
            <div
              key={vid.id}
              className="bg-[#231b17] rounded-2xl overflow-hidden border border-[#4a382e]/60 shadow-lg"
            >
              <div className="aspect-video bg-[#120c09]">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                >
                  <source src={vid.url} type="video/mp4" />
                </video>
              </div>
              <div className="p-5">
                <h4 className="text-base font-heading font-bold text-[#fbf7f0] mb-1">
                  {vid.title}
                </h4>
                {vid.description && (
                  <p className="text-xs text-[#b09e90]">
                    {vid.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
