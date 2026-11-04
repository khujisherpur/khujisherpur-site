'use client';
import { useEffect, useState } from 'react';
import { readyDate } from '../lib/donor';

export default function DonorReadyTag({ lastDonatedAt, lang = 'bn' }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const isBn = lang === 'bn';
  const num = (n) => (isBn ? Number(n).toLocaleString('bn-BD') : String(n));
  const fmt = (d) =>
    new Date(d).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const ready = readyDate(lastDonatedAt);
  const left = ready ? ready.getTime() - (now ?? Date.now()) : 0;

  if (!ready || left <= 0) {
    return (
      <span className="inline-block text-[10px] bg-green/10 text-green px-1.5 py-0.5 rounded-full mt-1">
        ● {isBn ? 'প্রস্তুত' : 'Ready'}
      </span>
    );
  }

  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);

  return (
    <span className="block mt-1">
      <span className="inline-block text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded-full">
        ⏳ {isBn ? 'বিশ্রামে' : 'Resting'}
        {now ? (isBn ? ` · আর ${num(d)} দিন ${num(h)} ঘণ্টা` : ` · ${d}d ${h}h left`) : ''}
      </span>
      <span className="block text-[10px] text-ink/50 mt-0.5">
        {isBn ? 'প্রস্তুত হবে' : 'Ready on'}: {fmt(ready)}
      </span>
    </span>
  );
}
