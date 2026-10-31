'use client';
import { useEffect, useState } from 'react';

const text = {
  bn: {
    title: 'কিছু একটা সমস্যা হয়েছে',
    body: 'পাতাটি খুলতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন। ইন্টারনেট ধীর হলেও এমন হতে পারে।',
    retry: 'আবার চেষ্টা করুন',
    home: 'হোমপেজে যান',
  },
  en: {
    title: 'Something went wrong',
    body: 'This page could not be opened. Please try again in a moment. A slow connection can also cause this.',
    retry: 'Try again',
    home: 'Go to homepage',
  },
};

// কোনো পেজ চলার সময় ত্রুটি হলে সাদা পর্দার বদলে এটা দেখায়
export default function Error({ error, reset }) {
  const [lang, setLang] = useState('bn');

  useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|; )lang=([^;]*)/);
      if (m && m[1] === 'en') setLang('en');
    } catch (e) {}
  }, []);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = text[lang];
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full text-center">
        <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto mx-auto mb-6" />
        <p className="text-5xl leading-none">⚠️</p>
        <h1 className="text-xl font-semibold mt-4">{t.title}</h1>
        <p className="text-sm text-ink/60 mt-2 leading-relaxed">{t.body}</p>
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-green text-white font-semibold text-sm py-3 rounded-xl"
          >
            {t.retry}
          </button>
          <a href="/" className="border border-green/40 text-green font-semibold text-sm py-3 rounded-xl">
            {t.home}
          </a>
        </div>
      </div>
    </main>
  );
}
