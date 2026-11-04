'use client';
import { useEffect, useState } from 'react';
import { readyDate, fmtBnDate } from '../lib/donor';

const bn = (n) => Number(n).toLocaleString('bn-BD');

export default function DonorCountdown({ lastDonatedAt, onEdit }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ready = readyDate(lastDonatedAt);
  const left = ready && now ? ready.getTime() - now : 0;
  const resting = !!ready && left > 0;

  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);

  return (
    <section className="bg-white border border-red-100 rounded-2xl p-4 mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">🕐 রক্তদানের স্ট্যাটাস ও কাউন্টডাউন</p>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            resting ? 'bg-amber-100 text-amber-800' : 'bg-green/10 text-green'
          }`}
        >
          {resting ? 'অপেক্ষা' : 'প্রস্তুত'}
        </span>
      </div>

      {resting ? (
        <>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              [d, 'দিন'],
              [h, 'ঘণ্টা'],
              [m, 'মিনিট'],
              [s, 'সেকেন্ড'],
            ].map(([v, l]) => (
              <div key={l} className="bg-red-50 border border-red-100 rounded-xl py-3 text-center">
                <p className="text-xl font-bold text-red-600 font-numeric">{bn(v)}</p>
                <p className="text-[11px] text-ink/60">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-2">
            পরবর্তী রক্তদানের সম্ভাব্য তারিখ: {fmtBnDate(ready)}
          </p>
        </>
      ) : (
        <p className="mt-3 text-center text-sm font-semibold text-green bg-green/10 rounded-xl py-3">
          ✅ আপনি এখন রক্তদানে প্রস্তুত
        </p>
      )}

      {lastDonatedAt && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink/10 text-xs">
          <span className="text-ink/50">সর্বশেষ রক্তদান: {fmtBnDate(lastDonatedAt)}</span>
          <a href="#history" onClick={onEdit} className="text-red-600 font-semibold">
            তারিখ ভুল? আপডেট করুন
          </a>
        </div>
      )}
    </section>
  );
}
