'use client';
import { useEffect, useState } from 'react';
import { readyDate, fmtBnDate } from '../lib/donor';

const bn = (n) => Number(n).toLocaleString('bn-BD');

export default function DonorReadyTag({ lastDonatedAt }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const ready = readyDate(lastDonatedAt);
  const left = ready ? ready.getTime() - (now ?? Date.now()) : 0;

  if (!ready || left <= 0) {
    return (
      <span className="inline-block text-[10px] bg-green/10 text-green px-1.5 py-0.5 rounded-full mt-1">
        ● প্রস্তুত
      </span>
    );
  }

  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);

  return (
    <span className="block mt-1">
      <span className="inline-block text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded-full">
        ⏳ বিশ্রামে{now ? ` · আর ${bn(d)} দিন ${bn(h)} ঘণ্টা` : ''}
      </span>
      <span className="block text-[10px] text-ink/50 mt-0.5">প্রস্তুত হবে: {fmtBnDate(ready)}</span>
    </span>
  );
}
