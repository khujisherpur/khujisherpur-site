'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PLACES, UPAZILAS, mapsSearchUrl } from '../lib/sherpurPlaces';
import { renderCard, prepareSquarePhoto, canvasToBlob, sanitizeName, CARD_THEMES } from '../lib/cardRender';
import { toBn } from '../lib/format';
import { SITE_URL } from '../lib/site';

const STORAGE_KEY = 'amar_sherpur_v1';
const NAME_KEY = 'amar_sherpur_name';
const THEME_KEY = 'amar_sherpur_theme';
const UPAZILA_NAMES_KEY = 'amar_sherpur_upz';
const VALID_IDS = new Set(PLACES.map((p) => p.id));
const THEME_IDS = new Set(CARD_THEMES.map((t) => t.id));
const num = (n) => toBn(n);

function readStore(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function loadSelected() {
  try {
    const arr = JSON.parse(readStore(STORAGE_KEY) || '[]');
    return Array.isArray(arr) ? arr.filter((id) => VALID_IDS.has(id)) : [];
  } catch {
    return [];
  }
}

// হিরোর ছবি: গারো পাহাড়ের ঢেউ, রাবার গাছ আর বারদুয়ারী মসজিদের গম্বুজ (নিজস্ব নকশা)
function HeroArt() {
  return (
    <svg viewBox="0 0 380 150" className="w-full block mt-2" aria-hidden="true">
      <circle cx="300" cy="46" r="22" fill="#F6D98B" />
      <path d="M0 110 Q60 60 130 92 T260 84 T380 70 V150 H0Z" fill="#CFE8D6" />
      <path d="M0 126 Q70 84 150 112 T300 100 T380 108 V150 H0Z" fill="#8FC9A3" />
      <g fill="#E8B9A6" stroke="#fff" strokeWidth="1.5">
        <rect x="96" y="96" width="96" height="26" rx="2" />
        <path d="M102 96 a10 10 0 0 1 20 0Z M128 96 a10 10 0 0 1 20 0Z M154 96 a10 10 0 0 1 20 0Z" />
        <path d="M174 96 a8 8 0 0 1 16 0Z" />
      </g>
      <g fill="#fff">
        <rect x="108" y="106" width="6" height="16" rx="3" />
        <rect x="134" y="106" width="6" height="16" rx="3" />
        <rect x="160" y="106" width="6" height="16" rx="3" />
      </g>
      <path d="M0 140 Q80 112 170 130 T380 124 V150 H0Z" fill="#1C8A4C" />
      <g stroke="#0E5C33" strokeWidth="2">
        <path d="M232 124 v-14 M246 126 v-16 M260 124 v-14 M274 126 v-15" />
      </g>
      <g fill="#2E9C5E">
        <circle cx="232" cy="106" r="7" />
        <circle cx="246" cy="106" r="8" />
        <circle cx="260" cy="107" r="7" />
        <circle cx="274" cy="107" r="8" />
      </g>
    </svg>
  );
}

export default function AmarSherpur() {
  const [selected, setSelected] = useState([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState(['sadar']);

  const [name, setName] = useState('');
  const [theme, setTheme] = useState('sabuj');
  const [showUpazilaNames, setShowUpazilaNames] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [photoThumb, setPhotoThumb] = useState('');

  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBlob, setPreviewBlob] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [inFacebook, setInFacebook] = useState(false);

  const fileRef = useRef(null);
  const previewRef = useRef(null);
  const urlRef = useRef('');
  const requestRef = useRef(0);

  // শুরুতে সংরক্ষিত তথ্য ফেরত আনা
  useEffect(() => {
    setSelected(loadSelected());
    setName(readStore(NAME_KEY) || '');
    const savedTheme = readStore(THEME_KEY);
    if (savedTheme && THEME_IDS.has(savedTheme)) setTheme(savedTheme);
    if (readStore(UPAZILA_NAMES_KEY) === '0') setShowUpazilaNames(false);
    setReady(true);
    try {
      const ua = navigator.userAgent || '';
      setInFacebook(/FBAN|FBAV|FB_IAB|Instagram/i.test(ua));
      if (navigator.canShare && typeof File !== 'undefined') {
        setCanShare(navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] }));
      }
    } catch {}
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  useEffect(() => {
    if (ready) writeStore(STORAGE_KEY, JSON.stringify(selected));
  }, [selected, ready]);

  useEffect(() => {
    if (!ready) return;
    writeStore(NAME_KEY, name);
    writeStore(THEME_KEY, theme);
    writeStore(UPAZILA_NAMES_KEY, showUpazilaNames ? '1' : '0');
  }, [name, theme, showUpazilaNames, ready]);

  // প্রিভিউ চোখে পড়লে নিচের "কার্ড দেখুন" বার লুকাবে
  useEffect(() => {
    const el = previewRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setPreviewVisible(entry.isIntersecting), {
      threshold: 0.15,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // লাইভ প্রিভিউ: কিছু বদলালে একটু থেমে কার্ড আবার আঁকা হয়
  useEffect(() => {
    if (!ready) return undefined;
    const id = ++requestRef.current;
    if (selected.length === 0) {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = '';
      setPreviewUrl('');
      setPreviewBlob(null);
      setRendering(false);
      return undefined;
    }
    setRendering(true);
    const timer = setTimeout(async () => {
      try {
        const canvas = await renderCard({
          name: sanitizeName(name),
          photo,
          selectedIds: selected,
          theme,
          showUpazilaNames,
        });
        const blob = await canvasToBlob(canvas);
        if (id !== requestRef.current) return;
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setPreviewUrl(url);
        setPreviewBlob(blob);
        setRendering(false);
      } catch {
        if (id === requestRef.current) {
          setRendering(false);
          setError('কার্ড বানানো যায়নি, আবার চেষ্টা করুন।');
        }
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [ready, selected, name, theme, showUpazilaNames, photo]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const total = PLACES.length;
  const selCount = selected.length;
  const percent = total ? Math.round((selCount / total) * 100) : 0;
  const q = query.trim();

  const stats = useMemo(
    () =>
      UPAZILAS.map((u) => {
        const items = PLACES.filter((p) => p.upazila === u.id);
        const sel = items.filter((p) => selectedSet.has(p.id)).length;
        const shown = q ? items.filter((p) => p.name.includes(q) || p.short.includes(q)) : items;
        return { ...u, items, shown, total: items.length, sel };
      }),
    [selectedSet, q]
  );
  const visibleStats = stats.filter((s) => s.shown.length > 0);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleUpazila(upazilaId) {
    const ids = PLACES.filter((p) => p.upazila === upazilaId).map((p) => p.id);
    setSelected((prev) => {
      const all = ids.every((id) => prev.includes(id));
      return all ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]));
    });
  }

  function toggleOpen(id) {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function jumpTo(elementId) {
    try {
      const el = document.getElementById(elementId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // শেয়ারের সঙ্গে যাওয়া লেখা ও লিংক (?ref=card দিয়ে বোঝা যাবে কার্ড থেকে কতজন এল)
  function captionText() {
    return `আমি শেরপুরের ${num(total)}টির মধ্যে ${num(selCount)}টি স্থান ঘুরেছি। আপনি কতটা ঘুরেছেন?\n${SITE_URL}/amar-sherpur?ref=card`;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }

  function flashCopied(ok) {
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 8000);
    } else {
      setError('কপি করা যায়নি, নিচের লেখাটি চেপে ধরে কপি করুন।');
    }
  }

  async function copyCaption() {
    setError('');
    flashCopied(await copyText(captionText()));
  }

  async function shareCard() {
    if (!previewBlob) return;
    // ফেসবুক অ্যাপ ছবির সঙ্গে লেখা নেয় না, তাই শেয়ারের ট্যাপেই লিংকসহ লেখা কপি হয়ে যায়
    const copyPromise = copyText(captionText());
    try {
      const file = new File([previewBlob], 'amar-sherpur.png', { type: 'image/png' });
      await navigator.share({ files: [file], title: 'আমার শেরপুর', text: captionText() });
    } catch (err) {
      // ব্যবহারকারী নিজে বাতিল করলে কিছু বলার নেই
      if (err && err.name !== 'AbortError') setError('শেয়ার করা যায়নি, ছবি সংরক্ষণ করে শেয়ার করুন।');
    }
    flashCopied(await copyPromise);
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

      <main className="max-w-4xl mx-auto pb-28">
        {/* হিরো */}
        <section className="bg-gradient-to-b from-green/10 to-paper px-4 pt-6 text-center">
          <span className="inline-block bg-green/15 text-green-dark text-xs font-semibold px-3.5 py-1.5 rounded-full">
            {num(UPAZILAS.length)} উপজেলা · {num(total)} স্থান
          </span>
          <p className="text-xs tracking-widest text-ink/50 mt-4">খুঁজি শেরপুর</p>
          <h1 className="text-3xl font-bold text-green-dark leading-tight mt-1">
            নিজ শেরপুর জেলা
            <br />
            কতটুকু ঘুরেছেন?
          </h1>
          <p className="text-sm text-ink/60 mt-3 px-2">
            ঘোরা জায়গাগুলো বেছে নিন, বানিয়ে ফেলুন নিজের শেরপুর কার্ড।
          </p>
          <button
            type="button"
            onClick={() => jumpTo('select')}
            className="mt-4 bg-green text-white font-semibold text-base px-6 py-3 rounded-full shadow-sm"
          >
            জায়গা বাছাই শুরু করুন ↓
          </button>
          <ul className="flex flex-wrap justify-center gap-2 mt-4">
            {['জায়গা বাছুন', 'নাম ও রং', 'কার্ড শেয়ার'].map((label, i) => (
              <li key={label} className="bg-white border border-ink/10 rounded-full px-3 py-1.5 text-xs">
                <b className="text-green font-numeric">{num(i + 1)}</b> {label}
              </li>
            ))}
          </ul>
          <HeroArt />
        </section>

        {/* জায়গা বাছাই */}
        <section id="select" className="px-4 mt-4 scroll-mt-16">
          <div className="bg-white rounded-2xl border border-ink/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">যেসব জায়গায় গিয়েছি</h2>
              <span className="bg-green/10 text-green-dark font-bold text-sm px-3 py-1 rounded-full font-numeric">
                {num(selCount)} / {num(total)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-ink/10 mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-green transition-all" style={{ width: `${percent}%` }} />
            </div>

            <label htmlFor="amar-search" className="sr-only">
              জায়গা খুঁজুন
            </label>
            <input
              id="amar-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 জায়গা খুঁজুন…"
              className="mt-3 w-full rounded-xl border border-ink/15 bg-paper px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/40"
            />
            <div className="flex gap-4 mt-2 text-xs">
              <button type="button" onClick={() => setSelected(PLACES.map((p) => p.id))} className="text-green underline">
                সব বাছাই করুন
              </button>
              <button type="button" onClick={() => setSelected([])} className="text-ink/60 underline">
                সব মুছুন
              </button>
            </div>

            <div className="mt-3">
              {q && visibleStats.length === 0 && (
                <p className="text-sm text-ink/50 py-4 text-center">এই নামে কোনো জায়গা মিলছে না।</p>
              )}
              {visibleStats.map((s) => {
                const open = q ? true : openIds.includes(s.id);
                const complete = s.sel === s.total;
                const missing = s.shown.filter((p) => p.lat == null || p.lng == null);
                return (
                  <div key={s.id} className="border-t border-ink/10 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleOpen(s.id)}
                        aria-expanded={open}
                        className="flex-1 min-w-0 flex items-center gap-2 text-left font-bold"
                      >
                        <span aria-hidden="true" className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}>
                          ›
                        </span>
                        <span>{s.name}</span>
                        <span className="font-numeric text-ink/40 font-medium text-sm">
                          {num(s.sel)}/{num(s.total)}
                        </span>
                        {complete && (
                          <span className="text-[11px] font-semibold bg-marigold/25 text-ink px-2 py-0.5 rounded-full">
                            ✓ সম্পূর্ণ
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleUpazila(s.id)}
                        className="flex-shrink-0 text-xs text-green underline"
                      >
                        {complete ? 'সব মুছুন' : 'সব বাছাই'}
                      </button>
                    </div>
                    {open && (
                      <>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {s.shown.map((p) => {
                            const checked = selectedSet.has(p.id);
                            const unpinned = p.lat == null || p.lng == null;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => toggle(p.id)}
                                aria-pressed={checked}
                                title={p.name}
                                className={`text-sm font-medium px-3.5 py-2 rounded-full border transition-colors ${
                                  checked
                                    ? 'bg-green text-white border-green'
                                    : 'bg-green/10 text-green-dark border-green/20'
                                } ${unpinned ? 'border-dashed' : ''}`}
                              >
                                {p.short}
                              </button>
                            );
                          })}
                        </div>
                        {missing.length > 0 && (
                          <p className="text-xs text-ink/50 mt-2 leading-relaxed">
                            ছেঁড়া দাগের জায়গার অবস্থান ম্যাপে এখনো বসেনি:{' '}
                            {missing.map((p) => (
                              <a
                                key={p.id}
                                href={mapsSearchUrl(p)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green underline mr-2"
                              >
                                {p.short} ↗
                              </a>
                            ))}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* কার্ড সাজানো */}
        <section id="customize" className="px-4 mt-4 scroll-mt-16">
          <div className="bg-white rounded-2xl border border-ink/10 p-4">
            <h2 className="text-base font-bold">কার্ড সাজান</h2>

            <p className="text-xs font-semibold text-ink/60 mt-4">রং</p>
            <div className="flex gap-3 mt-2">
              {CARD_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  aria-pressed={theme === t.id}
                  aria-label={`রং: ${t.label}`}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={`relative block w-11 h-11 rounded-full border-2 ${
                      theme === t.id ? 'border-ink' : 'border-ink/15'
                    }`}
                    style={{ background: t.bg }}
                  >
                    <span
                      className="absolute right-1.5 bottom-1.5 block w-4 h-4"
                      style={{ background: t.accent, borderRadius: '50% 0 50% 50%' }}
                    />
                  </span>
                  <span className="text-[11px] text-ink/60">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              {photoThumb ? (
                <img
                  src={photoThumb}
                  alt="নির্বাচিত ছবি"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-green flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-paper border border-dashed border-ink/25 flex items-center justify-center text-2xl text-ink/25 flex-shrink-0">
                  👤
                </div>
              )}
              <div className="flex flex-col items-start gap-1.5">
                <button
                  type="button"
                  onClick={() => fileRef.current && fileRef.current.click()}
                  className="border border-green/40 text-green text-sm font-medium px-4 py-2 rounded-xl"
                >
                  {photoThumb ? 'অন্য ছবি দিন' : 'ছবি যোগ করুন (ঐচ্ছিক)'}
                </button>
                {photoThumb && (
                  <button type="button" onClick={removePhoto} className="text-xs text-ink/50 underline">
                    ছবি সরান
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
            </div>

            <label htmlFor="amar-name" className="block text-xs font-semibold text-ink/60 mt-4">
              আপনার নাম (ঐচ্ছিক)
            </label>
            <input
              id="amar-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoComplete="name"
              placeholder="যেমন: আরিফ হোসেন"
              className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-green/40"
            />

            <label className="flex items-center gap-2.5 mt-4 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showUpazilaNames}
                onChange={(e) => setShowUpazilaNames(e.target.checked)}
                className="w-5 h-5 accent-green"
              />
              উপজেলার নাম ম্যাপে দেখান
            </label>
            <p className="text-xs text-ink/40 mt-3">নাম ও ছবি শুধু আপনার ফোনেই থাকে, কোথাও জমা হয় না।</p>
          </div>
        </section>

        {/* লাইভ প্রিভিউ */}
        <section id="card-preview" ref={previewRef} className="px-4 mt-4 scroll-mt-16">
          <h2 className="text-sm font-semibold text-ink/60 mb-2">
            লাইভ প্রিভিউ <span className="font-normal">(বাছাই বদলালেই বদলায়)</span>
          </h2>

          {selCount === 0 ? (
            <div className="max-w-md mx-auto aspect-[4/5] rounded-2xl bg-white border border-dashed border-ink/20 flex items-center justify-center text-center text-sm text-ink/40 px-8">
              ওপর থেকে জায়গা বেছে নিলেই আপনার কার্ড এখানে তৈরি হবে।
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="আপনার আমার শেরপুর কার্ড"
              className={`w-full max-w-md mx-auto block rounded-2xl border border-ink/10 shadow-sm transition-opacity ${
                rendering ? 'opacity-60' : ''
              }`}
            />
          ) : (
            <div className="max-w-md mx-auto aspect-[4/5] rounded-2xl bg-white border border-ink/10 flex items-center justify-center text-sm text-ink/40">
              কার্ড তৈরি হচ্ছে...
            </div>
          )}

          {selCount > 0 && previewUrl && (
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
              <button
                type="button"
                onClick={copyCaption}
                className="w-full border border-green/40 text-green text-base font-semibold py-3.5 rounded-xl"
              >
                {copied ? 'লিংক কপি হয়েছে ✓' : 'লিংক কপি করুন'}
              </button>
              <a
                href={previewUrl}
                download="amar-sherpur.png"
                className={`w-full text-center text-base font-semibold py-3.5 rounded-xl ${
                  canShare ? 'border border-green/40 text-green' : 'bg-green text-white'
                }`}
              >
                ছবি সংরক্ষণ করুন
              </a>
            </div>
          )}

          {error && (
            <p className="max-w-md mx-auto mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {selCount > 0 && previewUrl && (
            <>
              {copied && (
                <p
                  className="max-w-md mx-auto mt-4 rounded-xl bg-green/10 border border-green/30 px-3 py-2.5 text-sm text-green-dark font-medium leading-relaxed"
                  role="status"
                >
                  লিংকসহ লেখা কপি হয়েছে ✓ ফেসবুকে পোস্টের ঘরে ধরে রেখে "পেস্ট" চাপুন।
                </p>
              )}
              <div className="max-w-md mx-auto mt-4 bg-white rounded-xl border border-ink/10 p-3">
                <p className="text-xs font-semibold text-ink/60 leading-relaxed">
                  ফেসবুক অ্যাপ ছবির সঙ্গে লিংক নেয় না। তাই "শেয়ার করুন" চাপলে নিচের লেখা নিজে থেকেই কপি হয়ে যায়।
                  ফেসবুকে পোস্টের ঘরে ধরে রেখে "পেস্ট" চাপুন।
                </p>
                <p className="text-sm mt-2 whitespace-pre-line break-words select-all">{captionText()}</p>
              </div>
              <p className="max-w-md mx-auto mt-3 text-xs text-ink/50 leading-relaxed">
                {inFacebook
                  ? 'ফেসবুকের ভেতরের ব্রাউজারে সংরক্ষণ কাজ না করলে ছবিতে চেপে ধরে সংরক্ষণ করুন, অথবা মেনু থেকে "ব্রাউজারে খুলুন" বেছে নিন।'
                  : 'সংরক্ষণ কাজ না করলে ছবিতে চেপে ধরে সংরক্ষণ করতে পারবেন।'}
              </p>
            </>
          )}
        </section>

        <p className="text-[10px] text-ink/40 text-center mt-8">মানচিত্র: geoBoundaries (CC BY 4.0)</p>
      </main>

      {selCount > 0 && !previewVisible && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink/10 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <p className="flex-1 text-sm font-semibold" aria-live="polite">
              {num(selCount)}টি নির্বাচিত
            </p>
            <button
              type="button"
              onClick={() => jumpTo('card-preview')}
              className="bg-green text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              কার্ড দেখুন ↓
            </button>
          </div>
          <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
      )}
    </div>
  );
}
