'use client';
export const runtime = 'edge';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { timeAgo } from '../../../../lib/format';
import SiteHeader from '../../../../components/SiteHeader';
import PageSkeleton from '../../../../components/PageSkeleton';

function friendly(err) {
  const msg = (err && err.message) || '';
  if (/[\u0980-\u09FF]/.test(msg)) return msg;
  if (/row-level security|permission denied/i.test(msg)) {
    return 'বার্তা পাঠানো যায়নি। অ্যাকাউন্ট সাসপেন্ড থাকলে বার্তা পাঠানো যায় না';
  }
  return 'কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন';
}

export default function ConversationPage({ params }) {
  const convId = params.id;
  const [me, setMe] = useState(null);
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const meRef = useRef(null);

  async function load(uid) {
    const { data: c } = await supabase
      .from('conversations')
      .select('id, kind, ref_id, ref_title, owner_id, starter_id, owner_unread, starter_unread, owner_last_read, starter_last_read')
      .eq('id', convId)
      .maybeSingle();
    if (!c) { setConv(null); return; }
    const { data: m } = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setConv(c);
    setMsgs(m || []);
    const unread = uid === c.owner_id ? c.owner_unread : uid === c.starter_id ? c.starter_unread : 0;
    if (unread > 0) supabase.rpc('mark_conversation_read', { p_id: convId });
  }

  useEffect(() => {
    let timer;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user || null;
      setMe(u);
      meRef.current = u;
      if (u) await load(u.id);
      setLoading(false);
      timer = setInterval(() => {
        if (document.visibilityState === 'visible' && meRef.current) load(meRef.current.id);
      }, 6000);
    })();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    const { error: err } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, sender_id: me.id, body });
    setSending(false);
    if (err) { setError(friendly(err)); return; }
    setText('');
    load(me.id);
  }

  if (loading) {
    return (
      <>
        <SiteHeader lang="bn" simple />
        <PageSkeleton />
      </>
    );
  }

  if (!me) {
    return (
      <>
        <SiteHeader lang="bn" simple />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70 mb-4">বার্তা দেখতে লগইন করুন।</p>
          <a
            href={`/login?next=${encodeURIComponent('/dashboard/messages/' + convId)}`}
            className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg"
          >
            লগইন করুন
          </a>
        </main>
      </>
    );
  }

  if (!conv) {
    return (
      <>
        <SiteHeader lang="bn" simple />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70">এই কথোপকথন খুঁজে পাওয়া যায়নি।</p>
          <a href="/dashboard/messages" className="text-green underline mt-2 inline-block">আমার বার্তায় ফিরুন</a>
        </main>
      </>
    );
  }

  const isParticipant = me.id === conv.owner_id || me.id === conv.starter_id;
  const postHref =
    conv.kind === 'provider' ? `/provider/${conv.ref_id}`
    : conv.kind === 'blood' ? `/blood/${conv.ref_id}`
    : `/listing/${conv.ref_id}`;
  const kindLabel =
    conv.kind === 'provider' ? 'প্রোফাইল' : conv.kind === 'blood' ? 'রক্তের অনুরোধ' : 'পোস্ট';

  // অপর পক্ষ কখন শেষবার পড়েছে, আর আমার শেষ বার্তা কোনটা
  const otherReadAt = me.id === conv.owner_id ? conv.starter_last_read : conv.owner_last_read;
  const lastMine = [...msgs].reverse().find((m) => m.sender_id === me.id);

  return (
    <>
      <SiteHeader lang="bn" simple />
      <main className="max-w-2xl mx-auto px-4 pt-4">
        <a href="/dashboard/messages" className="text-sm text-ink/60 inline-block mb-2">← আমার বার্তা</a>
        <a
          href={postHref}
          className="block bg-white border border-ink/10 rounded-xl px-3 py-2.5 mb-3"
        >
          <p className="text-[11px] text-ink/40">{kindLabel}</p>
          <p className="text-sm font-medium line-clamp-1">{conv.ref_title} ↗</p>
        </a>

        <div className="space-y-2 min-h-[40vh] pb-4">
          {msgs.map((m) => {
            const mine = m.sender_id === me.id;
            const seen = otherReadAt && new Date(otherReadAt) >= new Date(m.created_at);
            return (
              <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line break-words ${
                    mine ? 'bg-green text-white rounded-br-sm' : 'bg-white border border-ink/10 rounded-bl-sm'
                  }`}
                >
                  {m.body}
                  <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-ink/35'}`}>
                    {timeAgo(m.created_at, 'bn')}
                  </p>
                  {mine && lastMine && m.id === lastMine.id && (
                    <p className={`text-[10px] mt-0.5 ${seen ? 'text-white font-medium' : 'text-white/60'}`}>
                      {seen ? '✓✓ দেখা হয়েছে' : '✓ পাঠানো হয়েছে'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {isParticipant ? (
          <form onSubmit={send} className="sticky bottom-0 bg-paper pt-2 pb-4 border-t border-ink/10">
            {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="বার্তা লিখুন..."
                className="flex-1 border border-ink/20 rounded-full px-4 py-2.5 text-sm bg-white outline-none focus:border-green"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="bg-green text-white rounded-full px-5 text-sm font-semibold disabled:opacity-50"
              >
                পাঠান
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-ink/40 text-center py-4">আপনি এই কথোপকথনের অংশগ্রহণকারী নন।</p>
        )}
      </main>
    </>
  );
}
