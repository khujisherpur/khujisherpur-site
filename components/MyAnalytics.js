'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toBn } from '../lib/format';

const RANGES = [
  { key: 24, bn: '২৪ ঘণ্টা', en: '24 hours' },
  { key: 168, bn: '৭ দিন', en: '7 days' },
  { key: 720, bn: '৩০ দিন', en: '30 days' },
];

const TYPE_LABEL = {
  listing: { bn: 'পোস্ট', en: 'Post' },
  provider: { bn: 'প্রোফাইল', en: 'Profile' },
};

// ইউজারের নিজের পোস্ট ও প্রোফাইলের ভিউ, কল ও WhatsApp ক্লিকের হিসাব
export default function MyAnalytics({ lang = 'bn' }) {
  const bn = lang === 'bn';
  const num = (n) => (bn ? toBn(Number(n).toLocaleString('en-US')) : Number(n).toLocaleString('en-US'));
  const [hours, setHours] = useState(168);
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setRows(null);
    setFailed(false);
    supabase.rpc('my_analytics', { p_hours: hours }).then(({ data, error }) => {
      if (!alive) return;
      if (error) setFailed(true);
      else setRows(data || []);
    });
    return () => {
      alive = false;
    };
  }, [hours]);

  const sum = (k) => (rows || []).reduce((s, r) => s + Number(r[k] || 0), 0);
  const max = Math.max(1, ...(rows || []).map((r) => Number(r.views)));
  const cards = [
    { label: bn ? 'মোট ভিউ' : 'Views', value: sum('views'), icon: '👁️', note: bn ? `আলাদা দর্শক ${num(sum('uniques'))}` : `${num(sum('uniques'))} unique` },
    { label: bn ? 'কল ক্লিক' : 'Call clicks', value: sum('calls'), icon: '📞' },
    { label: bn ? 'WhatsApp ক্লিক' : 'WhatsApp clicks', value: sum('whatsapps'), icon: '💬' },
  ];

  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold">{bn ? 'আমার পোস্টের পারফরম্যান্স' : 'My post performance'}</h2>
      <p className="text-xs text-ink/50 mb-3">
        {bn ? 'কত মানুষ দেখেছে, কল ও হোয়াটসঅ্যাপে চেপেছে' : 'Views, call and WhatsApp clicks'}
      </p>

      <div className="grid grid-cols-3 gap-1 bg-ink/5 p-1 rounded-xl mb-3">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setHours(r.key)}
            aria-pressed={hours === r.key}
            className={`py-2.5 rounded-lg text-sm font-medium ${hours === r.key ? 'bg-green text-white' : 'text-ink'}`}
          >
            {bn ? r.bn : r.en}
          </button>
        ))}
      </div>

      {failed && (
        <p className="text-sm text-ink/60 bg-white border border-ink/10 rounded-xl p-4">
          {bn ? 'হিসাব এখনো চালু হয়নি।' : 'Analytics is not available yet.'}
        </p>
      )}
      {!failed && rows === null && <p className="text-sm text-ink/40 py-6 text-center">…</p>}

      {!failed && rows && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {cards.map((c) => (
              <div key={c.label} className="bg-white border border-ink/10 rounded-xl p-3">
                <p className="text-[11px] text-ink/55">{c.icon} {c.label}</p>
                <p className="text-2xl font-bold font-numeric leading-tight mt-1">{num(c.value)}</p>
                {c.note && <p className="text-[10px] text-ink/45 mt-0.5">{c.note}</p>}
              </div>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-ink/50 mt-3 text-center">{bn ? 'এখনো কোনো পোস্ট নেই।' : 'No posts yet.'}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {rows.map((r) => (
                <div key={`${r.target_type}-${r.target_id}`} className="bg-white border border-ink/10 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug line-clamp-2">{r.title}</p>
                    <span className="text-[10px] bg-green/10 text-green px-2 py-0.5 rounded-full flex-shrink-0">
                      {TYPE_LABEL[r.target_type]?.[lang] || ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div><p className="text-[10px] text-ink/50">{bn ? 'ভিউ' : 'Views'}</p><p className="font-bold font-numeric">{num(r.views)}</p></div>
                    <div><p className="text-[10px] text-ink/50">{bn ? 'কল' : 'Calls'}</p><p className="font-bold font-numeric">{num(r.calls)}</p></div>
                    <div><p className="text-[10px] text-ink/50">WhatsApp</p><p className="font-bold font-numeric">{num(r.whatsapps)}</p></div>
                  </div>
                  <div className="h-1.5 bg-ink/10 rounded-full mt-2">
                    <div className="h-1.5 bg-marigold rounded-full" style={{ width: `${Math.round((Number(r.views) / max) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
