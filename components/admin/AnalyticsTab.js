'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toBn } from '../../lib/format';

const RANGES = [
  { key: 24, label: '২৪ ঘণ্টা', title: 'গত ২৪ ঘণ্টায় ভিজিট (৩ ঘণ্টা করে)' },
  { key: 168, label: '৭ দিন', title: 'গত ৭ দিনে প্রতিদিনের ভিজিট' },
  { key: 720, label: '৩০ দিন', title: 'গত ৩০ দিনে ভিজিট (৩ দিন করে)' },
];

const num = (n) => toBn(Number(n || 0).toLocaleString('en-US'));

function label(t, hours) {
  const d = new Date(t);
  if (hours <= 24) return toBn(d.getHours()) + 'টা';
  return toBn(d.getDate()) + '/' + toBn(d.getMonth() + 1);
}

function TopList({ title, items, color }) {
  const max = Math.max(1, ...items.map((i) => Number(i.n)));
  return (
    <div className="bg-white border border-ink/10 rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      {items.length === 0 && <p className="text-xs text-ink/40">এখনো তথ্য নেই</p>}
      <div className="space-y-3">
        {items.map((i) => (
          <div key={`${i.id || i.name}`}>
            <div className="flex justify-between gap-2 text-sm">
              <span className="truncate">{i.name}</span>
              <span className="font-bold font-numeric">{num(i.n)}</span>
            </div>
            <div className="h-1.5 bg-ink/10 rounded-full mt-1">
              <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.round((Number(i.n) / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// অ্যাডমিন: পুরো সাইটের ভিজিট ও ক্লিকের হিসাব
export default function AnalyticsTab() {
  const [hours, setHours] = useState(168);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setFailed(false);
    supabase.rpc('admin_analytics', { p_hours: hours }).then(({ data: d, error }) => {
      if (!alive) return;
      if (error) setFailed(true);
      else setData(d);
    });
    return () => {
      alive = false;
    };
  }, [hours]);

  const range = RANGES.find((r) => r.key === hours);
  const series = data?.series || [];
  const max = Math.max(1, ...series.map((s) => Number(s.visits)));
  const kpis = data
    ? [
        { label: 'মোট ভিজিট', value: data.visits, note: 'সব পেজ মিলিয়ে' },
        { label: 'আলাদা দর্শক', value: data.uniques, note: 'একই জনকে একবার গুনে' },
        { label: 'কল ক্লিক', value: data.calls, note: '' },
        { label: 'WhatsApp ক্লিক', value: data.whatsapps, note: '' },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">ওয়েবসাইট অ্যানালিটিক্স</h2>
          <p className="text-xs text-ink/50">বট ও অ্যাডমিন পেজ বাদে গোনা হয়</p>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-ink/5 p-1 rounded-xl min-w-[240px]">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setHours(r.key)}
              aria-pressed={hours === r.key}
              className={`py-2.5 rounded-lg text-sm font-medium ${hours === r.key ? 'bg-green text-white' : 'text-ink'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {failed && (
        <p className="text-sm bg-white border border-ink/10 rounded-xl p-4">
          হিসাব এখনো চালু হয়নি। Supabase-এ analytics.sql চালিয়েছেন কি না দেখুন।
        </p>
      )}
      {!failed && !data && <p className="text-sm text-ink/40 py-10 text-center">লোড হচ্ছে…</p>}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white border border-ink/10 rounded-xl p-4">
                <p className="text-xs text-ink/55">{k.label}</p>
                <p className="text-3xl font-bold font-numeric leading-tight mt-1">{num(k.value)}</p>
                {k.note && <p className="text-[11px] text-green mt-0.5">{k.note}</p>}
              </div>
            ))}
          </div>

          <div className="bg-white border border-ink/10 rounded-xl p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-3">
              <h3 className="font-semibold text-sm">{range.title}</h3>
              <div className="flex gap-3 text-xs text-ink/60">
                <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-green inline-block" />মোট ভিজিট</span>
                <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-marigold inline-block" />আলাদা দর্শক</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1.5 h-44" style={{ minWidth: series.length * 22 }}>
                {series.map((s) => (
                  <div key={s.t} className="flex-1 min-w-[16px] h-full flex items-end gap-0.5" title={`${num(s.visits)} ভিজিট · ${num(s.uniques)} দর্শক`}>
                    <div className="flex-1 bg-green rounded-t" style={{ height: `${Math.round((Number(s.visits) / max) * 100)}%` }} />
                    <div className="flex-1 bg-marigold rounded-t" style={{ height: `${Math.round((Number(s.uniques) / max) * 100)}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-1" style={{ minWidth: series.length * 22 }}>
                {series.map((s) => (
                  <div key={s.t} className="flex-1 min-w-[16px] text-center text-[10px] text-ink/50">{label(s.t, hours)}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            <TopList title="সবচেয়ে বেশি দেখা পোস্ট" items={data.top_listings || []} color="bg-green" />
            <TopList title="সবচেয়ে বেশি দেখা সেবাদাতা" items={data.top_providers || []} color="bg-green" />
            <TopList title="সবচেয়ে বেশি দেখা পেজ" items={data.top_pages || []} color="bg-marigold" />
          </div>
        </div>
      )}
    </div>
  );
}
