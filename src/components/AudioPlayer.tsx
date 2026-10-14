import React from 'react';
import { Volume2, VolumeX, Music, Disc } from 'lucide-react';

interface AudioPlayerProps {
  musicUrl: string;
  enabled: boolean;
  volume: number;
  autoLoop: boolean;
  iconStyle: 'disc' | 'wave' | 'notes';
  isPlaying: boolean;
  onTogglePlay: () => void;
  autoPlayFailed: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  musicUrl,
  enabled,
  volume,
  autoLoop,
  iconStyle,
  isPlaying,
  onTogglePlay,
  autoPlayFailed
}) => {
  if (!enabled || !musicUrl) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3">
      {autoPlayFailed && !isPlaying && (
        <div 
          onClick={onTogglePlay}
          className="cursor-pointer bg-[#231b17]/95 border border-[#c89d5c]/40 text-[#f7f2ea] text-xs px-3.5 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce transition-all hover:border-[#c89d5c]"
        >
          <span className="w-2 h-2 rounded-full bg-[#c89d5c] animate-ping" />
          <span>انقر للاستماع إلى الموسيقى</span>
        </div>
      )}

      <button
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        title={isPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        className={`w-12 h-12 rounded-full border border-[#c89d5c]/60 flex items-center justify-center transition-all duration-300 shadow-2xl backdrop-blur-md cursor-pointer ${
          isPlaying
            ? 'bg-[#c89d5c] text-[#17120f] shadow-[#c89d5c]/30 scale-105'
            : 'bg-[#231b17]/90 text-[#c89d5c] hover:bg-[#2e231e]'
        }`}
      >
        {isPlaying ? (
          iconStyle === 'disc' ? (
            <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
          ) : iconStyle === 'wave' ? (
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-1 bg-[#17120f] rounded-full h-2 animate-pulse" />
              <span className="w-1 bg-[#17120f] rounded-full h-4 animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 bg-[#17120f] rounded-full h-3 animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="w-1 bg-[#17120f] rounded-full h-4 animate-pulse" style={{ animationDelay: '450ms' }} />
            </div>
          ) : (
            <Volume2 className="w-5 h-5" />
          )
        ) : (
          <VolumeX className="w-5 h-5 text-[#c89d5c]/70" />
        )}
      </button>
    </div>
  );
};
