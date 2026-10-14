import React, { useState, useEffect } from 'react';
import {
  Save,
  Globe,
  RotateCcw,
  LogOut,
  Eye,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Calendar,
  MapPin,
  FileText,
  Sliders,
  Users,
  Shield,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  MoveUp,
  MoveDown,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Upload,
  Search,
  Check,
  X
} from 'lucide-react';
import {
  InvitationData,
  PhotoItem,
  VideoItem,
  TimelineEvent,
  CustomSectionItem,
  RsvpResponse
} from '../../types/invitation';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
  onClose: () => void;
  onPreviewLive: () => void;
}

type TabType =
  | 'overview'
  | 'general'
  | 'message'
  | 'venue'
  | 'photos'
  | 'videos'
  | 'music'
  | 'timeline'
  | 'custom'
  | 'sections'
  | 'design'
  | 'rsvp'
  | 'security';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onLogout,
  onClose,
  onPreviewLive
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Invitation data state
  const [draft, setDraft] = useState<InvitationData | null>(null);
  const [published, setPublished] = useState<InvitationData | null>(null);

  // RSVP state
  const [rsvps, setRsvps] = useState<RsvpResponse[]>([]);
  const [rsvpSearch, setRsvpSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<'all' | 'attending' | 'apologizing'>('all');
  const [rsvpStats, setRsvpStats] = useState({
    totalResponses: 0,
    attendingTotalPersons: 0,
    attendingResponses: 0,
    apologizingCount: 0
  });

  // Audio preview in admin state
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const audioPreviewRef = React.useRef<HTMLAudioElement | null>(null);

  // Media link validation tester
  const [testUrl, setTestUrl] = useState('');
  const [testType, setTestType] = useState<'image' | 'video' | 'audio'>('image');
  const [testResult, setTestResult] = useState<{ loading: boolean; valid?: boolean; message?: string } | null>(null);

  // Admin credentials state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('Ramadan');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch draft & published data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invitation/draft', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const json = await res.json();
      setDraft(json.draft);
      setPublished(json.published);
    } catch (err) {
      showNotice('error', 'تعذر جلب بيانات لوحة التحكم من الخادم');
    } finally {
      setLoading(false);
    }
  };

  // Fetch RSVPs
  const fetchRsvps = async () => {
    try {
      const res = await fetch('/api/rsvp', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRsvps(json.rsvps || []);
        setRsvpStats({
          totalResponses: json.totalResponses || 0,
          attendingTotalPersons: json.attendingTotalPersons || 0,
          attendingResponses: json.attendingResponses || 0,
          apologizingCount: json.apologizingCount || 0
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
    fetchRsvps();
  }, [token]);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Save Draft to Database
  const handleSaveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch('/api/invitation/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ draft })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ المسودة');
      setDraft(data.draft);
      showNotice('success', 'تم حفظ التعديلات بنجاح في قاعدة البيانات بشكل دائم');
    } catch (err: any) {
      showNotice('error', err.message || 'خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // Publish Draft to Public Visitors
  const handlePublish = async () => {
    if (!draft) return;
    setPublishing(true);
    try {
      // First save draft
      await fetch('/api/invitation/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ draft })
      });

      // Then publish
      const res = await fetch('/api/invitation/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل نشر التعديلات');
      setPublished(data.published);
      showNotice('success', 'تهانينا! تم نشر التعديلات بنجاح وأصبحت ظاهرة لجميع الزوار');
    } catch (err: any) {
      showNotice('error', err.message || 'خطأ أثناء النشر');
    } finally {
      setPublishing(false);
    }
  };

  // Discard Draft changes
  const handleDiscard = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء التعديلات غير المنشورة واستعادة النسخة المنشورة حالياً؟')) {
      return;
    }
    try {
      const res = await fetch('/api/invitation/discard', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(data.draft);
      showNotice('success', 'تم التراجع عن التعديلات واستعادة النسخة المنشورة');
    } catch (err: any) {
      showNotice('error', err.message || 'تعذر التراجع');
    }
  };

  // Validate direct media URL
  const handleValidateUrl = async (url: string, type: 'image' | 'video' | 'audio') => {
    if (!url.trim()) return;
    setTestResult({ loading: true });
    try {
      const res = await fetch('/api/media/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), type })
      });
      const data = await res.json();
      setTestResult({
        loading: false,
        valid: data.valid,
        message: data.message
      });
    } catch {
      setTestResult({
        loading: false,
        valid: false,
        message: 'فشل فحص الرابط'
      });
    }
  };

  // Audio preview toggle
  const toggleAudioPreview = () => {
    if (!draft?.musicUrl) return;
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(draft.musicUrl);
      audioPreviewRef.current.volume = draft.musicVolume || 0.75;
      audioPreviewRef.current.loop = draft.musicAutoLoop ?? true;
    }

    if (audioPreviewPlaying) {
      audioPreviewRef.current.pause();
      setAudioPreviewPlaying(false);
    } else {
      audioPreviewRef.current.src = draft.musicUrl;
      audioPreviewRef.current.volume = draft.musicVolume || 0.75;
      audioPreviewRef.current.play()
        .then(() => setAudioPreviewPlaying(true))
        .catch(() => showNotice('error', 'تعذر تشغيل هذا الرابط الصوتي'));
    }
  };

  // Update nested draft fields helper
  const updateField = <K extends keyof InvitationData>(key: K, value: InvitationData[K]) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  };

  // RSVP actions
  const handleDeleteRsvp = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الرد؟')) return;
    try {
      const res = await fetch(`/api/rsvp/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showNotice('success', 'تم حذف الرد بنجاح');
        fetchRsvps();
      }
    } catch {
      showNotice('error', 'تعذر حذف الرد');
    }
  };

  const handleToggleChatVisibility = async (id: string) => {
    try {
      const res = await fetch(`/api/rsvp/${id}/toggle-visibility`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showNotice('success', 'تم تحديث حالة ظهور الرسالة في شات الموقع');
        fetchRsvps();
      }
    } catch {
      showNotice('error', 'تعذر تحديث ظهور الرسالة');
    }
  };

  // Admin credentials update
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      showNotice('error', 'كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }
    try {
      const res = await fetch('/api/auth/change-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newUsername,
          newPassword: newPassword || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showNotice('success', 'تم تحديث بيانات المسؤول بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showNotice('error', err.message || 'تعذر تحديث البيانات');
    }
  };

  // Restore backup
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const payload = JSON.parse(evt.target?.result as string);
        const res = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showNotice('success', 'تمت استعادة النسخة الاحتياطية بنجاح!');
        fetchData();
        fetchRsvps();
      } catch (err: any) {
        showNotice('error', err.message || 'الملف المرفق غير صالح');
      }
    };
    reader.readAsText(file);
  };

  if (loading || !draft) {
    return (
      <div className="fixed inset-0 z-50 bg-[#17120f] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-[#c89d5c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#fbf7f0] font-heading text-lg">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // Filtered RSVPs
  const filteredRsvps = rsvps.filter((r) => {
    const matchesSearch =
      r.guestName.toLowerCase().includes(rsvpSearch.toLowerCase()) ||
      (r.phone && r.phone.includes(rsvpSearch)) ||
      (r.message && r.message.toLowerCase().includes(rsvpSearch.toLowerCase()));
    if (!matchesSearch) return false;
    if (rsvpFilter === 'attending') return r.status === 'attending';
    if (rsvpFilter === 'apologizing') return r.status === 'apologizing';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#17120f] text-[#f7f2ea] flex flex-col overflow-hidden">
      {/* Top Header & Actions Bar */}
      <header className="h-16 bg-[#231b17] border-b border-[#4a382e] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1c1512] hover:bg-[#2c221d] text-[#c89d5c] border border-[#4a382e] transition-colors cursor-pointer"
            title="الرجوع إلى الموقع"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-heading font-bold text-[#fbf7f0] leading-tight">
              لوحة تحكم دعوة الزفاف
            </h1>
            <p className="text-[10px] sm:text-xs text-[#8c7b70]">
              متصلة بقاعدة البيانات الدائمة · حفظ فوري ومستمر
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPreviewLive}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1512] hover:bg-[#2c221d] text-[#d8cfc4] text-xs border border-[#4a382e] transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#c89d5c]" />
            <span>معاينة الموقع</span>
          </button>

          <button
            onClick={handleDiscard}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1512] hover:bg-red-950/40 text-red-300 text-xs border border-red-900/50 transition-colors cursor-pointer"
            title="إلغاء التعديلات غير المنشورة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تراجع</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3d2e24] hover:bg-[#4a382e] text-[#fbf7f0] text-xs font-semibold border border-[#c89d5c]/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-[#c89d5c]" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ المسودة'}</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] text-xs font-bold transition-all shadow-md hover:shadow-[#c89d5c]/30 cursor-pointer disabled:opacity-50"
          >
            <Globe className="w-3.5 h-3.5 text-[#140e0b]" />
            <span>{publishing ? 'جاري النشر...' : 'نشر التعديلات للعامة'}</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-[#1c1512] hover:bg-red-950/40 text-[#8c7b70] hover:text-red-300 border border-[#4a382e] transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`px-4 py-2.5 text-xs text-center flex items-center justify-center gap-2 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-b border-emerald-800 text-emerald-200'
              : 'bg-red-950 border-b border-red-800 text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Body: Sidebar + Tab Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-64 bg-[#1f1713] border-l border-[#4a382e] flex flex-col overflow-y-auto shrink-0">
          <div className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'overview'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>نظرة عامة والتحكم السريع</span>
            </button>

            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'general'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>العروسان والافتتاحية</span>
            </button>

            <button
              onClick={() => setActiveTab('message')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'message'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>رسالة الدعوة والخطاب</span>
            </button>

            <button
              onClick={() => setActiveTab('venue')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'venue'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>مكان الحفل والخرائط</span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'photos'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>معرض الصور بالروابط المباشرة</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'videos'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <VideoIcon className="w-4 h-4" />
              <span>معرض وفيديو الحفل</span>
            </button>

            <button
              onClick={() => setActiveTab('music')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'music'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>الموسيقى الخلفية والصوت</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'timeline'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>جدول المواعيد والبرنامج</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'custom'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>الأقسام المخصصة الإضافية</span>
            </button>

            <button
              onClick={() => setActiveTab('sections')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'sections'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <MoveUp className="w-4 h-4" />
              <span>ترتيب وظهور الأقسام</span>
            </button>

            <button
              onClick={() => setActiveTab('design')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'design'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>تخصيص الألوان والخطوط</span>
            </button>

            <button
              onClick={() => setActiveTab('rsvp')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'rsvp'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>إدارة تأكيد الحضور (RSVP)</span>
              </div>
              {rsvps.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#17120f] text-[#c89d5c] font-mono">
                  {rsvps.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                activeTab === 'security'
                  ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                  : 'text-[#d8cfc4] hover:bg-[#281f1a]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>الأمان والنسخ الاحتياطي</span>
            </button>
          </div>
        </aside>

        {/* Tab Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#17120f]">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-4">
                  <h2 className="text-xl font-heading font-bold text-[#fbf7f0]">
                    حالة موقع الدعوة وقاعدة البيانات
                  </h2>
                  <p className="text-xs sm:text-sm text-[#b09e90] leading-relaxed">
                    جميع التعديلات التي تجريها في هذه اللوحة تُحفظ كمسودة في قاعدة البيانات الدائمة. لن تظهر التعديلات للضيوف إلا عند النقر على «نشر التعديلات للعامة».
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#3d2c23]">
                    <div className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23]">
                      <span className="text-xs text-[#8c7b70] block">العريس والعروس</span>
                      <span className="text-sm font-semibold text-[#fbf7f0] mt-1 block">
                        {draft.groomName} & {draft.brideName}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23]">
                      <span className="text-xs text-[#8c7b70] block">إجمالي ردود الحضور</span>
                      <span className="text-xl font-bold font-mono text-[#c89d5c] mt-1 block">
                        {rsvpStats.totalResponses} رد
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23]">
                      <span className="text-xs text-[#8c7b70] block">إجمالي الحاضرين المؤكدين</span>
                      <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                        {rsvpStats.attendingTotalPersons} فرد
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Link Validator Card */}
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-4">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-[#c89d5c]" />
                    <h3 className="text-base font-heading font-bold text-[#fbf7f0]">
                      أداة فحص الروابط المباشرة للوسائط (صور، فيديو، صوت)
                    </h3>
                  </div>
                  <p className="text-xs text-[#b09e90]">
                    تحقق من صلاحية أي رابط خارجي قبل إضافته للدعوة، للتأكد من أنه رابط ملف مباشر يمكن للمتصفح عرضه دون حظر أو مشاكل مشاركة.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={testType}
                      onChange={(e) => setTestType(e.target.value as any)}
                      className="px-3 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                    >
                      <option value="image">صورة (JPG, PNG, WebP)</option>
                      <option value="video">فيديو (MP4)</option>
                      <option value="audio">صوت (MP3, OGG)</option>
                    </select>

                    <input
                      type="url"
                      dir="ltr"
                      value={testUrl}
                      onChange={(e) => setTestUrl(e.target.value)}
                      placeholder="https://example.com/file.jpg"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                    />

                    <button
                      type="button"
                      onClick={() => handleValidateUrl(testUrl, testType)}
                      disabled={testResult?.loading || !testUrl}
                      className="px-5 py-2.5 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {testResult?.loading ? 'جاري الفحص...' : 'فحص الرابط'}
                    </button>
                  </div>

                  {testResult && !testResult.loading && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        testResult.valid
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                          : 'bg-red-950/60 border-red-800 text-red-200'
                      }`}
                    >
                      {testResult.valid ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: GENERAL SETTINGS */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <h3 className="text-lg font-heading font-bold text-[#fbf7f0] border-b border-[#3d2c23] pb-3">
                    بيانات العروسين والشاشة الافتتاحية
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">اسم العريس الكريم *</label>
                      <input
                        type="text"
                        value={draft.groomName}
                        onChange={(e) => updateField('groomName', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-sm text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">اسم العروس الكريمة *</label>
                      <input
                        type="text"
                        value={draft.brideName}
                        onChange={(e) => updateField('brideName', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-sm text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">نبذة عن العريس (اختياري)</label>
                      <textarea
                        rows={2}
                        value={draft.groomBio || ''}
                        onChange={(e) => updateField('groomBio', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c] resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">نبذة عن العروس (اختياري)</label>
                      <textarea
                        rows={2}
                        value={draft.brideBio || ''}
                        onChange={(e) => updateField('brideBio', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c] resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">رابط صورة العريس المباشر</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={draft.groomImage}
                        onChange={(e) => updateField('groomImage', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                      {draft.groomImage && (
                        <div className="mt-2 w-20 h-24 rounded-lg overflow-hidden border border-[#4a382e]">
                          <img src={draft.groomImage} alt="العريس" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">رابط صورة العروس المباشر</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={draft.brideImage}
                        onChange={(e) => updateField('brideImage', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                      {draft.brideImage && (
                        <div className="mt-2 w-20 h-24 rounded-lg overflow-hidden border border-[#4a382e]">
                          <img src={draft.brideImage} alt="العروس" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Opening Screen Details */}
                  <div className="pt-4 border-t border-[#3d2c23] space-y-4">
                    <h4 className="text-sm font-heading font-semibold text-[#c89d5c]">
                      تخصيص الشاشة الافتتاحية (شاشة الدخول)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#d8cfc4]">العنوان الافتتاحي</label>
                        <input
                          type="text"
                          value={draft.openingHeadline}
                          onChange={(e) => updateField('openingHeadline', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#d8cfc4]">نص زر فتح الدعوة</label>
                        <input
                          type="text"
                          value={draft.openingButtonText}
                          onChange={(e) => updateField('openingButtonText', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">العبارة الترحيبية / الآية الكريمة</label>
                      <textarea
                        rows={2}
                        value={draft.openingSubheadline}
                        onChange={(e) => updateField('openingSubheadline', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#d8cfc4]">رابط صورة خلفية الشاشة الافتتاحية</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={draft.openingBgImage}
                          onChange={(e) => updateField('openingBgImage', e.target.value)}
                          className="w-full px-4 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#d8cfc4]">رابط فيديو الخلفية (MP4 اختياري)</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={draft.openingBgVideo || ''}
                          onChange={(e) => updateField('openingBgVideo', e.target.value)}
                          placeholder="https://.../video.mp4"
                          className="w-full px-4 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MESSAGE & CONTENT */}
            {activeTab === 'message' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <h3 className="text-lg font-heading font-bold text-[#fbf7f0] border-b border-[#3d2c23] pb-3">
                    صياغة رسالة الدعوة والخطاب الرسمي
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">اسم العائلتين / المستضيفين</label>
                    <input
                      type="text"
                      value={draft.familyNamesText || ''}
                      onChange={(e) => updateField('familyNamesText', e.target.value)}
                      placeholder="تتشرف عائلة فلان وعائلة فلان بدعوتكم..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-sm text-[#fbf7f0] focus:border-[#c89d5c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">عنوان قسم الدعوة</label>
                    <input
                      type="text"
                      value={draft.invitationTitle}
                      onChange={(e) => updateField('invitationTitle', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-sm text-[#fbf7f0] focus:border-[#c89d5c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">الآية القرآنية أو البيت الشعري (اختياري)</label>
                    <input
                      type="text"
                      value={draft.invitationVerse || ''}
                      onChange={(e) => updateField('invitationVerse', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-sm text-[#fbf7f0] focus:border-[#c89d5c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">نص رسالة الدعوة بالكامل</label>
                    <textarea
                      rows={5}
                      value={draft.invitationMessage}
                      onChange={(e) => updateField('invitationMessage', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-sm text-[#fbf7f0] focus:border-[#c89d5c] leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#3d2c23]">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">محاذاة النص</label>
                      <select
                        value={draft.invitationTextAlign || 'center'}
                        onChange={(e) => updateField('invitationTextAlign', e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      >
                        <option value="center">توسيط (موصى به للأعراس)</option>
                        <option value="right">محاذاة لليمين</option>
                        <option value="justify">محاذاة كاملة (ضبط)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">نمط خلفية بطاقة الدعوة</label>
                      <select
                        value={draft.invitationBgStyle || 'gold-border'}
                        onChange={(e) => updateField('invitationBgStyle', e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      >
                        <option value="gold-border">إطار ذهبي فاخر مع زوايا مزخرفة</option>
                        <option value="chocolate">بني شوكولاتة داكن ودافئ</option>
                        <option value="dark">أسود ملكي داكن</option>
                        <option value="minimal">بسيط وناعم بدون خلفية متباينة</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: VENUE & DATES */}
            {activeTab === 'venue' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <h3 className="text-lg font-heading font-bold text-[#fbf7f0] border-b border-[#3d2c23] pb-3">
                    تاريخ الزفاف والعد التنازلي ومكان الحفل
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">تاريخ ووقت الحفل (ISO / التاريخ الميلادي) *</label>
                      <input
                        type="datetime-local"
                        value={draft.weddingDate.substring(0, 16)}
                        onChange={(e) => updateField('weddingDate', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">التاريخ الهجري (يظهر للضيوف)</label>
                      <input
                        type="text"
                        value={draft.weddingDateHijri || ''}
                        onChange={(e) => updateField('weddingDateHijri', e.target.value)}
                        placeholder="الجمعة 11 جمادى الأولى 1448 هـ"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">نص وقت بدء الحفل</label>
                      <input
                        type="text"
                        value={draft.eventStartTimeText}
                        onChange={(e) => updateField('eventStartTimeText', e.target.value)}
                        placeholder="الساعة 08:00 مساءً"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">المدينة</label>
                      <input
                        type="text"
                        value={draft.venueCity}
                        onChange={(e) => updateField('venueCity', e.target.value)}
                        placeholder="الرياض"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">اسم القاعة أو المكان</label>
                    <input
                      type="text"
                      value={draft.venueName}
                      onChange={(e) => updateField('venueName', e.target.value)}
                      placeholder="قصر الثريا للاحتفالات"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-sm text-[#fbf7f0] focus:border-[#c89d5c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">العنوان التفصيلي</label>
                    <input
                      type="text"
                      value={draft.venueAddress}
                      onChange={(e) => updateField('venueAddress', e.target.value)}
                      placeholder="طريق الملك فهد، حي الصحافة..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">رابط خرائط جوجل (Google Maps URL)</label>
                    <input
                      type="url"
                      dir="ltr"
                      value={draft.venueMapUrl}
                      onChange={(e) => updateField('venueMapUrl', e.target.value)}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">رابط صورة القاعة / المكان المباشر</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={draft.venueImage || ''}
                      onChange={(e) => updateField('venueImage', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                    />
                    {draft.venueImage && (
                      <div className="mt-2 w-48 aspect-video rounded-xl overflow-hidden border border-[#4a382e]">
                        <img src={draft.venueImage} alt="القاعة" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">وصف المكان أو ملاحظات الوصول (اختياري)</label>
                    <textarea
                      rows={2}
                      value={draft.venueDescription || ''}
                      onChange={(e) => updateField('venueDescription', e.target.value)}
                      placeholder="مدخل خاص، مواقف سيارات متوفرة..."
                      className="w-full px-4 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PHOTOS MANAGEMENT */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <div className="flex items-center justify-between border-b border-[#3d2c23] pb-3">
                    <div>
                      <h3 className="text-lg font-heading font-bold text-[#fbf7f0]">
                        إدارة صور المعرض بالروابط المباشرة
                      </h3>
                      <p className="text-xs text-[#8c7b70]">
                        أضف روابط مباشرة لصور (JPG, PNG, WebP) مع إمكانية الترتيب والحذف وتعديل الوصف
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newPhoto: PhotoItem = {
                          id: `photo-${Date.now()}`,
                          url: '',
                          caption: 'لحظة مميزة',
                          category: 'الذكريات',
                          order: (draft.photos?.length || 0) + 1
                        };
                        updateField('photos', [...(draft.photos || []), newPhoto]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة صورة جديدة</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {draft.photos?.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23] flex flex-col md:flex-row gap-4 items-start md:items-center"
                      >
                        {/* Photo Thumbnail */}
                        <div className="w-24 h-24 rounded-xl bg-[#120c09] border border-[#4a382e] overflow-hidden shrink-0 flex items-center justify-center">
                          {photo.url ? (
                            <img
                              src={photo.url}
                              alt={photo.caption}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23231b17"/><text x="50%" y="50%" fill="%23c89d5c" text-anchor="middle" dy=".3em">رابط تالف</text></svg>';
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-[#4a382e]" />
                          )}
                        </div>

                        {/* Photo Controls */}
                        <div className="flex-1 space-y-2 w-full">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              dir="ltr"
                              value={photo.url}
                              onChange={(e) => {
                                const updated = draft.photos.map(p =>
                                  p.id === photo.id ? { ...p, url: e.target.value } : p
                                );
                                updateField('photos', updated);
                              }}
                              placeholder="رابط الصورة المباشر: https://.../img.jpg"
                              className="px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                            />

                            <input
                              type="text"
                              value={photo.caption}
                              onChange={(e) => {
                                const updated = draft.photos.map(p =>
                                  p.id === photo.id ? { ...p, caption: e.target.value } : p
                                );
                                updateField('photos', updated);
                              }}
                              placeholder="وصف الصورة (اختياري)"
                              className="px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-[#8c7b70]">
                            <div className="flex items-center gap-2">
                              <span>ترتيب العرض:</span>
                              <input
                                type="number"
                                value={photo.order}
                                onChange={(e) => {
                                  const updated = draft.photos.map(p =>
                                    p.id === photo.id ? { ...p, order: parseInt(e.target.value) || 0 } : p
                                  );
                                  updateField('photos', updated);
                                }}
                                className="w-16 px-2 py-1 rounded bg-[#231b17] border border-[#4a382e] text-center font-mono text-xs text-[#e6c88b]"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = draft.photos.filter(p => p.id !== photo.id);
                                updateField('photos', updated);
                              }}
                              className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="حذف الصورة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!draft.photos || draft.photos.length === 0) && (
                      <div className="p-8 text-center text-xs text-[#8c7b70] border border-dashed border-[#4a382e] rounded-2xl">
                        لم تتم إضافة أي صور بعد. انقر على «إضافة صورة جديدة» لإضافة الصور بروابطها المباشرة.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: VIDEOS MANAGEMENT */}
            {activeTab === 'videos' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <div className="flex items-center justify-between border-b border-[#3d2c23] pb-3">
                    <div>
                      <h3 className="text-lg font-heading font-bold text-[#fbf7f0]">
                        إدارة الفيديوهات بالروابط المباشرة
                      </h3>
                      <p className="text-xs text-[#8c7b70]">
                        ادعم روابط ملفات MP4 المباشرة لعرضها بسلاسة داخل المشغل
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newVideo: VideoItem = {
                          id: `video-${Date.now()}`,
                          url: '',
                          title: 'فيديو مميز',
                          description: 'توثيق الحفل',
                          type: 'gallery',
                          order: (draft.videos?.length || 0) + 1
                        };
                        updateField('videos', [...(draft.videos || []), newVideo]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة فيديو جديد</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {draft.videos?.map((vid) => (
                      <div
                        key={vid.id}
                        className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23] space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] text-[#8c7b70]">عنوان الفيديو</label>
                            <input
                              type="text"
                              value={vid.title}
                              onChange={(e) => {
                                const updated = draft.videos.map(v =>
                                  v.id === vid.id ? { ...v, title: e.target.value } : v
                                );
                                updateField('videos', updated);
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] text-[#8c7b70]">نوع الظهور</label>
                            <select
                              value={vid.type}
                              onChange={(e) => {
                                const updated = draft.videos.map(v =>
                                  v.id === vid.id ? { ...v, type: e.target.value as any } : v
                                );
                                updateField('videos', updated);
                              }}
                              className="w-full px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                            >
                              <option value="main">فيديو رئيسي مميز أعلى قسم الفيديو</option>
                              <option value="gallery">فيديو داخل شبكة المعرض</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-[#8c7b70]">رابط ملف الفيديو المباشر (MP4)</label>
                          <input
                            type="url"
                            dir="ltr"
                            value={vid.url}
                            onChange={(e) => {
                              const updated = draft.videos.map(v =>
                                v.id === vid.id ? { ...v, url: e.target.value } : v
                              );
                              updateField('videos', updated);
                            }}
                            placeholder="https://.../video.mp4"
                            className="w-full px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-[#8c7b70]">وصف الفيديو (اختياري)</label>
                          <input
                            type="text"
                            value={vid.description || ''}
                            onChange={(e) => {
                              const updated = draft.videos.map(v =>
                                v.id === vid.id ? { ...v, description: e.target.value } : v
                              );
                              updateField('videos', updated);
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#2a1c15]">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draft.videos.filter(v => v.id !== vid.id);
                              updateField('videos', updated);
                            }}
                            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف الفيديو</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MUSIC MANAGEMENT */}
            {activeTab === 'music' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <h3 className="text-lg font-heading font-bold text-[#fbf7f0] border-b border-[#3d2c23] pb-3">
                    إدارة الموسيقى الخلفية والنظام الصوتي
                  </h3>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23]">
                    <div>
                      <span className="text-sm font-semibold text-[#fbf7f0] block">
                        تفعيل الموسيقى في الموقع
                      </span>
                      <span className="text-xs text-[#8c7b70]">
                        تشغيل الموسيقى الخلفية عند فتح الزائر للدعوة
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.musicEnabled}
                        onChange={(e) => updateField('musicEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#3d2c23] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-[#fbf7f0] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c89d5c]"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">
                      رابط ملف الموسيقى المباشر (MP3 أو OGG) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        dir="ltr"
                        value={draft.musicUrl}
                        onChange={(e) => updateField('musicUrl', e.target.value)}
                        placeholder="https://.../music.mp3"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                      <button
                        type="button"
                        onClick={toggleAudioPreview}
                        className="px-4 py-2.5 rounded-xl bg-[#3d2e24] hover:bg-[#4a382e] text-[#c89d5c] border border-[#c89d5c]/50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        {audioPreviewPlaying ? (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>إيقاف المعاينة</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>معاينة الصوت</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">مستوى الصوت الافتراضي</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={draft.musicVolume || 0.75}
                          onChange={(e) => updateField('musicVolume', parseFloat(e.target.value))}
                          className="flex-1 accent-[#c89d5c]"
                        />
                        <span className="font-mono text-xs text-[#c89d5c]">
                          {Math.round((draft.musicVolume || 0.75) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">تكرار الموسيقى تلقائياً (Loop)</label>
                      <select
                        value={draft.musicAutoLoop ? 'true' : 'false'}
                        onChange={(e) => updateField('musicAutoLoop', e.target.value === 'true')}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      >
                        <option value="true">نعم، تكرار تلقائي مستمر</option>
                        <option value="false">لا، التوقف بعد انتهاء المقطع</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#d8cfc4]">شكل أيقونة الموسيقى العائمة للزوار</label>
                    <select
                      value={draft.musicIconStyle || 'disc'}
                      onChange={(e) => updateField('musicIconStyle', e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                    >
                      <option value="disc">قرص موسيقي دوار (أنيميشن فاخر)</option>
                      <option value="wave">موجات صوتية نابضة</option>
                      <option value="notes">مكبر صوت كلاسيكي</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: TIMELINE MANAGEMENT */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <div className="flex items-center justify-between border-b border-[#3d2c23] pb-3">
                    <div>
                      <h3 className="text-lg font-heading font-bold text-[#fbf7f0]">
                        برنامج ومواعيد فقرات الحفل
                      </h3>
                      <p className="text-xs text-[#8c7b70]">
                        حدد مواعيد الاستقبال، الزفة، العشاء، وتوديع الضيوف
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newEvent: TimelineEvent = {
                          id: `tl-${Date.now()}`,
                          time: '09:00 م',
                          title: 'فقرة جديدة',
                          description: 'تفاصيل الفقرة',
                          order: (draft.timeline?.length || 0) + 1
                        };
                        updateField('timeline', [...(draft.timeline || []), newEvent]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة فقرة جديدة</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {draft.timeline?.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23] flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                      >
                        <input
                          type="text"
                          value={evt.time}
                          onChange={(e) => {
                            const updated = draft.timeline.map(t =>
                              t.id === evt.id ? { ...t, time: e.target.value } : t
                            );
                            updateField('timeline', updated);
                          }}
                          placeholder="08:00 م"
                          className="w-24 px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#c89d5c] font-semibold text-center"
                        />

                        <input
                          type="text"
                          value={evt.title}
                          onChange={(e) => {
                            const updated = draft.timeline.map(t =>
                              t.id === evt.id ? { ...t, title: e.target.value } : t
                            );
                            updateField('timeline', updated);
                          }}
                          placeholder="عنوان الفقرة"
                          className="flex-1 px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#fbf7f0]"
                        />

                        <input
                          type="text"
                          value={evt.description}
                          onChange={(e) => {
                            const updated = draft.timeline.map(t =>
                              t.id === evt.id ? { ...t, description: e.target.value } : t
                            );
                            updateField('timeline', updated);
                          }}
                          placeholder="تفاصيل مختصرة"
                          className="flex-1 px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#d8cfc4]"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const updated = draft.timeline.filter(t => t.id !== evt.id);
                            updateField('timeline', updated);
                          }}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CUSTOM SECTIONS */}
            {activeTab === 'custom' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <div className="flex items-center justify-between border-b border-[#3d2c23] pb-3">
                    <div>
                      <h3 className="text-lg font-heading font-bold text-[#fbf7f0]">
                        الأقسام المخصصة الإضافية
                      </h3>
                      <p className="text-xs text-[#8c7b70]">
                        أضف أي قسم مخصص تريده (تعليمات الضيوف، إرشادات التصوير، كلمة شكر، إلخ)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newSec: CustomSectionItem = {
                          id: `custom-${Date.now()}`,
                          title: 'قسم جديد',
                          subtitle: 'عنوان فرعي',
                          content: 'اكتب محتوى القسم هنا...',
                          order: (draft.customSections?.length || 0) + 1,
                          isVisible: true
                        };
                        updateField('customSections', [...(draft.customSections || []), newSec]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة قسم جديد</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {draft.customSections?.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-5 rounded-2xl bg-[#1c1512] border border-[#3d2c23] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => {
                              const updated = draft.customSections.map(s =>
                                s.id === sec.id ? { ...s, title: e.target.value } : s
                              );
                              updateField('customSections', updated);
                            }}
                            placeholder="عنوان القسم"
                            className="font-heading font-bold text-base text-[#fbf7f0] bg-transparent border-b border-[#4a382e] pb-1 focus:border-[#c89d5c] outline-none"
                          />

                          <div className="flex items-center gap-3">
                            <label className="text-xs text-[#8c7b70] flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={sec.isVisible}
                                onChange={(e) => {
                                  const updated = draft.customSections.map(s =>
                                    s.id === sec.id ? { ...s, visibility: e.target.checked, isVisible: e.target.checked } : s
                                  );
                                  updateField('customSections', updated);
                                }}
                                className="accent-[#c89d5c]"
                              />
                              <span>إظهار القسم</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = draft.customSections.filter(s => s.id !== sec.id);
                                updateField('customSections', updated);
                              }}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={sec.subtitle || ''}
                          onChange={(e) => {
                            const updated = draft.customSections.map(s =>
                              s.id === sec.id ? { ...s, subtitle: e.target.value } : s
                            );
                            updateField('customSections', updated);
                          }}
                          placeholder="العنوان الفرعي"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#c89d5c]"
                        />

                        <textarea
                          rows={3}
                          value={sec.content}
                          onChange={(e) => {
                            const updated = draft.customSections.map(s =>
                              s.id === sec.id ? { ...s, content: e.target.value } : s
                            );
                            updateField('customSections', updated);
                          }}
                          placeholder="محتوى القسم..."
                          className="w-full px-3 py-2 rounded-lg bg-[#231b17] border border-[#4a382e] text-xs text-[#d8cfc4]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SECTIONS ORDER & VISIBILITY */}
            {activeTab === 'sections' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <h3 className="text-lg font-heading font-bold text-[#fbf7f0] border-b border-[#3d2c23] pb-3">
                    ترتيب أقسام الصفحة الرئيسية وإخفاؤها
                  </h3>
                  <p className="text-xs text-[#8c7b70]">
                    يمكنك تغيير ترتيب أي قسم لأعلى أو لأسفل وإظهار أو إخفاء أي قسم بمرونة كاملة
                  </p>

                  <div className="space-y-2">
                    {draft.sectionsOrder?.map((secKey, idx) => {
                      const isHidden = draft.hiddenSections?.includes(secKey);
                      const getSecName = (k: string) => {
                        switch (k) {
                          case 'hero': return 'البانر الرئيسي والمقدمة';
                          case 'couple': return 'قسم العريس والعروس';
                          case 'invitation': return 'رسالة الدعوة والخطاب';
                          case 'countdown': return 'العد التنازلي لموعد الزفاف';
                          case 'venue': return 'مكان الحفل والخريطة';
                          case 'timeline': return 'جدول مواعيد الحفل';
                          case 'photos': return 'معرض الصور';
                          case 'videos': return 'معرض الفيديوهات';
                          case 'custom': return 'الأقسام المخصصة';
                          case 'rsvp': return 'تأكيد الحضور (RSVP)';
                          default: return k;
                        }
                      };

                      const moveUp = () => {
                        if (idx === 0) return;
                        const arr = [...draft.sectionsOrder];
                        const temp = arr[idx - 1];
                        arr[idx - 1] = arr[idx];
                        arr[idx] = temp;
                        updateField('sectionsOrder', arr);
                      };

                      const moveDown = () => {
                        if (idx === draft.sectionsOrder.length - 1) return;
                        const arr = [...draft.sectionsOrder];
                        const temp = arr[idx + 1];
                        arr[idx + 1] = arr[idx];
                        arr[idx] = temp;
                        updateField('sectionsOrder', arr);
                      };

                      const toggleHide = () => {
                        const hidden = draft.hiddenSections || [];
                        const updated = isHidden
                          ? hidden.filter(h => h !== secKey)
                          : [...hidden, secKey];
                        updateField('hiddenSections', updated);
                      };

                      return (
                        <div
                          key={secKey}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#1c1512] border border-[#3d2c23]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#231b17] border border-[#4a382e] text-[#c89d5c] text-xs font-mono flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className={`text-xs font-medium ${isHidden ? 'line-through text-[#6e5d52]' : 'text-[#fbf7f0]'}`}>
                              {getSecName(secKey)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={toggleHide}
                              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                                isHidden
                                  ? 'bg-[#2a1c15] text-[#8c7b70] hover:text-[#fbf7f0]'
                                  : 'bg-[#c89d5c]/20 text-[#c89d5c]'
                              }`}
                            >
                              {isHidden ? 'مخفي (انقر للإظهار)' : 'ظاهر'}
                            </button>

                            <button
                              type="button"
                              onClick={moveUp}
                              disabled={idx === 0}
                              className="p-1 rounded bg-[#231b17] text-[#c89d5c] hover:bg-[#3d2c23] disabled:opacity-30 cursor-pointer"
                              title="تحريك لأعلى"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={moveDown}
                              disabled={idx === draft.sectionsOrder.length - 1}
                              className="p-1 rounded bg-[#231b17] text-[#c89d5c] hover:bg-[#3d2c23] disabled:opacity-30 cursor-pointer"
                              title="تحريك لأسفل"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DESIGN & CUSTOMIZATION */}
            {activeTab === 'design' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <h3 className="text-lg font-heading font-bold text-[#fbf7f0] border-b border-[#3d2c23] pb-3">
                    تخصيص الألوان والخطوط الفاخرة
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">الخط العربي الرئيسي</label>
                      <select
                        value={draft.fontFamily || 'amiri'}
                        onChange={(e) => updateField('fontFamily', e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      >
                        <option value="amiri">خط أميري (أصالة كلاسيكية فاخرة)</option>
                        <option value="aref-ruqaa">خط عارف رقعة (طابع خطي فني بديع)</option>
                        <option value="alexandria">خط الإسكندرية (عصري وواضح جداً)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">اللون الذهبي الرئيسي</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={draft.primaryColor || '#c89d5c'}
                          onChange={(e) => updateField('primaryColor', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={draft.primaryColor || '#c89d5c'}
                          onChange={(e) => updateField('primaryColor', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs font-mono text-[#fbf7f0]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">لون الخلفية الداكن</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={draft.bgColor || '#17120f'}
                          onChange={(e) => updateField('bgColor', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={draft.bgColor || '#17120f'}
                          onChange={(e) => updateField('bgColor', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs font-mono text-[#fbf7f0]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">لون البطاقات والأسطح</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={draft.cardBgColor || '#231b17'}
                          onChange={(e) => updateField('cardBgColor', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={draft.cardBgColor || '#231b17'}
                          onChange={(e) => updateField('cardBgColor', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs font-mono text-[#fbf7f0]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RSVP MANAGEMENT */}
            {activeTab === 'rsvp' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#3d2c23] pb-4">
                    <div>
                      <h3 className="text-lg font-heading font-bold text-[#fbf7f0]">
                        إدارة تأكيدات حضور الضيوف (RSVP)
                      </h3>
                      <p className="text-xs text-[#8c7b70]">
                        سجل ردود المدعوين، بحث فوري، إحصائيات دقيقة، وتصدير إلى ملف Excel / CSV
                      </p>
                    </div>

                    <a
                      href="/api/rsvp/export-csv"
                      download="wedding_rsvps.csv"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#140e0b]" />
                      <span>تصدير إلى ملف CSV (إكسل)</span>
                    </a>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23] text-center">
                      <span className="text-[11px] text-[#8c7b70] block">إجمالي الردود</span>
                      <span className="text-2xl font-bold font-mono text-[#fbf7f0] mt-1 block">
                        {rsvpStats.totalResponses}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23] text-center">
                      <span className="text-[11px] text-[#8c7b70] block">إجمالي الحاضرين بالأفراد</span>
                      <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                        {rsvpStats.attendingTotalPersons}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23] text-center">
                      <span className="text-[11px] text-[#8c7b70] block">المؤكدون للحضور</span>
                      <span className="text-2xl font-bold font-mono text-[#c89d5c] mt-1 block">
                        {rsvpStats.attendingResponses}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#1c1512] border border-[#3d2c23] text-center">
                      <span className="text-[11px] text-[#8c7b70] block">المعتذرون</span>
                      <span className="text-2xl font-bold font-mono text-[#8c7b70] mt-1 block">
                        {rsvpStats.apologizingCount}
                      </span>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={rsvpSearch}
                        onChange={(e) => setRsvpSearch(e.target.value)}
                        placeholder="ابحث باسم الضيف أو رقم الهاتف أو محتوى الرسالة..."
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                      <Search className="w-4 h-4 text-[#8c7b70] absolute right-3 top-3" />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRsvpFilter('all')}
                        className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                          rsvpFilter === 'all'
                            ? 'bg-[#c89d5c] text-[#140e0b] font-semibold'
                            : 'bg-[#1c1512] text-[#d8cfc4] border border-[#4a382e]'
                        }`}
                      >
                        الكل ({rsvps.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setRsvpFilter('attending')}
                        className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                          rsvpFilter === 'attending'
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'bg-[#1c1512] text-[#d8cfc4] border border-[#4a382e]'
                        }`}
                      >
                        حاضر ({rsvpStats.attendingResponses})
                      </button>

                      <button
                        type="button"
                        onClick={() => setRsvpFilter('apologizing')}
                        className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                          rsvpFilter === 'apologizing'
                            ? 'bg-[#4a382e] text-[#fbf7f0] font-semibold'
                            : 'bg-[#1c1512] text-[#d8cfc4] border border-[#4a382e]'
                        }`}
                      >
                        معتذر ({rsvpStats.apologizingCount})
                      </button>
                    </div>
                  </div>

                  {/* Responses Table */}
                  <div className="overflow-x-auto rounded-2xl border border-[#3d2c23] bg-[#1c1512]">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#241a15] text-[#8c7b70] border-b border-[#3d2c23]">
                        <tr>
                          <th className="p-3">اسم الضيف</th>
                          <th className="p-3">الحالة</th>
                          <th className="p-3">المرافقون</th>
                          <th className="p-3">رقم الهاتف</th>
                          <th className="p-3">الرسالة</th>
                          <th className="p-3">ظهور بالشات</th>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a1c15]">
                        {filteredRsvps.map((r) => (
                          <tr key={r.id} className="hover:bg-[#231b17]">
                            <td className="p-3 font-medium text-[#fbf7f0] whitespace-nowrap">
                              {r.guestName}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {r.status === 'attending' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                  <Check className="w-3 h-3" />
                                  <span>حاضر بإذن الله</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-stone-900 text-stone-400 border border-stone-800">
                                  <span>معتذر</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[#e6c88b] tabular-nums whitespace-nowrap">
                              {r.status === 'attending' ? (r.companionCount || 0) : '-'}
                            </td>
                            <td className="p-3 font-mono text-[#b09e90] whitespace-nowrap" dir="ltr">
                              {r.phone || '-'}
                            </td>
                            <td className="p-3 text-[#d8cfc4] max-w-xs truncate">
                              {r.message || '-'}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {r.message ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleChatVisibility(r.id)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                                    r.isVisibleInChat !== false
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                                      : 'bg-red-950 text-red-300 border border-red-800 hover:bg-red-900'
                                  }`}
                                  title="انقر لتغيير حالة ظهور الرسالة في شات الموقع"
                                >
                                  {r.isVisibleInChat !== false ? 'ظاهر بالشات' : 'مخفي'}
                                </button>
                              ) : (
                                <span className="text-[#6e5d52] text-[10px]">-</span>
                              )}
                            </td>
                            <td className="p-3 text-[#8c7b70] whitespace-nowrap">
                              {new Date(r.createdAt).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteRsvp(r.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 cursor-pointer"
                                title="حذف الرد"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {filteredRsvps.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-[#8c7b70]">
                              لا توجد ردود مطابقة للبحث
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SECURITY & BACKUP */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Admin Credentials */}
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <h3 className="text-lg font-heading font-bold text-[#fbf7f0] border-b border-[#3d2c23] pb-3">
                    تغيير بيانات دخول المسؤول
                  </h3>

                  <form onSubmit={handleUpdateCredentials} className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">اسم المستخدم الجديد</label>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">كلمة المرور الحالية (للتحقق) *</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#d8cfc4]">كلمة المرور الجديدة (اختياري)</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="اتركها فارغة إذا أردت الاحتفاظ بكلمة المرور الحالية"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                      />
                    </div>

                    {newPassword && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#d8cfc4]">تأكيد كلمة المرور الجديدة</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="أعد إدخال كلمة المرور"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#1c1512] border border-[#4a382e] text-xs text-[#fbf7f0] focus:border-[#c89d5c]"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      تحديث بيانات المسؤول
                    </button>
                  </form>
                </div>

                {/* Database Backup & Restore */}
                <div className="p-6 rounded-3xl bg-[#231b17] border border-[#4a382e] space-y-6">
                  <h3 className="text-lg font-heading font-bold text-[#fbf7f0] border-b border-[#3d2c23] pb-3">
                    النسخ الاحتياطي واستعادة البيانات
                  </h3>
                  <p className="text-xs text-[#b09e90] leading-relaxed">
                    يمكنك تصدير نسخة احتياطية كاملة من جميع إعدادات الدعوة والصور والفيديوهات والموسيقى وردود الحضور بصيغة JSON، أو استعادة نسخة سابقة في أي وقت.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href="/api/backup/export"
                      download={`wedding_backup_${Date.now()}.json`}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#3d2e24] hover:bg-[#4a382e] border border-[#c89d5c]/50 text-[#e6c88b] text-xs font-bold transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-[#c89d5c]" />
                      <span>تحميل نسخة احتياطية كاملة (JSON)</span>
                    </a>

                    <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1c1512] hover:bg-[#231b17] border border-[#4a382e] text-[#d8cfc4] text-xs font-semibold transition-all cursor-pointer">
                      <Upload className="w-4 h-4 text-[#c89d5c]" />
                      <span>استعادة نسخة احتياطية من ملف</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestoreFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
