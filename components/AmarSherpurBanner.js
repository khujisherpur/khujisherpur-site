import { UPAZILA_SHAPES, MAP_WIDTH, MAP_HEIGHT } from '../lib/sherpurMap';

// হোমপেজে "আমার শেরপুর" ফিচারের ছোট কার্ড। কোনো ডেটা-কোয়েরি নেই।
// ?ref=home দিয়ে পরে বোঝা যাবে কতজন হোমপেজ থেকে এসেছে।
export default function AmarSherpurBanner() {
  return (
    <section className="px-4 pt-4">
      <a
        href="/amar-sherpur?ref=home"
        className="flex items-center gap-4 bg-white rounded-2xl border border-ink/10 p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-16 h-auto flex-shrink-0"
          aria-hidden="true"
        >
          {UPAZILA_SHAPES.map((u) => (
            <path
              key={u.id}
              d={u.path}
              fill="#1C8A4C"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinejoin="round"
            />
          ))}
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-green-dark">আমার শেরপুর</span>
          <span className="block text-sm text-ink/60 mt-0.5 leading-snug">
            শেরপুরের কোন কোন জায়গা ঘুরেছেন? বেছে নিয়ে নিজের ভ্রমণ কার্ড বানান।
          </span>
        </span>
        <span className="text-green text-2xl flex-shrink-0" aria-hidden="true">
          ›
        </span>
      </a>
    </section>
  );
}
