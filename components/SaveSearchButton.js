'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const MAX_SAVED = 30;

const text = {
  bn: {
    save: 'এই সার্চ সংরক্ষণ করুন',
    saved: 'সার্চ সংরক্ষিত',
    view: 'সংরক্ষিত দেখুন →',
    limit: `সর্বোচ্চ ${MAX_SAVED}টি সার্চ সংরক্ষণ করা যায়। পুরোনো কিছু সরিয়ে আবার চেষ্টা করুন।`,
  },
  en: {
    save: 'Save this search',
    saved: 'Search saved',
    view: 'View saved →',
    limit: `You can save up to ${MAX_SAVED} searches. Remove an old one and try again.`,
  },
};

export default function SaveSearchButton({ lang, query, upazila, union }) {
  const t = text[lang] || text.bn;
  const [user, setUser] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (upazila) params.set('upazila', upazila);
  if (union) params.set('union', union);
  const queryString = params.toString();
  const label = [query, union || upazila].filter(Boolean).join(' · ');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(data.user);
      if (data.user) {
        const { data: rows } = await supabase
          .from('saved_searches')
          .select('id')
          .eq('user_id', data.user.id)
          .eq('query_string', queryString)
          .limit(1);
        if (!cancelled) setSavedId(rows && rows.length > 0 ? rows[0].id : null);
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  async function toggle() {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setBusy(true);

    if (savedId) {
      const { error } = await supabase.from('saved_searches').delete().eq('id', savedId);
      if (error) alert(error.message);
      else setSavedId(null);
      setBusy(false);
      return;
    }

    const { count } = await supabase
      .from('saved_searches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count || 0) >= MAX_SAVED) {
      alert(t.limit);
      setBusy(false);
      return;
    }

    const { data, error } = await supabase
      .from('saved_searches')
      .insert({ user_id: user.id, label: label || queryString, query_string: queryString })
      .select('id')
      .single();
    if (error) alert(error.message);
    else setSavedId(data.id);
    setBusy(false);
  }

  if (checking) return null;

  return (
    <div className="flex items-center gap-3 mt-3 flex-wrap">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`text-sm font-medium px-4 py-2 rounded-full border transition-colors disabled:opacity-50 ${
          savedId ? 'bg-green text-white border-green' : 'bg-white text-green border-green/40'
        }`}
      >
        {savedId ? '✓ ' : '🔖 '}
        {savedId ? t.saved : t.save}
      </button>
      {savedId && (
        <a href="/dashboard/favorites" className="text-sm text-green underline">
          {t.view}
        </a>
      )}
    </div>
  );
}
