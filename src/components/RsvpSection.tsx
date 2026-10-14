import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, HeartHandshake, Send, Users, AlertCircle } from 'lucide-react';

interface RsvpSectionProps {
  enabled: boolean;
  deadlineText?: string;
  allowCompanions: boolean;
  maxCompanions: number;
  notes?: string;
  onSuccess?: () => void;
}

export const RsvpSection: React.FC<RsvpSectionProps> = ({
  enabled,
  deadlineText,
  allowCompanions,
  maxCompanions,
  notes,
  onSuccess
}) => {
  const [guestName, setGuestName] = useState('');
  const [status, setStatus] = useState<'attending' | 'apologizing'>('attending');
  const [companionCount, setCompanionCount] = useState(0);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!enabled) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!guestName.trim()) {
      setErrorMessage('يرجى كتابة اسم الضيف الكريم');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          status,
          companionCount: status === 'attending' && allowCompanions ? companionCount : 0,
          phone: phone.trim(),
          message: message.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء حفظ الرد');
      }

      setSubmitted(true);
      setResponseMessage(data.message);
      onSuccess?.();

      if (status === 'attending') {
        confetti({
          particleCount: 70,
          spread: 90,
          origin: { y: 0.7 },
          colors: ['#c89d5c', '#fbf7f0', '#d8ad6e']
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر إرسال الرد، يرجى التحقق من اتصالك بالإنترنت');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setGuestName('');
    setCompanionCount(0);
    setPhone('');
    setMessage('');
    setStatus('attending');
  };

  return (
    <section id="rsvp" className="py-20 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-12 space-y-3">
        <span className="text-[#c89d5c] text-xs uppercase tracking-widest font-serif">
          مشاركتنا الفرحة
        </span>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#fbf7f0]">
          تأكيد الحضور (RSVP)
        </h2>
        {deadlineText && (
          <p className="text-xs sm:text-sm text-[#c89d5c]">
            {deadlineText}
          </p>
        )}
        <div className="w-12 h-0.5 bg-[#c89d5c]/60 mx-auto mt-4" />
      </div>

      <div className="bg-[#231b17] border border-[#4a382e]/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#c89d5c]/20 border border-[#c89d5c] text-[#c89d5c] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-[#fbf7f0]">
              تم تسجيل ردكم الكريم بنجاح
            </h3>
            <p className="text-sm sm:text-base text-[#d8cfc4] leading-relaxed max-w-md mx-auto">
              {responseMessage}
            </p>
            <button
              onClick={resetForm}
              className="mt-6 text-xs text-[#c89d5c] hover:underline cursor-pointer"
            >
              تسجيل رد آخر
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {notes && (
              <p className="text-xs sm:text-sm text-[#b09e90] text-center leading-relaxed">
                {notes}
              </p>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Attendance Status Radios */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#d8cfc4]">
                هل ستشرفنا بالحضور؟ *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('attending')}
                  className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    status === 'attending'
                      ? 'bg-[#c89d5c] text-[#140e0b] border-[#c89d5c] font-semibold shadow-lg'
                      : 'bg-[#1c1512] text-[#d8cfc4] border-[#4a382e] hover:border-[#c89d5c]/50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>أتشرف بالحضور</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('apologizing')}
                  className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    status === 'apologizing'
                      ? 'bg-[#4a382e] text-[#fbf7f0] border-[#c89d5c]/70 font-semibold'
                      : 'bg-[#1c1512] text-[#d8cfc4] border-[#4a382e] hover:border-[#c89d5c]/50'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>أعتذر بكل محبة</span>
                </button>
              </div>
            </div>

            {/* Guest Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#d8cfc4]">
                الاسم الكريم *
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="مثال: فهد السالم"
                className="w-full px-4 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] placeholder-[#6e5d52] focus:outline-none focus:border-[#c89d5c] text-sm transition-colors"
              />
            </div>

            {/* Number of companions (if attending and allowed) */}
            {status === 'attending' && allowCompanions && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#d8cfc4]">
                  عدد المرافقين بصحبتك (غير الضيف الرئيسي)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0}
                      max={maxCompanions}
                      value={companionCount}
                      onChange={(e) => setCompanionCount(Math.max(0, Math.min(maxCompanions, parseInt(e.target.value) || 0)))}
                      className="w-full px-4 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] focus:outline-none focus:border-[#c89d5c] text-sm tabular-nums"
                    />
                  </div>
                  <span className="text-xs text-[#8c7b70] shrink-0">
                    (الحد الأقصى: {maxCompanions})
                  </span>
                </div>
              </div>
            )}

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#d8cfc4]">
                رقم الجوال (اختياري)
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 50 000 0000"
                className="w-full px-4 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] placeholder-[#6e5d52] focus:outline-none focus:border-[#c89d5c] text-sm text-right"
              />
            </div>

            {/* Message / Greetings */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#d8cfc4]">
                كلمة أو تهنئة للعروسين (اختياري)
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="أجمل التمنيات والتهاني للعروسين..."
                className="w-full px-4 py-3 rounded-xl bg-[#1c1512] border border-[#4a382e] text-[#fbf7f0] placeholder-[#6e5d52] focus:outline-none focus:border-[#c89d5c] text-sm transition-colors resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[#c89d5c] hover:bg-[#d8ad6e] text-[#140e0b] font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-[#c89d5c]/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#140e0b]" />
                  <span>تأكيد وإرسال الرد</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
