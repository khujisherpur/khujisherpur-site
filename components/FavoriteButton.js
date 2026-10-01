'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function getCookieLang() {
  if (typeof document === 'undefined') return 'bn';
  const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
  return match && match[1] === 'en' ? 'en' : 'bn';
}

const text = {
  bn: { save: 'সংরক্ষণ করুন', saved: 'সংরক্ষিত' },
  en: { save: 'Save', saved: 'Saved' },
};

export default function FavoriteButton({ targetType, targetId }) {
  const [lang, setLang] = useState('bn');
  const [user, setUser] = useState(null);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLang(getCookieLang());
    init();
  }, []);

  const column = targetType === 'provider' ? 'provider_id' : 'listing_id';

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      const { data: fav } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', data.user.id)
        .eq(column, targetId)
        .maybeSingle();
      setFavoriteId(fav?.id || null);
    }
    setLoading(false);
  }

  async function toggleFavorite() {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (busy) return;
    setBusy(true);

    if (favoriteId) {
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);
      if (error) alert(error.message);
      else setFavoriteId(null);
    } else {
      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, [column]: targetId })
        .select('id')
        .single();
      if (error) alert(error.message);
      else setFavoriteId(data?.id || null);
    }
    setBusy(false);
  }

  const t = text[lang];
  const saved = !!favoriteId;

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading || busy}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 text-sm rounded-full px-4 py-2 border transition-colors disabled:opacity-60 ${
        saved
          ? 'border-red-300 text-red-500 bg-red-50'
          : 'border-ink/20 bg-white text-ink/70 active:bg-paper'
      }`}
    >
      <span>{saved ? '❤️' : '🤍'}</span>
      {saved ? t.saved : t.save}
    </button>
  );
}
