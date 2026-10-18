'use client';
import { useEffect, useMemo, useState } from 'react';
import { PLACES, UPAZILAS, mapsSearchUrl } from '../lib/sherpurPlaces';
import { UPAZILA_SHAPES, MAP_WIDTH, MAP_HEIGHT, project } from '../lib/sherpurMap';
import { toBn } from '../lib/format';

const STORAGE_KEY = 'amar_sherpur_v1';
const VALID_IDS = new Set(PLACES.map((p) => p.id));
const num = (n) => toBn(n);

// ম্যাপে যেসব স্থানের অবস্থান নিশ্চিত, শুধু সেগুলোর মার্কার বসবে
const PINNED = PLACES.filter((p) => p.lat != null && p.lng != null).map((p) => ({
  ...p,
  ...project(p.lat, p.lng),
}));
const UNPINNED_COUNT = PLACES.length - PINNED.length;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((id) => VALID_IDS.has(id)) : [];
  } catch {
    return [];
  }
}

function saveSelected(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export default function AmarSherpur() {
  const [selected, setSelected] = useState([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setSelected(loadSaved());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveSelected(selected);
  }, [selected, ready]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const total = PLACES.length;
  const selCount = selected.length;
  const percent = total ? Math.round((selCount / total) * 100) : 0;

  const stats = useMemo(
    () =>
      UPAZILAS.map((u) => {
        const items = PLACES.filter((p) => p.upazila === u.id);
        const sel = items.filter((p) => selectedSet.has(p.id)).length;
        return { ...u, items, total: items.length, sel };
      }),
    [selectedSet]
  );

  const visibleStats = filter === 'all' ? stats : stats.filter((s) => s.id === filter);
  const visitedIds = new Set(stats.filter((s) => s.sel > 0).map((s) => s.id));

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function resetAll() {
    setSelected([]);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-green-dark to-green shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <a href="/" className="text-white text-sm font-medium">
            ← খুঁজি শেরপুর
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-5 pb-32">
        <section>
          <h1 className="text-2xl font-bold text-green-dark">আমার শেরপুর</h1>
          <p className="text-sm text-ink/60 mt-1">যেসব জায়গা ঘুরেছেন, ট্যাপ করে বেছে নিন।</p>

          <div className="flex items-end justify-between mt-4">
            <p className="font-numeric text-green-dark leading-none">
              <span className="text-5xl font-bold">{num(selCount)}</span>
              <span className="text-xl text-ink/40"> /{num(total)}</span>
            </p>
            <p className="text-sm text-ink/60 font-medium">{num(percent)}% শেরপুর ঘোরা হয়েছে</p>
          </div>

          <div className="h-2 rounded-full bg-ink/10 mt-3 overflow-hidden">
            <div className="h-full rounded-full bg-green transition-all" style={{ width: `${percent}%` }} />
          </div>
          {/* ধাপ ৩-এ কার্ড তৈরির বোতাম চালু হলে এই লাইনটি সরবে */}
          <p className="text-xs text-ink/40 mt-3">কার্ড তৈরির ধাপ পরে যোগ হবে।</p>
        </section>

        <section className="mt-5 bg-white rounded-2xl border border-ink/10 p-3">
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="w-full max-w-sm mx-auto block"
            role="img"
            aria-label={`শেরপুর জেলার মানচিত্র, ${num(visitedIds.size)}টি উপজেলায় ঘোরা হয়েছে`}
          >
            {UPAZILA_SHAPES.map((u) => (
              <path
                key={u.id}
                d={u.path}
                fill={visitedIds.has(u.id) ? '#1C8A4C' : '#E5DFD0'}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            ))}
            {UPAZILA_SHAPES.map((u) => (
              <text
                key={`l-${u.id}`}
                x={u.labelX}
                y={u.labelY}
                textAnchor="middle"
                fontSize="11"
                fill={visitedIds.has(u.id) ? '#CFEBDA' : '#77725F'}
                style={{ pointerEvents: 'none' }}
              >
                {u.name}
              </text>
            ))}
            {PINNED.filter((p) => !selectedSet.has(p.id)).map((p) => (
              <circle key={`g-${p.id}`} cx={p.x} cy={p.y} r="2.5" fill="#A8A394" opacity="0.7" />
            ))}
            {PINNED.filter((p) => selectedSet.has(p.id)).map((p) => (
              <circle
                key={`r-${p.id}`}
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#E5384F"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          <p className="text-[11px] text-ink/40 text-center mt-2">
            ম্যাপে মার্কার শুধু সেই স্থানগুলোর, যাদের অবস্থান নিশ্চিত।
            {UNPINNED_COUNT > 0 ? ` ${num(UNPINNED_COUNT)}টির অবস্থান এখনো যোগ হয়নি।` : ''}
          </p>
        </section>

        <section className="mt-5">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <button
              type="button"
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
              className={`flex-shrink-0 whitespace-nowrap text-sm font-medium px-4 py-2 rounded-full border ${
                filter === 'all' ? 'bg-green text-white border-green' : 'bg-white text-ink/70 border-ink/15'
              }`}
            >
              সব
            </button>
            {stats.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilter(s.id)}
                aria-pressed={filter === s.id}
                className={`flex-shrink-0 whitespace-nowrap text-sm font-medium px-4 py-2 rounded-full border ${
                  filter === s.id ? 'bg-green text-white border-green' : 'bg-white text-ink/70 border-ink/15'
                }`}
              >
                {s.name} <span className="font-numeric">{num(s.sel)}/{num(s.total)}</span>
              </button>
            ))}
          </div>

          {visibleStats.map((s) => (
            <div key={s.id} className="mt-4">
              <h2 className="text-sm font-semibold text-ink/70 mb-2">
                {s.name} <span className="font-numeric text-ink/40">{num(s.sel)}/{num(s.total)}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {s.items.map((p) => {
                  const checked = selectedSet.has(p.id);
                  const unpinned = p.lat == null || p.lng == null;
                  return (
                    <li key={p.id} className="flex items-center gap-2">
                      <label
                        className={`flex-1 min-w-0 flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer select-none focus-within:ring-2 focus-within:ring-green/40 ${
                          checked ? 'bg-green/10 border-green' : 'bg-white border-ink/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggle(p.id)}
                        />
                        <span
                          aria-hidden="true"
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-sm flex-shrink-0 ${
                            checked ? 'bg-green border-green text-white' : 'bg-white border-ink/25'
                          }`}
                        >
                          {checked ? '✓' : ''}
                        </span>
                        <span className="text-sm font-medium leading-snug min-w-0">{p.name}</span>
                      </label>
                      {unpinned && (
                        <a
                          href={mapsSearchUrl(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-[11px] text-green font-medium px-2 py-2"
                        >
                          📍 খুঁজুন
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        <p className="text-[10px] text-ink/40 text-center mt-8">মানচিত্র: geoBoundaries (CC BY 4.0)</p>
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink/10 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" aria-live="polite">
              {num(selCount)}টি নির্বাচিত
            </p>
            {selCount > 0 && (
              <button type="button" onClick={resetAll} className="text-xs text-ink/50 underline">
                সব বাতিল করুন
              </button>
            )}
          </div>
          <button
            type="button"
            disabled
            className="bg-green text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-40"
          >
            কার্ড তৈরি করুন
          </button>
        </div>
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
