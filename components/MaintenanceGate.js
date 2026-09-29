'use client';
import { usePathname } from 'next/navigation';

export default function MaintenanceGate({ active, message, children }) {
  const pathname = usePathname() || '';
  // অ্যাডমিন যেন সবসময় ঢুকতে পারে
  const bypass = pathname.startsWith('/admin') || pathname.startsWith('/login');

  if (!active || bypass) return children;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0F4D3A] to-[#0A3527] flex items-center justify-center px-5">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-7 text-center">
        <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-8 w-auto mx-auto mb-5" />
        <p className="text-5xl mb-3">🛠️</p>
        <h1 className="text-lg font-semibold mb-2">সাইটে রক্ষণাবেক্ষণের কাজ চলছে</h1>
        <p className="text-sm text-ink/70 leading-relaxed">
          {message || 'আমরা সাইটটি আরও ভালো করতে কাজ করছি। অল্প সময় পর আবার ঘুরে আসুন।'}
        </p>
        <a href="/admin" className="inline-block mt-6 text-[11px] text-ink/30">অ্যাডমিন</a>
      </div>
    </main>
  );
}
