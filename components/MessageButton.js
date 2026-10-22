'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function friendly(err) {
  const msg = (err && err.message) || '';
  if (/[\u0980-\u09FF]/.test(msg)) return msg;
  return 'কিছু একটা সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন';
}

export default function MessageButton({ kind, refId, ownerId, lang = 'bn' }) {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setMe(data.session?.user || null);
      setReady(true);
    });
  }, []);

  if (!ready) return null;
  if (me && ownerId && me.id === ownerId) return null;

  function onClick() {
    if (!me) {
      window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
      return;
    }
    setOpen(true);
  }

  async function send() {
    if (!body.trim() || busy) return;
    setBusy(true);
    setError('');
    const { data, error: err } = await supabase.rpc('start_conversation', {
      p_kind: kind,
      p_ref_id: refId,
      p_body: body,
    });
    if (err) {
      setError(friendly(err));
      setBusy(false);
      return;
    }
    window.location.href = '/dashboard/messages/' + data;
  }

  return (
    <>
      <button
        onClick={onClick}
        className="w-full text-center font-semibold rounded-xl bg-green text-white py-3 text-sm"
      >
        💬 {lang === 'bn' ? 'বার্তা পাঠান' : 'Send message'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !busy && setOpen(false)} />
          <div className="relative bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-4 pb-6">
            <p className="font-semibold mb-1">💬 {lang === 'bn' ? 'বার্তা পাঠান' : 'Send message'}</p>
            <p className="text-xs text-ink/50 mb-3">
              {lang === 'bn'
                ? 'আপনার ফোন নম্বর ছাড়াই যোগাযোগ করতে পারবেন। উত্তর এলে আমার বার্তা পেজে দেখবেন।'
                : 'You can reach out without sharing your number. Replies appear in My Messages.'}
            </p>
            <textarea
              rows={4}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: ভাড়াটা কি আলোচনা সাপেক্ষে? কবে দেখতে আসতে পারি?' : 'Write your message…'}
              className="w-full border border-ink/20 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green resize-none"
            />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="border border-ink/20 rounded-xl py-2.5 text-sm"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={send}
                disabled={busy || !body.trim()}
                className="col-span-2 bg-green text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {busy ? '...' : lang === 'bn' ? 'পাঠান' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
