'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { timeAgo } from '../../../lib/format';
import SiteHeader from '../../../components/SiteHeader';
import BottomNav from '../../../components/BottomNav';
import PageSkeleton from '../../../components/PageSkeleton';

export default function MessagesPage() {
  const [me, setMe] = useState(null);
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user || null;
      setMe(u);
      if (u) {
        const { data: rows } = await supabase
          .from('conversations')
          .select('id, kind, ref_title, owner_id, last_message, last_message_at, owner_unread, starter_unread')
          .or(`owner_id.eq.${u.id},starter_id.eq.${u.id}`)
          .order('last_message_at', { ascending: false });
        setConvs(rows || []);
      }
      setLoading(false);
    })();
  }, []);

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
            href="/login?next=%2Fdashboard%2Fmessages"
            className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg"
          >
            লগইন করুন
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader lang="bn" simple />
      <main className="max-w-2xl mx-auto px-4 py-5">
        <a href="/dashboard" className="text-sm text-ink/60 inline-block mb-3">← আমার অ্যাকাউন্ট</a>
        <h1 className="text-xl font-semibold mb-4">💬 আমার বার্তা</h1>

        {convs.length === 0 && (
          <div className="bg-white border border-dashed border-ink/20 rounded-xl p-6 text-center">
            <p className="text-3xl mb-1">💬</p>
            <p className="text-ink/50 text-sm">এখনো কোনো বার্তা নেই।</p>
          </div>
        )}

        <div className="space-y-2">
          {convs.map((c) => {
            const mine = c.owner_id === me.id;
            const unread = mine ? c.owner_unread : c.starter_unread;
            return (
              <a
                key={c.id}
                href={`/dashboard/messages/${c.id}`}
                className="block bg-white rounded-xl border border-ink/10 p-3 active:bg-paper"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm line-clamp-1">{c.ref_title}</p>
                  {unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink/40 mt-0.5">
                  {mine ? '📥 আপনার পোস্টে বার্তা' : '📤 আপনি বার্তা পাঠিয়েছেন'}
                  {' · '}
                {c.kind === 'provider' ? 'প্রোফাইল' : c.kind === 'blood' ? 'রক্তের অনুরোধ' : 'পোস্ট'}
                </p>
                <p className={`text-xs mt-1 line-clamp-1 ${unread > 0 ? 'text-ink font-medium' : 'text-ink/60'}`}>
                  {c.last_message}
                </p>
                <p className="text-[10px] text-ink/30 mt-1">{timeAgo(c.last_message_at, 'bn')}</p>
              </a>
            );
          })}
        </div>

        <BottomNav activeTab="account" />
        <div className="h-16" />
      </main>
    </>
  );
}
