'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

let meP = null;
function getMe() {
  if (!meP) {
    meP = supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (!data.user) return { user: null, donorId: null };
        const { data: d } = await supabase
          .from('blood_donors')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        return { user: data.user, donorId: d ? d.id : null };
      })
      .catch(() => ({ user: null, donorId: null }));
  }
  return meP;
}

export default function DonorMessageButton({ donorId, name, compact = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mine, setMine] = useState(false);

  async function openSheet() {
    const me = await getMe();
    if (!me.user) {
      const next = window.location.pathname + window.location.search;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }
    if (me.donorId === donorId) {
      setMine(true);
      return;
    }
    setError('');
    setOpen(true);
  }

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setError('');
    const { data, error: err } = await supabase.rpc('start_conversation', {
      p_kind: 'donor',
      p_ref_id: donorId,
      p_body: body,
    });
    setBusy(false);
    if (err) {
      const m = err.message || '';
     setError(/[\u0980-\u09FF]/.test(m) ? m : 'বার্তা পাঠানো যায়নি, আবার চেষ্টা করুন');
      return;
    }
    window.location.href = `/dashboard/messages/${data}`;
  }

  if (mine) return null;

  return (
    <>
      <button type="button" onClick={openSheet} aria-label="মেসেজ" className={className}>
        {compact ? '💬' : '💬 মেসেজ করুন'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={send}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4"
          >
            <p className="font-semibold text-sm">💬 {name ? `${name}-কে` : 'রক্তদাতাকে'} মেসেজ</p>
            <textarea
              required
              maxLength={1000}
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="কোন গ্রুপের রক্ত, কত ব্যাগ, কোথায় ও কখন লাগবে লিখুন"
              className="w-full mt-3 border border-ink/20 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50"
              >
                {busy ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="border border-ink/20 text-sm py-2.5 rounded-xl">
                বাতিল
              </button>
            </div>
            <p className="text-[11px] text-ink/50 mt-2">উত্তর এলে "আমার বার্তা"-তে দেখতে পাবেন।</p>
          </form>
        </div>
      )}
    </>
  );
}
