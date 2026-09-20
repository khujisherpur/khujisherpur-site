'use client';
import { useState } from 'react';

const content = {
  bn: {
    title: 'প্রাইভেসি পলিসি',
    updated: 'সর্বশেষ হালনাগাদ: সেপ্টেম্বর ২০২৬',
    sections: [
      {
        h: '১. আমরা কী তথ্য সংগ্রহ করি',
        p: 'অ্যাকাউন্ট তৈরি করলে আমরা সংগ্রহ করি: আপনার নাম, ইমেইল, এবং (যদি Google দিয়ে লগইন করেন) Google থেকে পাওয়া প্রোফাইল তথ্য। পোস্ট বা প্রোফাইল তৈরি করলে আপনার দেওয়া ফোন নম্বর, এলাকা, ও বিবরণও সংরক্ষণ করা হয়।',
      },
      {
        h: '২. তথ্য কীভাবে ব্যবহার হয়',
        p: 'আপনার তথ্য শুধুমাত্র সাইটের কার্যক্রম পরিচালনার জন্য ব্যবহার হয় — যেমন আপনার অ্যাকাউন্ট চেনা, আপনার পোস্ট/প্রোফাইল অন্যদের দেখানো, এবং জরুরি নোটিফিকেশন পাঠানো। প্রোভাইডার প্রোফাইলে দেওয়া ফোন নম্বর সবার জন্য প্রকাশ্য থাকে, কারণ এটাই যোগাযোগের মূল মাধ্যম।',
      },
      {
        h: '৩. তথ্য বিক্রি বা শেয়ার',
        p: 'আমরা আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি করি না। আপনার ইমেইল ও লগইন তথ্য নিরাপদে Supabase-এর মাধ্যমে সংরক্ষিত হয়।',
      },
      {
        h: '৪. আপনার নিয়ন্ত্রণ',
        p: 'আপনি যে কোনো সময় ড্যাশবোর্ড থেকে নিজের পোস্ট বা প্রোফাইল এডিট বা ডিলিট করতে পারবেন। সম্পূর্ণ অ্যাকাউন্ট মুছে ফেলতে চাইলে আমাদের সাথে যোগাযোগ করুন।',
      },
      {
        h: '৫. যোগাযোগ',
        p: 'প্রাইভেসি সংক্রান্ত কোনো প্রশ্ন থাকলে আমাদের ইমেইল করুন: khujisherpur@gmail.com',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: September 2026',
    sections: [
      {
        h: '1. What We Collect',
        p: 'When you create an account, we collect your name, email, and (if you sign in with Google) profile information from Google. When you create a post or profile, we also store the phone number, area, and description you provide.',
      },
      {
        h: '2. How We Use It',
        p: 'Your information is used only to operate the site — recognizing your account, showing your posts/profiles to others, and sending important notifications. Phone numbers on provider profiles are public, since they are the main way to make contact.',
      },
      {
        h: '3. Sharing & Sale of Data',
        p: 'We do not sell your personal information to any third party. Your email and login data is securely stored via Supabase.',
      },
      {
        h: '4. Your Control',
        p: 'You can edit or delete your own posts or profiles from your dashboard at any time. Contact us if you wish to delete your entire account.',
      },
      {
        h: '5. Contact',
        p: 'For any privacy-related questions, email us at: khujisherpur@gmail.com',
      },
    ],
  },
};

export default function PrivacyPage() {
  const [lang, setLang] = useState('bn');
  const t = content[lang];

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
        <div className="flex border border-ink/20 rounded-full overflow-hidden text-sm">
          <button
            onClick={() => setLang('bn')}
            className={`px-3 py-1 ${lang === 'bn' ? 'bg-green text-white' : 'text-ink/60'}`}
          >
            বাংলা
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 ${lang === 'en' ? 'bg-green text-white' : 'text-ink/60'}`}
          >
            English
          </button>
        </div>
      </header>

      <h1 className="text-2xl font-semibold mb-2">{t.title}</h1>
      <p className="text-sm text-ink/50 mb-8">{t.updated}</p>

      <div className="space-y-6 text-sm text-ink/80 leading-relaxed">
        {t.sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-semibold text-ink mb-2">{s.h}</h2>
            <p>{s.p}</p>
          </section>
        ))}
      </div>

      <a href="/" className="inline-block mt-10 text-green underline text-sm">
        {lang === 'bn' ? '← হোমপেজে ফিরে যান' : '← Back to Home'}
      </a>
    </main>
  );
}
