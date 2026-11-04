import { BADGES } from '../lib/donor';

const STEPS = [
  { min: 1, name: 'নবীন রক্তদাতা', desc: '১ম বার রক্ত দিয়ে জীবন বাঁচানোর যাত্রা শুরু করেছেন' },
  { min: 3, name: 'নিয়মিত রক্তদাতা', desc: '৩+ বার রক্ত দিয়ে মানুষের পাশে থেকেছেন' },
  { min: 5, name: 'রক্তবীর', desc: '৫+ বার রক্ত দিয়ে মানবসেবার অনন্য দৃষ্টান্ত স্থাপন করেছেন' },
  { min: 10, name: 'জীবনরক্ষক', desc: '১০+ বার রক্তদানকারী, শেরপুরের রিয়েল হিরো' },
];

export default function DonorBadges({ count }) {
  const unlocked = STEPS.filter((s) => count >= s.min).length;
  return (
    <section className="bg-white border border-red-100 rounded-2xl p-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">🏅 আপনার অর্জিত ব্যাজসমূহ</p>
        <span className="text-xs font-bold text-red-600">{unlocked}/4 Unlocked</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        {STEPS.map((s) => {
          const on = count >= s.min;
          return (
            <div
              key={s.name}
              className={`rounded-xl p-3 border ${
                on ? 'bg-red-50 border-red-200' : 'bg-paper border-ink/10 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <p className={`text-sm font-bold ${on ? 'text-red-700' : 'text-ink/50'}`}>{s.name}</p>
                {on && <span className="text-green text-sm">✔</span>}
              </div>
              <p className={`text-[11px] mt-1 leading-snug ${on ? 'text-red-600' : 'text-ink/40'}`}>{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
