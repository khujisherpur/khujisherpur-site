'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PLACES, UPAZILAS, mapsSearchUrl } from '../lib/sherpurPlaces';
import { UPAZILA_SHAPES, MAP_WIDTH, MAP_HEIGHT, project } from '../lib/sherpurMap';
import { renderCard, prepareSquarePhoto, canvasToBlob, sanitizeName } from '../lib/cardRender';
import { toBn } from '../lib/format';

const STORAGE_KEY = 'amar_sherpur_v1';
const NAME_KEY = 'amar_sherpur_name';
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

function loadName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

function saveName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {}
}

export default function AmarSherpur() {
  const [selected, setSelected] = useState([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('all');

  // কার্ড তৈরির ধাপ: pick (স্থান বাছাই), form (নাম ও ছবি), result (কার্ড)
  const [step, setStep] = useState('pick');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoThumb, setPhotoThumb] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cardUrl, setCardUrl] = useState('');
  const [cardBlob, setCardBlob] = useState(null);
  const [canShare, setCanShare] = useState(false);
  const [inFacebook, setInFacebook] = useState(false);
  const fileRef = useRef(null);
  const urlRef = useRef('');

  useEffect(() => {
    setSelected(loadSaved());
    setName(loadName());
    setReady(true);
    try {
      const ua = navigator.userAgent || '';
      setInFacebook(/FBAN|FBAV|FB_IAB|Instagram/i.test(ua));
      if (navigator.canShare && typeof File !== 'undefined') {
        const probe = new File([''], 'a.png', { type: 'image/png' });
        setCanShare(navigator.canShare({ files: [probe] }));
      }
    } catch {}
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
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

  function goTo(next) {
    setError('');
    setStep(next);
    try {
      window.scrollTo(0, 0);
    } catch {}
  }

  async function onPickPhoto(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const canvas = await prepareSquarePhoto(file);
      setPhoto(canvas);
      setPhotoThumb(canvas.toDataURL('image/jpeg', 0.7));
    } catch (err) {
      setError(
        err && err.message === 'not-image'
          ? 'এটি ছবি নয়, অন্য ফাইল বেছে নিন।'
          : 'এই ছবিটি পড়া যায়নি, অন্য একটি ছবি দিন।'
      );
    }
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoThumb('');
  }

  async function generate() {
    const clean = sanitizeName(name);
    if (!clean || busy) return;
    setBusy(true);
    setError('');
    try {
      const canvas = await renderCard({ name: clean, photo, selectedIds: selected });
      const blob = await canvasToBlob(canvas);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setCardUrl(url);
      setCardBlob(blob);
      saveName(clean);
      goTo('result');
    } catch {
      setError('কার্ড বানানো যায়নি, আবার চেষ্টা করুন।');
    }
    setBusy(false);
  }

  async function shareCard() {
    if (!cardBlob) return;
    try {
      const file = new File([cardBlob], 'amar-sherpur.png', { type: 'image/png' });
      await navigator.share({ files: [file], title: 'আমার শেরপুর' });
    } catch (err) {
      // ব্যবহারকারী নিজে বাতিল করলে কিছু বলার নেই
      if (err && err.name !== 'AbortError') setError('শেয়ার করা যায়নি, ছবি সংরক্ষণ করে শেয়ার করুন।');
    }
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

      {step === 'form' && (
        <main className="max-w-4xl mx-auto px-4 pt-5 pb-16">
          <button type="button" onClick={() => goTo('pick')} className="text-sm text-green font-medium">
            ← স্থান বদলান
          </button>
          <h1 className="text-2xl font-bold text-green-dark mt-3">আপনার কার্ড</h1>
          <p className="text-sm text-ink/60 mt-1">
            {num(selCount)}টি স্থান নিয়ে কার্ড তৈরি হবে। নাম ও ছবি শুধু আপনার ফোনেই থাকবে।
          </p>

          <label htmlFor="amar-name" className="block text-sm font-semibold mt-6">
            আপনার নাম
          </label>
          <input
            id="amar-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="name"
            placeholder="যেমন: আরিফ হোসেন"
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green/40"
          />

          <p className="text-sm font-semibold mt-6">আপনার ছবি (ঐচ্ছিক)</p>
          <div className="mt-2 flex items-center gap-3">
            {photoThumb ? (
              <img src={photoThumb} alt="নির্বাচিত ছবি" className="w-20 h-20 rounded-2xl object-cover border-2 border-green" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white border border-dashed border-ink/25 flex items-center justify-center text-2xl text-ink/25">
                👤
              </div>
            )}
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => fileRef.current && fileRef.current.click()}
                className="border border-green/40 text-green text-sm font-medium px-4 py-2 rounded-xl"
              >
                {photoThumb ? 'অন্য ছবি দিন' : 'ছবি যোগ করুন'}
              </button>
              {photoThumb && (
                <button type="button" onClick={removePhoto} className="text-xs text-ink/50 underline">
                  ছবি সরান
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={generate}
            disabled={!sanitizeName(name) || busy}
            className="mt-8 w-full bg-green text-white text-base font-semibold py-3.5 rounded-xl disabled:opacity-40"
          >
            {busy ? 'কার্ড বানানো হচ্ছে...' : 'কার্ড তৈরি করুন'}
          </button>
        </main>
      )}

      {step === 'result' && (
        <main className="max-w-4xl mx-auto px-4 pt-5 pb-16">
          <h1 className="text-xl font-bold text-green-dark">আপনার কার্ড তৈরি</h1>
          <img
            src={cardUrl}
            alt="আপনার আমার শেরপুর কার্ড"
            className="w-full max-w-md mx-auto mt-4 rounded-2xl border border-ink/10 shadow-sm"
          />

          <div className="max-w-md mx-auto mt-5 flex flex-col gap-3">
            {canShare && (
              <button
                type="button"
                onClick={shareCard}
                className="w-full bg-green text-white text-base font-semibold py-3.5 rounded-xl"
              >
                শেয়ার করুন
              </button>
            )}
            <a
              href={cardUrl}
              download="amar-sherpur.png"
              className={`w-full text-center text-base font-semibold py-3.5 rounded-xl ${
                canShare ? 'border border-green/40 text-green' : 'bg-green text-white'
              }`}
            >
              ছবি সংরক্ষণ করুন
            </a>
            <button type="button" onClick={() => goTo('form')} className="text-sm text-ink/60 underline py-2">
              নাম বা ছবি বদলান
            </button>
          </div>

          {error && (
            <p className="max-w-md mx-auto mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <p className="max-w-md mx-auto mt-3 text-xs text-ink/50 leading-relaxed">
            {inFacebook
              ? 'ফেসবুকের ভেতরের ব্রাউজারে সংরক্ষণ কাজ না করলে ছবিতে চেপে ধরে সংরক্ষণ করুন, অথবা মেনু থেকে "ব্রাউজারে খুলুন" বেছে নিন।'
              : 'সংরক্ষণ কাজ না করলে ছবিতে চেপে ধরে সংরক্ষণ করতে পারবেন।'}
          </p>
        </main>
      )}

      {step === 'pick' && (
        <>
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
                onClick={() => goTo('form')}
                disabled={selCount === 0}
                className="bg-green text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-40"
              >
                কার্ড তৈরি করুন
              </button>
            </div>
            <div className="pb-[env(safe-area-inset-bottom)]" />
          </div>
        </>
      )}
    </div>
  );
}
