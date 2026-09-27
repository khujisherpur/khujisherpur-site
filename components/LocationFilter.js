'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { locations, upazilaList } from '../lib/locations';

const text = {
  bn: {
    filter: 'এলাকা', title: 'এলাকা বাছাই করুন', upazila: 'উপজেলা', union: 'ইউনিয়ন',
    all: 'সব এলাকা', apply: 'প্রয়োগ করুন', clear: 'মুছে ফেলুন',
  },
  en: {
    filter: 'Area', title: 'Select Area', upazila: 'Upazila', union: 'Union',
    all: 'All areas', apply: 'Apply', clear: 'Clear',
  },
};

export default function LocationFilter({ lang, currentQuery, currentUpazila, currentUnion, onApply }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [upazila, setUpazila] = useState(currentUpazila || '');
  const [unionName, setUnionName] = useState(currentUnion || '');
  const t = text[lang] || text.bn;

  function buildUrl(u, un) {
    const params = new URLSearchParams();
    if (currentQuery) params.set('q', currentQuery);
    if (u) params.set('upazila', u);
    if (u && un) params.set('union', un);
    return `/search?${params.toString()}`;
  }

  function apply() {
    if (onApply) {
      onApply(upazila, unionName);
    } else {
      router.push(buildUrl(upazila, unionName));
    }
    setOpen(false);
  }

  function clear() {
    setUpazila('');
    setUnionName('');
    if (onApply) {
      onApply('', '');
    } else {
      router.push(buildUrl('', ''));
    }
    setOpen(false);
  }

  const hasFilter = !!currentUpazila;
  const unions = upazila ? locations[upazila] || [] : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 text-sm px-4 py-3 rounded-xl shadow-md flex-shrink-0 whitespace-nowrap max-w-[130px] transition-colors ${
          hasFilter ? 'bg-green text-white' : 'bg-white text-ink/70 hover:bg-paper'
        }`}
      >
        📍 <span className="truncate">{hasFilter ? (currentUnion || currentUpazila) : t.filter}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white w-full md:max-w-md md:rounded-xl rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t.title}</h3>
              <button onClick={() => setOpen(false)} className="text-ink/40 text-xl">✕</button>
            </div>

            <label className="block text-sm mb-1.5 text-ink/70">{t.upazila}</label>
            <select
              value={upazila}
              onChange={(e) => { setUpazila(e.target.value); setUnionName(''); }}
              className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green bg-white mb-4"
            >
              <option value="">{t.all}</option>
              {upazilaList.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>

            {upazila && (
              <>
                <label className="block text-sm mb-1.5 text-ink/70">{t.union}</label>
                <select
                  value={unionName}
                  onChange={(e) => setUnionName(e.target.value)}
                  className="w-full border border-ink/20 px-3 py-2.5 outline-none focus:border-green bg-white mb-4"
                >
                  <option value="">{t.all}</option>
                  {unions.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </>
            )}

            <div className="flex gap-2 mt-2">
              <button onClick={clear} className="flex-1 border border-ink/20 text-ink/60 py-2.5 text-sm">
                {t.clear}
              </button>
              <button onClick={apply} className="flex-1 bg-marigold text-ink font-semibold py-2.5 text-sm">
                {t.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
