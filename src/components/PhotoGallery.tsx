import React, { useState, useRef } from 'react';
import { PhotoItem } from '../types/invitation';
import { X, ChevronLeft, ChevronRight, ZoomIn, Sparkles, Pause, Play } from 'lucide-react';

interface PhotoGalleryProps {
  photos: PhotoItem[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  if (!photos || photos.length === 0) return null;

  const sortedPhotos = [...photos].sort((a, b) => a.order - b.order);

  // Multiply items to guarantee a continuous smooth seamless infinite loop
  const marqueeItems = [
    ...sortedPhotos,
    ...sortedPhotos,
    ...sortedPhotos,
    ...sortedPhotos
  ];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + sortedPhotos.length) % sortedPhotos.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % sortedPhotos.length);
  };

  const handleScrollManual = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section id="photos" className="py-20 px-0 sm:px-4 max-w-7xl mx-auto overflow-hidden">
      {/* Section Header */}
      <div className="text-center mb-10 px-4 space-y-3">
        <span className="text-[#c89d5c] text-xs uppercase tracking-widest font-serif">
          ألبوم الذكريات السعيدة
        </span>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#fbf7f0]">
          معرض الصور التذكارية
        </h2>
        <div className="w-12 h-0.5 bg-[#c89d5c]/60 mx-auto mt-4" />
        <p className="text-xs text-[#8c7b70] pt-1">
          شريط متحرك مستمر · انقر على أي صورة لعرضها بحجم كامل
        </p>
      </div>

      {/* Marquee Track Container with Luxury Edge Vignette Gradients */}
      <div className="relative group w-full overflow-hidden py-4">
        {/* Right Vignette Gradient Mask (RTL Start) */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#17120f] to-transparent z-20 pointer-events-none" />
        
        {/* Left Vignette Gradient Mask (RTL End) */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#17120f] to-transparent z-20 pointer-events-none" />

        {/* Manual Left/Right Controls on Hover */}
        <div className="absolute inset-y-0 right-3 z-30 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleScrollManual('right')}
            className="w-10 h-10 rounded-full bg-[#1c1512]/90 border border-[#c89d5c]/60 text-[#c89d5c] hover:bg-[#c89d5c] hover:text-[#140e0b] flex items-center justify-center shadow-xl transition-all cursor-pointer"
            aria-label="السابق"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute inset-y-0 left-3 z-30 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleScrollManual('left')}
            className="w-10 h-10 rounded-full bg-[#1c1512]/90 border border-[#c89d5c]/60 text-[#c89d5c] hover:bg-[#c89d5c] hover:text-[#140e0b] flex items-center justify-center shadow-xl transition-all cursor-pointer"
            aria-label="التالي"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* The Continuous Infinite Marquee Strip */}
        <div
          ref={scrollContainerRef}
          className="photo-marquee-track flex gap-4 sm:gap-6 items-center px-4"
          style={{
            animationPlayState: isPaused ? 'paused' : undefined
          }}
        >
          {marqueeItems.map((photo, index) => {
            const originalIndex = index % sortedPhotos.length;
            return (
              <div
                key={`${photo.id}-${index}`}
                onClick={() => setSelectedPhotoIndex(originalIndex)}
                className="relative shrink-0 w-64 sm:w-80 h-72 sm:h-96 rounded-2xl overflow-hidden bg-[#231b17] border border-[#4a382e]/80 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-[#c89d5c] cursor-pointer group/card"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'صورة من الزفاف'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="100%" height="100%" fill="%23231b17"/><text x="50%" y="50%" fill="%23c89d5c" font-size="14" text-anchor="middle" dy=".3em">صورة تذكارية</text></svg>';
                  }}
                />

                {/* Ambient Scrim & Caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#140e0b]/95 via-[#140e0b]/30 to-transparent opacity-80 sm:opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      {photo.category && (
                        <span className="text-[10px] text-[#c89d5c] uppercase tracking-wider block mb-1">
                          {photo.category}
                        </span>
                      )}
                      {photo.caption && (
                        <p className="text-sm font-medium text-[#fbf7f0] font-heading">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#c89d5c]/30 backdrop-blur-sm border border-[#c89d5c]/60 flex items-center justify-center text-[#fbf7f0]">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pause/Play helper button */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#231b17] border border-[#4a382e] hover:border-[#c89d5c] text-xs text-[#8c7b70] hover:text-[#c89d5c] transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          <span>{isPaused ? 'استئناف حركة الشريط' : 'إيقاف الشريط مؤقتاً'}</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <div
          onClick={() => setSelectedPhotoIndex(null)}
          className="fixed inset-0 z-50 bg-[#140e0b]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-6 left-6 text-[#d8cfc4] hover:text-[#fbf7f0] p-2.5 rounded-full bg-[#231b17]/90 border border-[#4a382e] hover:border-[#c89d5c] transition-colors z-20 cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Controls */}
          {sortedPhotos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute right-4 sm:right-8 text-[#d8cfc4] hover:text-[#c89d5c] p-3 rounded-full bg-[#231b17]/80 border border-[#4a382e] hover:border-[#c89d5c] transition-colors z-20 cursor-pointer"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute left-4 sm:left-8 text-[#d8cfc4] hover:text-[#c89d5c] p-3 rounded-full bg-[#231b17]/80 border border-[#4a382e] hover:border-[#c89d5c] transition-colors z-20 cursor-pointer"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image & Caption Display */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] flex flex-col items-center"
          >
            <img
              src={sortedPhotos[selectedPhotoIndex].url}
              alt={sortedPhotos[selectedPhotoIndex].caption || 'صورة مكبرة'}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-[#c89d5c]/30"
            />
            {sortedPhotos[selectedPhotoIndex].caption && (
              <div className="mt-4 text-center">
                <p className="text-base sm:text-lg text-[#fbf7f0] font-heading font-semibold">
                  {sortedPhotos[selectedPhotoIndex].caption}
                </p>
                <span className="text-xs text-[#8c7b70] mt-1 block">
                  {selectedPhotoIndex + 1} من {sortedPhotos.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
