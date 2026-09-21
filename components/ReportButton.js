'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ReportButton({ targetType, targetId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError('রিপোর্ট করতে হলে লগইন করা প্রয়োজন।');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('reports').insert({
      target_type: targetType,
      target_id: targetId,
      reported_by: userData.user.id,
      reason,
    });

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
    setSubmitting(false);
  }

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
                  onClick={() => { setOpen(false); setDone(false); setReason(''); }}
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
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="যেমন: ভুয়া তথ্য, প্রতারণার চেষ্টা, ভুল ছবি ইত্যাদি"
                  className="w-full border border-ink/20 px-3 py-2 text-sm outline-none focus:border-green resize-none"
                />
                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
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
