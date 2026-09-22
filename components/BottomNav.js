'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const text = {
  bn: { home: 'হোম', search: 'খুঁজুন', post: 'পোস্ট', favorites: 'ফেভারিট', account: 'অ্যাকাউন্ট' },
  en: { home: 'Home', search: 'Search', post: 'Post', favorites: 'Saved', account: 'Account' },
};

function getCookieLang() {
  if (typeof document === 'undefined') return 'bn';
  const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
  return match && match[1] === 'en' ? 'en' : 'bn';
}

export default function BottomNav({ activeTab = '' }) {
  const [lang, setLang] = useState('bn');
  const [user, setUser] = useState(null);

  useEffect(() => {
    setLang(getCookieLang());
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const t = text[lang];
  const accountHref = user ? '/dashboard' : '/login';
  const favoritesHref = user ? '/dashboard/favorites' : '/login';

  const items = [
    { key: 'home', href: '/', icon: '🏠', label: t.home },
    { key: 'search', href: '/search', icon: '🔍', label: t.search },
    { key: 'post', href: '/#categories', icon: '➕', label: t.post, isCenter: true },
    { key: 'favorites', href: favoritesHref, icon: '❤️', label: t.favorites },
    { key: 'account', href: accountHref, icon: '👤', label: t.account },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ink/10 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] md:hidden">
      <div className="max-w-4xl mx-auto grid grid-cols-5">
        {items.map((item) => {
          const isActive = activeTab === item.key;
          if (item.isCenter) {
            return (
              <a key={item.key} href={item.href} className="flex flex-col items-center justify-center py-2">
                <span className="w-11 h-11 -mt-4 rounded-full bg-marigold text-ink text-xl flex items-center justify-center shadow-md">
                  {item.icon}
                </span>
                <span className="text-[10px] mt-0.5 text-ink/60">{item.label}</span>
              </a>
            );
          }
          return (
            <a
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 ${
                isActive ? 'text-green' : 'text-ink/50'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
      {/* iPhone-এর মতো ফোনে নিচের সেফ-এরিয়া প্যাডিং */}
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
