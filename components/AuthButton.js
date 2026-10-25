'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const text = {
  bn: { login: 'লগইন', logout: 'লগআউট', dashboard: 'ড্যাশবোর্ড', favorites: 'আমার ফেভারিট' },
  en: { login: 'Login', logout: 'Logout', dashboard: 'Dashboard', favorites: 'My Favorites' },
};

export default function AuthButton({ lang = 'bn', variant = 'default' }) {
  const isLight = variant === 'light';
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const t = text[lang];

  useEffect(() => {
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) loadName(session.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) await loadName(data.user.id);
    setLoading(false);
  }

    async function loadName(userId) {
    const { data } = await supabase
      .from('users')
      .select('name, avatar_url')
      .eq('id', userId)
      .single();
    setName(data?.name || '');
    setAvatar(data?.avatar_url || '');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 200;
      const margin = 12;
      let right = window.innerWidth - rect.right;
      if (right + panelWidth > window.innerWidth - margin) right = margin;
      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right,
        width: panelWidth,
      });
    }
    setOpen((o) => !o);
  }

  if (loading) {
    return <div className={`w-9 h-9 rounded-full ${isLight ? 'bg-white/10' : 'bg-ink/5'}`} />;
  }

  if (!user) {
    return (
            <a
        href="/login"
        onClick={(e) => {
          const here = window.location.pathname + window.location.search;
          if (!here.startsWith('/login')) {
            e.preventDefault();
            window.location.href = '/login?next=' + encodeURIComponent(here);
          }
        }}
        className={`text-sm rounded-full px-4 py-1.5 transition-colors border ${
          isLight
            ? 'border-white/40 text-white hover:bg-white/10'
            : 'border-ink/20 hover:bg-paper'
        }`}
      >
        {t.login}
      </a>
    );
  }

  const initial = (name || user.email || '?').charAt(0).toUpperCase();

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="flex flex-col items-center gap-0.5 px-1"
      >
         {avatar ? (
          <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/60" />
        ) : (
          <span className={`w-8 h-8 rounded-full text-sm flex items-center justify-center flex-shrink-0 ${
            isLight ? 'bg-white text-green font-semibold' : 'bg-green text-white'
          }`}>
            {initial}
          </span>
        )}
        <span className={`text-[10px] font-medium max-w-[64px] truncate leading-none ${
          isLight ? 'text-white/90' : 'text-ink/70'
        }`}>
          {name || user.email}
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="bg-white border border-ink/10 shadow-lg z-50 overflow-hidden rounded-md"
        >
                    <a href="/dashboard/profile" className="flex items-center gap-2.5 px-4 py-3 border-b border-ink/10 hover:bg-paper">
            {avatar ? (
              <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <span className="w-9 h-9 rounded-full bg-green text-white text-sm flex items-center justify-center flex-shrink-0">
                {initial}
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-medium truncate text-ink">{name}</span>
              <span className="block text-xs text-ink/50 truncate">{user.email}</span>
            </span>
          </a>
          <a
            href="/dashboard"
            className="block px-4 py-2.5 text-sm text-ink hover:bg-paper transition-colors"
          >
            {t.dashboard}
          </a>
          <a
            href="/dashboard/favorites"
            className="block px-4 py-2.5 text-sm text-ink hover:bg-paper transition-colors"
          >
            ❤️ {t.favorites}
          </a>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-ink/10"
          >
            {t.logout}
          </button>
        </div>
      )}
    </>
  );
}
