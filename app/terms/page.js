'use client';
import { useState } from 'react';

const content = {
  bn: {
    title: 'শর্তাবলি',
    updated: 'সর্বশেষ হালনাগাদ: সেপ্টেম্বর ২০২৬',
    sections: [
      {
        h: '১. সাইট সম্পর্কে',
        p: 'খুঁজি শেরপুর একটি স্থানীয় তথ্য-মাধ্যম, যেখানে ব্যবহারকারীরা বাসা ভাড়া, মেস ভাড়া, চাকরি বিজ্ঞপ্তি পোস্ট করতে পারেন এবং ইলেকট্রিশিয়ান, প্লাম্বারের মতো সেবাদাতাদের প্রোফাইল খুঁজে পেতে পারেন। এই সাইট শুধুমাত্র একটি মাধ্যম — ব্যবহারকারীদের মধ্যে সরাসরি লেনদেন বা চুক্তির পক্ষ নয়।',
      },
      {
        h: '২. অ্যাকাউন্ট ও দায়িত্ব',
        p: 'অ্যাকাউন্ট তৈরি করার সময় আপনাকে সঠিক তথ্য দিতে হবে। আপনার অ্যাকাউন্ট থেকে হওয়া সব কার্যক্রমের জন্য আপনি দায়ী থাকবেন। মিথ্যা তথ্য, প্রতারণামূলক পোস্ট, বা অন্যকে ক্ষতিগ্রস্ত করার উদ্দেশ্যে কিছু পোস্ট করা নিষিদ্ধ।',
      },
      {
        h: '৩. পোস্ট ও প্রোফাইল অনুমোদন',
        p: 'সব পোস্ট ও প্রোফাইল প্রকাশের আগে পর্যালোচনার (Pending) মধ্য দিয়ে যায়। খুঁজি শেরপুর কর্তৃপক্ষের এমন অধিকার আছে যে কোনো পোস্ট/প্রোফাইল, শর্তাবলি ভঙ্গ করলে বা অনুপযুক্ত মনে হলে, তা প্রত্যাখ্যান বা সরিয়ে ফেলার।',
      },
      {
        h: '৪. দায়বদ্ধতার সীমাবদ্ধতা',
        p: 'খুঁজি শেরপুর পোস্ট করা তথ্যের সত্যতা যাচাই করে না এবং ব্যবহারকারীদের মধ্যে হওয়া কোনো লেনদেন, চুক্তি, বা বিরোধের জন্য দায়ী নয়। বাসা ভাড়া নেওয়া, চাকরিতে আবেদন করা, বা সেবাদাতা নিয়োগ করার আগে নিজ দায়িত্বে যাচাই করে নেওয়ার পরামর্শ দেওয়া হচ্ছে।',
      },
      {
        h: '৫. পরিবর্তন',
        p: 'এই শর্তাবলি যে কোনো সময় পরিবর্তন হতে পারে। সাইট ব্যবহার চালিয়ে যাওয়ার মাধ্যমে আপনি হালনাগাদ শর্তাবলি মেনে নিচ্ছেন বলে গণ্য হবে।',
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: September 2026',
    sections: [
      {
        h: '1. About the Site',
        p: 'Khuji Sherpur is a local information platform where users can post house rentals, mess rentals, and job listings, and find service providers such as electricians and plumbers. The site is only a medium — it is not a party to any transaction or agreement between users.',
      },
      {
        h: '2. Account & Responsibility',
        p: 'You must provide accurate information when creating an account. You are responsible for all activity under your account. Posting false information, fraudulent listings, or content intended to harm others is prohibited.',
      },
      {
        h: '3. Post & Profile Approval',
        p: 'All posts and profiles go through a review (Pending) stage before publishing. Khuji Sherpur reserves the right to reject or remove any post/profile that violates these terms or is deemed inappropriate.',
      },
      {
        h: '4. Limitation of Liability',
        p: 'Khuji Sherpur does not verify the accuracy of posted information and is not liable for any transaction, agreement, or dispute between users. We recommend verifying independently before renting a home, applying for a job, or hiring a service provider.',
      },
      {
        h: '5. Changes',
        p: 'These terms may change at any time. Continued use of the site means you accept the updated terms.',
      },
    ],
  },
};

export default function TermsPage() {
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
