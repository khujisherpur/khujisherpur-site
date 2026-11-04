'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

// ঠিকানা বদলাতে চাইলে শুধু এখানে বদলান
const LINKS = {
  home: '/blood',
  donors: '/blood/donors',
  create: '/blood/request',
  requests: '/blood#requests',
  profile: '/dashboard/donor',
};

export default function BloodNav() {
  const pathname = usePathname() || '';
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // শুধু রক্তের পেজ ও ডোনার ড্যাশবোর্ডে দেখাবে
  const show = pathname.startsWith('/blood') || pathname.startsWith('/dashboard/donor');
  if (!show) return null;

  const profileHref = user ? LINKS.profile : '/login';

  const items = [
    { key: 'home', href: LINKS.home, icon: '🏠', label: 'হোম', active: pathname === '/blood' },
    { key: 'donors', href: LINKS.donors, icon: '👥', label: 'ডোনার', active: pathname.startsWith('/blood/donor') },
    { key: 'create', href: LINKS.create, icon: '➕', label: 'রিকুয়েস্ট দিন', isCenter: true },
    { key: 'requests', href: LINKS.requests, icon: '🔔', label: 'রিকুয়েস্ট', active: false },
    { key: 'profile', href: profileHref, icon: '🩸', label: 'প্রোফাইল', active: pathname.startsWith('/dashboard/donor') },
  ];

    return (
    <>
    <div className="h-24" aria-hidden="true" />
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-red-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {items.map((item) => {
          if (item.isCenter) {
            return (
              <a key={item.key} href={item.href} className="flex flex-col items-center justify-center py-2">
                <span className="w-12 h-12 -mt-6 rounded-full bg-red-600 text-white text-2xl flex items-center justify-center shadow-lg">
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
                item.active ? 'text-red-600' : 'text-ink/50'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
            <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
    </>
  );
}
