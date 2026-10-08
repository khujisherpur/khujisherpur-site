'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ReportButton({ targetType, targetId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  function closeAll() {
    setOpen(false);
    setDone(false);
    setAlreadyReported(false);
    setNeedLogin(false);
    setError(null);
    setReason('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError('কারণ লিখুন');
      return;
    }
    setSubmitting(true);
    setError(null);
    setNeedLogin(false);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError('রিপোর্ট করতে হলে লগইন করা প্রয়োজন।');
      setNeedLogin(true);
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('reports').insert({
      target_type: targetType,
      target_id: targetId,
      reported_by: userData.user.id,
      reason: cleanReason,
    });

    if (error) {
      console.error('report error', error);
      const msg = error.message || '';
      if (error.code === '23505' || /duplicate key|unique/i.test(msg)) {
        setAlreadyReported(true);
      } else if (/[\u0980-\u09FF]/.test(msg)) {
        // ডাটাবেস ট্রিগারের নিজের বাংলা বার্তা (সাসপেন্ড, দৈনিক সীমা ইত্যাদি)
        setError(msg);
      } else if (/failed to fetch|network|load failed/i.test(msg)) {
        setError('ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন');
      } else {
        setError('রিপোর্ট পাঠানো যায়নি, একটু পরে আবার চেষ্টা করুন');
      }
    } else {
      setDone(true);
    }
    setSubmitting(false);
  }

  const loginHref =
    typeof window !== 'undefined'
      ? `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
      : '/login';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-ink/40 hover:text-red-500 underline"
      >
        ⚠ অনুপযুক্ত মনে হলে রিপোর্ট করুন
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-5 max-w-sm w-full">
            {done ? (
              <>
                <p className="text-sm font-medium mb-2">✅ রিপোর্ট জমা হয়েছে</p>
                <p className="text-xs text-ink/60 mb-4">
                  আমাদের টিম শীঘ্রই এটা পর্যালোচনা করবে। ধন্যবাদ।
                </p>
                <button
                  type="button"
                  onClick={closeAll}
                  className="w-full border border-ink/20 py-2 text-sm hover:bg-paper"
                >
                  বন্ধ করুন
                </button>
              </>
            ) : alreadyReported ? (
              <>
                <p className="text-sm font-medium mb-2">ℹ️ আপনি ইতিমধ্যে রিপোর্ট করেছেন</p>
                <p className="text-xs text-ink/60 mb-4">
                  এটা নিয়ে আপনার আগের রিপোর্ট আমাদের কাছে আছে। টিম পর্যালোচনা করবে, আবার পাঠানোর দরকার নেই।
                </p>
                <button
                  type="button"
                  onClick={closeAll}
                  className="w-full border border-ink/20 py-2 text-sm hover:bg-paper"
                >
                  বন্ধ করুন
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="text-sm font-medium mb-3">কেন রিপোর্ট করছেন?</p>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="যেমন: ভুয়া তথ্য, প্রতারণার চেষ্টা, ভুল ছবি ইত্যাদি"
                  className="w-full border border-ink/20 px-3 py-2 text-sm outline-none focus:border-green resize-none"
                />
                <p className="text-[11px] text-ink/40 text-right mt-1">{reason.length}/500</p>
                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                {needLogin && (
                  <a href={loginHref} className="inline-block text-xs text-green underline mt-1">
                    লগইন করুন
                  </a>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={closeAll}
                    className="flex-1 border border-ink/20 py-2 text-sm hover:bg-paper"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-500 text-white text-sm font-semibold py-2 hover:bg-red-600 disabled:opacity-50"
                  >
                    {submitting ? 'পাঠানো হচ্ছে...' : 'রিপোর্ট পাঠান'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
