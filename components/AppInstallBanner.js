'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isInstalled, isStandalone, markInstalled, startInstallListeners, triggerInstall } from '../lib/pwaInstall';

const SHOW_MS = 8000;

export default function AppInstallBanner() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    startInstallListeners();
    if (isStandalone()) markInstalled();
    const h = () => setShow(false);
    window.addEventListener('ks-installed', h);
    return () => window.removeEventListener('ks-installed', h);
  }, []);

  // প্রতিটি পেজ বদলালে আবার দেখাবে, ইনস্টল না হওয়া পর্যন্ত
  useEffect(() => {
    if (isInstalled()) {
      setShow(false);
      return;
    }
    setShow(true);
    const fromLink = new URLSearchParams(window.location.search).get('install') === '1';
    if (fromLink) return; // ফেসবুক থেকে এলে বন্ধ হবে না
    const t = setTimeout(() => setShow(false), SHOW_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!show) {
      setVis(false);
      return;
    }
    const t = setTimeout(() => setVis(true), 30);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={
        'fixed top-2 inset-x-2 md:max-w-md md:mx-auto z-50 bg-green text-white rounded-2xl shadow-xl ' +
        'px-3 py-2.5 flex items-center gap-3 transition-all duration-500 ' +
        (vis ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0')
      }
    >
      <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-lg bg-white" />
      <div className="flex-1 leading-tight">
        <p className="text-sm font-semibold">খুঁজি শেরপুর অ্যাপ</p>
        <p className="text-xs opacity-90">ফোনে ইনস্টল করে দ্রুত ব্যবহার করুন</p>
      </div>
      <button
        onClick={() => triggerInstall()}
        className="bg-white text-green text-sm font-bold px-3 py-2 rounded-xl"
      >
        ডাউনলোড
      </button>
      <button
        onClick={() => setShow(false)}
        aria-label="বন্ধ করুন"
        className="text-white/90 text-lg px-1"
      >
        ✕
      </button>
    </div>
  );
}
