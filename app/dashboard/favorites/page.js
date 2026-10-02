'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { getServicesFor } from '../../../lib/services';
import BottomNav from '../../../components/BottomNav';
import SiteHeader from '../../../components/SiteHeader';

function getCookieLang() {
  if (typeof document === 'undefined') return 'bn';
  const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
  return match && match[1] === 'en' ? 'en' : 'bn';
}

const text = {
  bn: {
    title: 'সংরক্ষিত',
    back: '← আমার অ্যাকাউন্ট',
    loading: 'লোড হচ্ছে...',
    loginRequired: 'এই পেজ দেখতে লগইন করুন।',
    loginButton: 'লগইন করুন',
    tabAds: 'বিজ্ঞাপন',
    tabSearches: 'সার্চ',
    all: 'সব',
    posts: 'পোস্ট',
    profiles: 'প্রোফাইল',
    emptyAdsTitle: 'এখানে এখনো কিছু নেই',
    emptyAdsBody: 'পছন্দের পোস্ট বা সেবাদাতার পাশের ♡ চাপলে এখানে জমা থাকবে, পরে সহজে খুঁজে পাবেন।',
    emptySearchTitle: 'কোনো সার্চ সংরক্ষিত নেই',
    emptySearchBody: 'সার্চ পেজে "এই সার্চ সংরক্ষণ করুন" চাপলে এখানে জমা থাকবে, এক ট্যাপে আবার খুলতে পারবেন।',
    findAnything: 'কিছু খুঁজুন',
    browseCats: 'ক্যাটাগরি দেখুন',
    inactive: 'আর সক্রিয় নেই',
    removed: 'সরানো হয়েছে',
    undo: 'ফিরিয়ে আনুন',
    remove: 'সরান',
    savedSearch: 'সংরক্ষিত সার্চ',
  },
  en: {
    title: 'Saved',
    back: '← My Account',
    loading: 'Loading...',
    loginRequired: 'Please log in to view this page.',
    loginButton: 'Log In',
    tabAds: 'Adverts',
    tabSearches: 'Searches',
    all: 'All',
    posts: 'Posts',
    profiles: 'Profiles',
    emptyAdsTitle: "It's empty here...",
    emptyAdsBody: 'Tap the ♡ on a post or provider you like and it will be kept here for later.',
    emptySearchTitle: 'No saved searches',
    emptySearchBody: 'Tap "Save this search" on the search page and it will appear here for one-tap access.',
    findAnything: 'Find anything',
    browseCats: 'Browse categories',
    inactive: 'No longer active',
    removed: 'Removed',
    undo: 'Undo',
    remove: 'Remove',
    savedSearch: 'Saved search',
  },
};

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 240 150" className="w-56 h-auto mx-auto" fill="none" aria-hidden="true">
      <ellipse cx="55" cy="45" rx="30" ry="10" fill="#DCEFE5" />
      <ellipse cx="76" cy="40" rx="18" ry="9" fill="#DCEFE5" />
      <ellipse cx="192" cy="116" rx="26" ry="8" fill="#DCEFE5" />
      <path
        d="M28 130 C50 100 90 124 120 100 S160 62 186 54"
        stroke="#1C8A4C"
        strokeWidth="1.8"
        strokeDasharray="4 5"
        strokeLinecap="round"
      />
      <path d="M186 54 L224 30 L206 76 Z" fill="#8FD0AE" />
      <path d="M186 54 L224 30 L197 64 Z" fill="#1C8A4C" />
      <path d="M197 64 L206 76 L203 60 Z" fill="#0F4D3A" />
    </svg>
  );
}

function EmptyState({ title, body, primaryHref, primaryLabel, secondaryHref, secondaryLabel }) {
  return (
    <div className="text-center py-10 px-4">
      <EmptyIllustration />
      <p className="font-semibold mt-5">{title}</p>
      <p className="text-sm text-ink/55 mt-1.5 max-w-xs mx-auto leading-relaxed">{body}</p>
      <a
        href={primaryHref}
        className="inline-block mt-5 bg-green text-white font-semibold text-sm px-7 py-3 rounded-xl"
      >
        {primaryLabel}
      </a>
      {secondaryHref && (
        <div className="mt-3">
          <a href={secondaryHref} className="text-sm text-green underline">
            {secondaryLabel}
          </a>
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  const [lang, setLang] = useState('bn');
  const t = text[lang];

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ads');
  const [filter, setFilter] = useState('all');
  const [providers, setProviders] = useState([]);
  const [listings, setListings] = useState([]);
  const [searches, setSearches] = useState([]);
  const [svcMap, setSvcMap] = useState({});
  const [undo, setUndo] = useState(null);

  useEffect(() => {
    setLang(getCookieLang());
    init();
  }, []);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(timer);
  }, [undo]);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      await Promise.all([loadFavorites(data.user.id), loadSearches(data.user.id)]);
    }
    setLoading(false);
  }

  async function loadFavorites(userId) {
    const { data: favs } = await supabase
      .from('favorites')
      .select('id, provider_id, listing_id')
      .eq('user_id', userId);

    const providerIds = (favs || []).filter((f) => f.provider_id).map((f) => f.provider_id);
    const listingIds = (favs || []).filter((f) => f.listing_id).map((f) => f.listing_id);

    if (providerIds.length > 0) {
      const { data } = await supabase
        .from('providers')
        .select('id, name, slug, area, photo_url, status, primary_subcategory_id, categories(name)')
        .in('id', providerIds);
      setProviders(data || []);
      setSvcMap(await getServicesFor(data || [], 'bn'));
    } else {
      setProviders([]);
    }

    if (listingIds.length > 0) {
      const { data } = await supabase
        .from('listings')
        .select('id, title, area, price_or_salary, photos, status, categories(name)')
        .in('id', listingIds);
      setListings(data || []);
    } else {
      setListings([]);
    }
  }

  async function loadSearches(userId) {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('id, label, query_string, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setSearches(error ? [] : data || []);
  }

  async function removeFavorite(kind, item) {
    const column = kind === 'provider' ? 'provider_id' : 'listing_id';
    const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq(column, item.id);
    if (error) {
      alert(error.message);
      return;
    }
    if (kind === 'provider') setProviders((prev) => prev.filter((p) => p.id !== item.id));
    else setListings((prev) => prev.filter((l) => l.id !== item.id));
    setUndo({ kind, item });
  }

  async function undoRemove() {
    if (!undo) return;
    const column = undo.kind === 'provider' ? 'provider_id' : 'listing_id';
    const { error } = await supabase.from('favorites').insert({ user_id: user.id, [column]: undo.item.id });
    if (error) {
      alert(error.message);
      return;
    }
    if (undo.kind === 'provider') setProviders((prev) => [undo.item, ...prev]);
    else setListings((prev) => [undo.item, ...prev]);
    setUndo(null);
  }

  async function removeSearch(id) {
    const { error } = await supabase.from('saved_searches').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) {
    return (
      <>
        <SiteHeader lang={lang} simple />
        <p className="text-center py-20 text-ink/60">{t.loading}</p>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <SiteHeader lang={lang} simple />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-ink/70 mb-4">{t.loginRequired}</p>
          <a href="/login" className="inline-block bg-marigold text-ink font-semibold px-5 py-2.5 rounded-lg">
            {t.loginButton}
          </a>
        </main>
      </>
    );
  }

  const adsCount = providers.length + listings.length;
  const showFilters = providers.length > 0 && listings.length > 0;
  const shownProviders = filter === 'listing' ? [] : providers;
  const shownListings = filter === 'provider' ? [] : listings;

  return (
    <>
      <SiteHeader lang={lang} simple />
      <main className="max-w-2xl mx-auto px-4 py-5">
        <a href="/dashboard" className="text-sm text-ink/60 inline-block mb-2">{t.back}</a>
        <h1 className="text-2xl font-semibold mb-4">{t.title}</h1>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-ink/10 mb-4">
          {[
            { key: 'ads', label: t.tabAds, count: adsCount },
            { key: 'searches', label: t.tabSearches, count: searches.length },
          ].map((x) => (
            <button
              key={x.key}
              onClick={() => setTab(x.key)}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === x.key ? 'text-ink border-green' : 'text-ink/45 border-transparent'
              }`}
            >
              {x.label} <span className="font-numeric">({x.count})</span>
            </button>
          ))}
        </div>

        {/* Adverts tab */}
        {tab === 'ads' && (
          <>
            {adsCount === 0 && (
              <EmptyState
                title={t.emptyAdsTitle}
                body={t.emptyAdsBody}
                primaryHref="/search"
                primaryLabel={t.findAnything}
                secondaryHref="/#categories"
                secondaryLabel={t.browseCats}
              />
            )}

            {showFilters && (
              <div className="flex gap-2 mb-3">
                {[
                  { key: 'all', label: t.all },
                  { key: 'listing', label: `${t.posts} (${listings.length})` },
                  { key: 'provider', label: `${t.profiles} (${providers.length})` },
                ].map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setFilter(c.key)}
                    className={`text-xs px-3.5 py-1.5 rounded-full border ${
                      filter === c.key ? 'bg-green text-white border-green' : 'bg-white text-ink/70 border-ink/15'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {shownListings.map((l) => (
                <div
                  key={`l-${l.id}`}
                  className="bg-white rounded-xl border-l-4 border-l-marigold border-t border-r border-b border-ink/10 flex"
                >
                  <a href={`/listing/${l.id}`} className="flex gap-3 flex-1 min-w-0 p-3">
                    {l.photos?.[0] ? (
                      <img src={l.photos[0]} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-20 h-20 rounded-lg bg-[#EEF1F8] flex items-center justify-center text-2xl flex-shrink-0">
                        📄
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium leading-tight line-clamp-2">{l.title}</p>
                      <p className="text-xs text-ink/55 mt-1 line-clamp-1">
                        {l.categories?.name} · {l.area}
                      </p>
                      {l.price_or_salary && (
                        <p className="text-sm text-green font-numeric font-semibold mt-1">৳ {l.price_or_salary}</p>
                      )}
                      {l.status !== 'active' && (
                        <span className="inline-block text-[10px] bg-ink/5 text-ink/50 px-2 py-0.5 rounded-full mt-1">
                          {t.inactive}
                        </span>
                      )}
                    </div>
                  </a>
                  <button
                    onClick={() => removeFavorite('listing', l)}
                    aria-label={t.remove}
                    className="px-3.5 self-start pt-3 text-2xl text-red-500 leading-none"
                  >
                    ♥
                  </button>
                </div>
              ))}

              {shownProviders.map((p) => {
                const services = svcMap[p.id] || [];
                const primary = services.find((s) => s.primary);
                const href = p.slug && primary ? `/${primary.slug}/${p.slug}` : `/provider/${p.id}`;
                const serviceText = services.length
                  ? services.slice(0, 2).map((s) => `${s.icon} ${s.names[lang]}`).join(', ')
                  : p.categories?.name;
                return (
                  <div
                    key={`p-${p.id}`}
                    className="bg-white rounded-xl border-l-4 border-l-green border-t border-r border-b border-ink/10 flex"
                  >
                    <a href={href} className="flex gap-3 flex-1 min-w-0 p-3">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt="" className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <span className="w-20 h-20 rounded-full bg-[#EEF1F8] text-green-dark text-2xl font-semibold flex items-center justify-center flex-shrink-0">
                          {p.name?.charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0 self-center">
                        <p className="font-medium leading-tight line-clamp-1">{p.name}</p>
                        <p className="text-xs text-ink/55 mt-1 line-clamp-1">{serviceText}</p>
                        <p className="text-xs text-ink/45 mt-0.5 line-clamp-1">📍 {p.area}</p>
                        {p.status !== 'approved' && (
                          <span className="inline-block text-[10px] bg-ink/5 text-ink/50 px-2 py-0.5 rounded-full mt-1">
                            {t.inactive}
                          </span>
                        )}
                      </div>
                    </a>
                    <button
                      onClick={() => removeFavorite('provider', p)}
                      aria-label={t.remove}
                      className="px-3.5 self-start pt-3 text-2xl text-red-500 leading-none"
                    >
                      ♥
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Searches tab */}
        {tab === 'searches' && (
          <>
            {searches.length === 0 && (
              <EmptyState
                title={t.emptySearchTitle}
                body={t.emptySearchBody}
                primaryHref="/search"
                primaryLabel={t.findAnything}
              />
            )}
            <div className="space-y-3">
              {searches.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-ink/10 flex items-center">
                  <a href={`/search?${s.query_string}`} className="flex items-center gap-3 flex-1 min-w-0 p-3">
                    <span className="w-11 h-11 rounded-full bg-[#EEF1F8] flex items-center justify-center flex-shrink-0">
                      🔍
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium leading-tight line-clamp-1">{s.label}</p>
                      <p className="text-xs text-ink/45 mt-0.5">{t.savedSearch}</p>
                    </div>
                  </a>
                  <button
                    onClick={() => removeSearch(s.id)}
                    aria-label={t.remove}
                    className="px-4 text-ink/40 text-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {undo && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm pl-4 pr-2 py-2 rounded-full shadow-lg flex items-center gap-3">
            <span>{t.removed}</span>
            <button onClick={undoRemove} className="text-marigold font-semibold px-3 py-1">
              {t.undo}
            </button>
          </div>
        )}

        <BottomNav activeTab="favorites" />
        <div className="h-16" />
      </main>
    </>
  );
}
