'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const text = {
  bn: { login: 'লগইন', logout: 'লগআউট', dashboard: 'ড্যাশবোর্ড', favorites: 'আমার ফেভারিট' },
  en: { login: 'Login', logout: 'Logout', dashboard: 'Dashboard', favorites: 'My Favorites' },
};

export default function AuthButton({ lang = 'bn' }) {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
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
    const { data } = await supabase.from('users').select('name').eq('id', userId).single();
    setName(data?.name || '');
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
    return <div className="w-9 h-9 rounded-full bg-ink/5" />;
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-paper transition-colors"
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
        className="flex items-center gap-2 border border-ink/20 rounded-full pl-1 pr-3 py-1 hover:bg-paper transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-green text-white text-sm flex items-center justify-center flex-shrink-0">
          {initial}
        </span>
        <span className="text-sm font-medium max-w-[100px] truncate">{name || user.email}</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="bg-white border border-ink/10 shadow-lg z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-ink/10">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-xs text-ink/50 truncate">{user.email}</p>
          </div>
          <a
            href="/dashboard"
            className="block px-4 py-2.5 text-sm hover:bg-paper transition-colors"
          >
            {t.dashboard}
          </a>
          <a
            href="/dashboard/favorites"
            className="block px-4 py-2.5 text-sm hover:bg-paper transition-colors"
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
