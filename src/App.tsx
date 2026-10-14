import React, { useEffect, useState, useRef } from 'react';
import { defaultInvitationData } from './data/initialData';
import { InvitationData } from './types/invitation';
import { Navbar } from './components/Navbar';
import { OpeningScreen } from './components/OpeningScreen';
import { HeroSection } from './components/HeroSection';
import { CoupleSection } from './components/CoupleSection';
import { InvitationCard } from './components/InvitationCard';
import { CountdownTimer } from './components/CountdownTimer';
import { VenueSection } from './components/VenueSection';
import { TimelineSection } from './components/TimelineSection';
import { PhotoGallery } from './components/PhotoGallery';
import { VideoSection } from './components/VideoSection';
import { CustomSections } from './components/CustomSections';
import { RsvpSection } from './components/RsvpSection';
import { GuestMessagesChat } from './components/GuestMessagesChat';
import { Footer } from './components/Footer';
import { AudioPlayer } from './components/AudioPlayer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Eye } from 'lucide-react';
import { safeFetchJson } from './utils/api';

export default function App() {
  const [data, setData] = useState<InvitationData>(defaultInvitationData);
  const [loading, setLoading] = useState(true);
  const [hasOpenedInvitation, setHasOpenedInvitation] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [rsvpRefreshTrigger, setRsvpRefreshTrigger] = useState(0);

  // Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoPlayFailed, setAutoPlayFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Admin Auth & Modal State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('wedding_admin_token');
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    return !!localStorage.getItem('wedding_admin_token');
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // Check auth on load
  const verifyAuth = async (token: string) => {
    setIsCheckingAuth(true);
    try {
      const res = await safeFetchJson<{ authenticated: boolean }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && res.data?.authenticated) {
        setIsAdminLoggedIn(true);
      } else {
        setIsAdminLoggedIn(false);
        localStorage.removeItem('wedding_admin_token');
        setAdminToken(null);
      }
    } catch {
      setIsAdminLoggedIn(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Fetch invitation data from database with guaranteed fresh headers
  const loadInvitationData = async (isPreview = false) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (isPreview && adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const res = await safeFetchJson<{ data: InvitationData }>(
        `/api/invitation${isPreview ? '?preview=true' : ''}`,
        { headers }
      );
      if (res.ok && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load invitation data, using cached defaults', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      verifyAuth(adminToken);
    } else {
      setIsCheckingAuth(false);
    }
    loadInvitationData(previewMode);
  }, [adminToken, previewMode]);

  // Cross-device sync: refresh automatically when window regains focus or tab becomes active
  useEffect(() => {
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        loadInvitationData(previewMode);
      }
    };
    window.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    const interval = setInterval(() => {
      if (!isAdminDashboardOpen) {
        loadInvitationData(previewMode);
      }
    }, 45000);

    return () => {
      window.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
    };
  }, [previewMode, isAdminDashboardOpen, adminToken]);

  // Support direct URL routing to admin login (e.g. /admin, /login, /admin/login, ?admin=true)
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const isAdminPath =
      path.includes('/admin') ||
      path.includes('/login') ||
      search.includes('admin') ||
      search.includes('login');

    if (isAdminPath) {
      if (isCheckingAuth) {
        return; // Wait for initial session verification to complete
      }
      if (adminToken && isAdminLoggedIn) {
        setHasOpenedInvitation(true);
        setIsAdminDashboardOpen(true);
        setIsLoginModalOpen(false);
      } else {
        setIsLoginModalOpen(true);
      }
    }
  }, [adminToken, isAdminLoggedIn, isCheckingAuth]);

  // Audio handling
  useEffect(() => {
    if (!data.musicEnabled || !data.musicUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(data.musicUrl);
    } else {
      audioRef.current.src = data.musicUrl;
    }

    audioRef.current.volume = data.musicVolume || 0.75;
    audioRef.current.loop = data.musicAutoLoop ?? true;

    audioRef.current.onended = () => {
      if (!data.musicAutoLoop) {
        setIsPlayingAudio(false);
      }
    };
  }, [data.musicUrl, data.musicEnabled, data.musicVolume, data.musicAutoLoop]);

  const handleOpenInvitation = () => {
    setHasOpenedInvitation(true);

    if (data.musicEnabled && data.musicUrl && audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlayingAudio(true);
          setAutoPlayFailed(false);
        })
        .catch((err) => {
          console.warn('Browser prevented audio autoplay without direct interaction:', err);
          setAutoPlayFailed(true);
          setIsPlayingAudio(false);
        });
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlayingAudio(true);
          setAutoPlayFailed(false);
        })
        .catch((err) => {
          console.warn('Audio play error:', err);
        });
    }
  };

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('wedding_admin_token', token);
    setAdminToken(token);
    setIsAdminLoggedIn(true);
    setIsLoginModalOpen(false);
    setHasOpenedInvitation(true);
    setIsAdminDashboardOpen(true);
  };

  const handleLogout = async () => {
    if (adminToken) {
      try {
        await safeFetchJson('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('wedding_admin_token');
    setAdminToken(null);
    setIsAdminLoggedIn(false);
    setIsAdminDashboardOpen(false);
    setIsLoginModalOpen(false);
    setPreviewMode(false);
    loadInvitationData(false);
  };

  // Determine font family style
  const getFontFamilyStyle = () => {
    switch (data.fontFamily) {
      case 'aref-ruqaa':
        return { fontFamily: "'Aref Ruqaa', 'Amiri', serif" };
      case 'alexandria':
        return { fontFamily: "'Alexandria', sans-serif" };
      case 'amiri':
      default:
        return { fontFamily: "'Amiri', 'Alexandria', serif" };
    }
  };

  const isSectionVisible = (key: string) => {
    return !data.hiddenSections?.includes(key);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#140e0b] text-[#f7f2ea] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm bg-[#231b17] border border-[#c89d5c]/30 rounded-3xl p-8 shadow-2xl">
          <div className="w-12 h-12 border-4 border-[#c89d5c] border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-[#c89d5c]/20" />
          <h2 className="text-[#fbf7f0] font-heading text-lg font-bold">دعوة زفاف فاخرة</h2>
          <p className="text-xs text-[#c89d5c]">جاري تحميل تفاصيل ليلة العمر...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#17120f] text-[#f7f2ea] selection:bg-[#c89d5c]/30 selection:text-[#fbf7f0] transition-colors duration-300"
      style={getFontFamilyStyle()}
    >
      {/* Preview Mode Notification Bar for Admin */}
      {previewMode && (
        <div className="sticky top-0 z-50 bg-[#3d2e24] border-b border-[#c89d5c] px-4 py-2 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#c89d5c]" />
            <span className="text-[#fbf7f0] font-medium">
              أنت الآن في وضع «المعاينة المباشرة للمسودة». هذه التعديلات لم تُنشر للعامة بعد.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdminDashboardOpen(true)}
              className="px-3 py-1 rounded bg-[#c89d5c] text-[#140e0b] font-bold text-xs cursor-pointer"
            >
              العودة للوحة التحكم
            </button>
            <button
              onClick={() => {
                setPreviewMode(false);
                loadInvitationData(false);
              }}
              className="px-2.5 py-1 rounded bg-[#1c1512] text-[#d8cfc4] hover:text-[#fbf7f0] text-xs cursor-pointer"
            >
              عرض النسخة المنشورة
            </button>
          </div>
        </div>
      )}

      {/* Luxury Opening Screen */}
      <OpeningScreen
        groomName={data.groomName}
        brideName={data.brideName}
        headline={data.openingHeadline}
        subheadline={data.openingSubheadline}
        buttonText={data.openingButtonText}
        bgImage={data.openingBgImage}
        bgVideo={data.openingBgVideo}
        isOpen={hasOpenedInvitation}
        onOpen={handleOpenInvitation}
      />

      {/* Floating Audio Player */}
      <AudioPlayer
        musicUrl={data.musicUrl}
        enabled={data.musicEnabled}
        volume={data.musicVolume}
        autoLoop={data.musicAutoLoop}
        iconStyle={data.musicIconStyle}
        isPlaying={isPlayingAudio}
        onTogglePlay={handleTogglePlay}
        autoPlayFailed={autoPlayFailed}
      />

      {/* Navigation Bar - NO Admin button in header, only clean navigation */}
      <Navbar
        groomName={data.groomName}
        brideName={data.brideName}
        onReopenSplash={() => setHasOpenedInvitation(false)}
        rsvpEnabled={data.rsvpEnabled && isSectionVisible('rsvp')}
      />

      {/* Render Dynamic Sections in Configured Order */}
      <main className="space-y-12">
        {data.sectionsOrder?.map((sectionKey) => {
          if (!isSectionVisible(sectionKey)) return null;

          switch (sectionKey) {
            case 'hero':
              return (
                <HeroSection
                  key="hero"
                  groomName={data.groomName}
                  brideName={data.brideName}
                  weddingDateHijri={data.weddingDateHijri}
                  weddingDate={data.weddingDate}
                  venueName={data.venueName}
                  venueCity={data.venueCity}
                  eventStartTimeText={data.eventStartTimeText}
                  bgImage={data.openingBgImage}
                />
              );

            case 'couple':
              return (
                <CoupleSection
                  key="couple"
                  groomName={data.groomName}
                  brideName={data.brideName}
                  groomBio={data.groomBio}
                  brideBio={data.brideBio}
                  groomImage={data.groomImage}
                  brideImage={data.brideImage}
                />
              );

            case 'invitation':
              return (
                <InvitationCard
                  key="invitation"
                  title={data.invitationTitle}
                  verse={data.invitationVerse}
                  familyNamesText={data.familyNamesText}
                  message={data.invitationMessage}
                  textAlign={data.invitationTextAlign}
                  bgStyle={data.invitationBgStyle}
                />
              );

            case 'countdown':
              return (
                <CountdownTimer
                  key="countdown"
                  targetDate={data.weddingDate}
                  siteTitle={data.siteTitle}
                  venueName={data.venueName}
                  venueAddress={data.venueAddress}
                  startTimeText={data.eventStartTimeText}
                />
              );

            case 'venue':
              return (
                <VenueSection
                  key="venue"
                  venueName={data.venueName}
                  venueCity={data.venueCity}
                  venueAddress={data.venueAddress}
                  venueDescription={data.venueDescription}
                  venueMapUrl={data.venueMapUrl}
                  venueImage={data.venueImage}
                />
              );

            case 'timeline':
              return data.timelineEnabled ? (
                <TimelineSection key="timeline" events={data.timeline} />
              ) : null;

            case 'photos':
              return <PhotoGallery key="photos" photos={data.photos} />;

            case 'videos':
              return <VideoSection key="videos" videos={data.videos} />;

            case 'custom':
              return <CustomSections key="custom" sections={data.customSections} />;

            case 'rsvp':
              return (
                <React.Fragment key="rsvp-container">
                  {/* Guest Messages & Wishes Animated Chat Stream */}
                  <GuestMessagesChat refreshTrigger={rsvpRefreshTrigger} />

                  {/* Attendance Confirmation RSVP Form */}
                  <RsvpSection
                    enabled={data.rsvpEnabled}
                    deadlineText={data.rsvpDeadlineText}
                    allowCompanions={data.rsvpAllowCompanions}
                    maxCompanions={data.rsvpMaxCompanions}
                    notes={data.rsvpNotes}
                    onSuccess={() => setRsvpRefreshTrigger(prev => prev + 1)}
                  />
                </React.Fragment>
              );

            default:
              return null;
          }
        })}
      </main>

      {/* Footer with exclusively the subtle Settings button in English */}
      <Footer
        groomName={data.groomName}
        brideName={data.brideName}
        onOpenAdmin={() => {
          if (isAdminLoggedIn && adminToken) {
            setHasOpenedInvitation(true);
            setIsAdminDashboardOpen(true);
          } else {
            setIsLoginModalOpen(true);
          }
        }}
      />

      {/* Admin Login / Initial Setup Modal */}
      {isLoginModalOpen && (
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Full Admin Dashboard Overlay */}
      {isAdminDashboardOpen && adminToken && (
        <AdminDashboard
          token={adminToken}
          onLogout={handleLogout}
          onClose={() => {
            setIsAdminDashboardOpen(false);
            loadInvitationData(previewMode);
          }}
          onPreviewLive={() => {
            setPreviewMode(true);
            setIsAdminDashboardOpen(false);
            loadInvitationData(true);
          }}
        />
      )}
    </div>
  );
}
