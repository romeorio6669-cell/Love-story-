import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, User, AlertCircle, ArrowLeft, ShieldCheck, UserPlus } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, admin: any) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check whether administrator account is configured or needs first-time setup
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const checkSetupStatus = async () => {
      setCheckingStatus(true);
      setError('');
      try {
        const res = await fetch('/api/auth/setup-status');
        const data = await res.json();
        if (isMounted) {
          setIsSetupMode(!data.isConfigured);
        }
      } catch {
        // Fallback to normal login
        if (isMounted) setIsSetupMode(false);
      } finally {
        if (isMounted) setCheckingStatus(false);
      }
    };

    checkSetupStatus();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSetupMode) {
      if (!username.trim() || username.trim().length < 3) {
        setError('يجب أن لا يقل اسم المستخدم عن 3 أحرف');
        return;
      }
      if (!password || password.length < 6) {
        setError('يجب أن لا تقل كلمة المرور عن 6 أحرف أو أرقام');
        return;
      }
      if (password !== confirmPassword) {
        setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'فشل إعداد حساب المسؤول');
        }

        localStorage.setItem('wedding_admin_token', data.token);
        onLoginSuccess(data.token, data.admin);
        onClose();
      } catch (err: any) {
        setError(err.message || 'خطأ في الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    } else {
      // Normal Login
      if (!username.trim() || !password) {
        setError('يرجى إدخال اسم المستخدم وكلمة المرور');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password
          })
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.needsSetup) {
            setIsSetupMode(true);
          }
          throw new Error(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        }

        localStorage.setItem('wedding_admin_token', data.token);
        onLoginSuccess(data.token, data.admin);
        onClose();
      } catch (err: any) {
        setError(err.message || 'خطأ في الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#140e0b]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#231b17] border border-[#c89d5c]/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-[#8c7b70] hover:text-[#fbf7f0] p-1.5 rounded-full hover:bg-[#2c221d] transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-[#c89d5c]/20 border border-[#c89d5c] text-[#c89d5c] flex items-center justify-center mx-auto mb-3">
            {isSetupMode ? <UserPlus className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-heading font-bold text-[#fbf7f0]">
            {isSetupMode ? 'إعداد حساب المسؤول لأول مرة' : 'تسجيل دخول المسؤول'}
          </h2>
          <p className="text-xs text-[#b09e90] leading-relaxed">
            {isSetupMode
              ? 'قم بإنشاء اسم المستخدم وكلمة المرور الخاصة بك لتأمين لوحة التحكم'
              : 'أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {checkingStatus ? (
          <div className="py-8 text-center text-xs text-[#8c7b70]">
            جاري التحقق من أمان النظام...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#d8cfc4]">
                اسم المستخدم
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اختر اسم المستخدم"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] placeholder-[#6e5d52] focus:outline-none focus:border-[#c89d5c] text-sm"
                />
                <User className="w-4 h-4 text-[#8c7b70] absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#d8cfc4]">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] placeholder-[#6e5d52] focus:outline-none focus:border-[#c89d5c] text-sm font-mono"
                />
                <KeyRound className="w-4 h-4 text-[#8c7b70] absolute right-3.5 top-3.5" />
              </div>
            </div>

            {isSetupMode && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#d8cfc4]">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] placeholder-[#6e5d52] focus:outline-none focus:border-[#c89d5c] text-sm font-mono"
                  />
                  <ShieldCheck className="w-4 h-4 text-[#8c7b70] absolute right-3.5 top-3.5" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#c89d5c]/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>جاري المعالجة...</span>
              ) : isSetupMode ? (
                <>
                  <span>إنشاء الحساب ودخول لوحة التحكم</span>
                  <ArrowLeft className="w-4 h-4 text-[#140e0b]" />
                </>
              ) : (
                <>
                  <span>دخول لوحة التحكم</span>
                  <ArrowLeft className="w-4 h-4 text-[#140e0b]" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
