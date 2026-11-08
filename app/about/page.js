// বসাবেন: app/about/page.js
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { getLang } from '../../lib/getLang';
import LanguageToggle from '../../components/LanguageToggle';

const PHONE = '01600485274';
const EMAIL = 'khujisherpur@gmail.com';
const FACEBOOK = 'https://www.facebook.com/share/1PdNpPWwYY/';

const content = {
  bn: {
    title: 'আমাদের সম্পর্কে',
    updated: 'সর্বশেষ হালনাগাদ: নভেম্বর ২০২৬',
    back: '← হোমপেজে ফিরে যান',
    sections: [
      {
        h: 'খুঁজি শেরপুর কী',
        p: 'খুঁজি শেরপুর শেরপুর জেলার মানুষের জন্য একটি স্থানীয় তথ্য ও সেবার লোকাল প্ল্যাটফর্ম। এখানে বাসা-মেস ভাড়া, চাকরির খবর, কেনাবেচা, ইলেকট্রিশিয়ান-প্লাম্বারসহ বিভিন্ন সেবাদাতা, টিউটর, রক্তদাতা, অ্যাম্বুলেন্স ও জরুরি ফোন নম্বর এক জায়গায় পাওয়া যায়। আপনি দেখে-বুঝে সরাসরি কল করে যোগাযোগ করেন, মাঝখানে কোনো মাধ্যম থাকে না।',
      },
      {
        h: 'কেন বানানো হলো',
        p: 'শেরপুরে প্রয়োজনের সময় বাসা ভাড়া, ভালো মিস্ত্রি কিংবা নির্ভরযোগ্য সেবাদাতা খুঁজতে গিয়ে অনেক সময় নানা সমস্যায় পড়তে হয়। সঠিক তথ্য ও প্রয়োজনীয় মানুষকে এক জায়গায় খুঁজে পাওয়া সহজ করতে আমাদের এই উদ্যোগ। সেই চিন্তা থেকেই খুঁজি শেরপুর—শেরপুরের মানুষের প্রয়োজনীয় তথ্য, সেবা ও সুযোগকে একই প্ল্যাটফর্মে নিয়ে আসার একটি প্রচেষ্টা। আমাদের লক্ষ্য একটাই: শেরপুরের মানুষ যেন প্রয়োজনের সময় নির্ভরযোগ্য মানুষ ও তথ্য দ্রুত খুঁজে পান।',
      },
      {
        h: 'কারা চালায়',
        p: 'সাইটটি তৈরি ও পরিচালনা করেন আশরাফুল হোসেন, শেরপুর সদর। সাইটের কাজ আমি আশরাফুল নিজেই দেখাশোনা করি।',
      },
      {
        h: 'আমরা কী করি এবং কী করি না',
        list: [
          'আমরা পোস্ট ও সেবাদাতার প্রোফাইল দেখে অনুমোদন দিই, সন্দেহজনক পোস্ট সরিয়ে দিই।',
          'আমরা ক্রেতা-বিক্রেতা, মালিক-ভাড়াটিয়া বা সেবাদাতা-গ্রাহকের লেনদেনে অংশ নিই না। দাম, চুক্তি ও টাকার লেনদেন আপনাদের নিজেদের মধ্যে।',
          'আমরা কোনো পোস্টের সব তথ্যের সত্যতার নিশ্চয়তা দিই না। যাচাই করা সেবাদাতাদের ক্ষেত্রে কী দেখা হয়, তা ভেরিফিকেশন নীতি পেজে লেখা আছে।',
        ],
        link: { href: '/verification', label: 'ভেরিফিকেশন নীতি পড়ুন' },
      },
      {
        h: 'নিরাপদে ব্যবহার করুন',
        list: [
          'বাসা বা দোকান নিজে গিয়ে না দেখে অগ্রিম টাকা দেবেন না।',
          'চাকরির জন্য টাকা চাইলে সাবধান হন। বিশ্বস্ত প্রতিষ্ঠান আবেদনের নামে টাকা নেয় না।',
          'সন্দেহজনক কিছু পেলে পোস্টের নিচের "রিপোর্ট করুন" বাটন চাপুন, আমরা দেখব।',
        ],
      },
      {
        h: 'যোগাযোগ',
        contact: [
          { label: 'ফোন / WhatsApp', value: PHONE, href: `tel:${PHONE}` },
          { label: 'ইমেইল', value: EMAIL, href: `mailto:${EMAIL}` },
          { label: 'ফেসবুক পেজ', value: 'খুঁজি শেরপুর ফেসবুক পেজ', href: FACEBOOK },
          { label: 'ঠিকানা', value: 'শেরপুর সদর' },
          { label: 'সাড়া দেওয়ার সময়', value: '২৪ ঘণ্টার মধ্যে' },
        ],
        p: 'আপনার পরামর্শ, অভিযোগ বা নতুন সেবার অনুরোধ আমাদের জানান। সাইট আপনাদের জন্যই, তাই আপনার কথা আমাদের কাজে লাগে।',
      },
    ],
  },
};

export async function generateMetadata() {
  return {
    title: 'আমাদের সম্পর্কে — খুঁজি শেরপুর',
    description:
      'খুঁজি শেরপুর কী, কারা চালায়, কেন বানানো হলো এবং কীভাবে যোগাযোগ করবেন।',
    alternates: { canonical: '/about' },
  };
}

export default function AboutPage() {
  const lang = getLang();
  const t = content[lang] || content.bn;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
        <LanguageToggle lang={lang} />
      </header>

      <h1 className="text-2xl font-semibold mb-2">{t.title}</h1>
      <p className="text-sm text-ink/50 mb-8">{t.updated}</p>

      <div className="space-y-6 text-sm text-ink/80 leading-relaxed">
        {t.sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-semibold text-ink mb-2">{s.h}</h2>
            {s.list && (
              <ul className="list-disc pl-5 space-y-1.5 mb-2">
                {s.list.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
            {s.contact && (
              <ul className="space-y-1.5 mb-3">
                {s.contact.map((c, j) => (
                  <li key={j}>
                    <span className="text-ink/50">{c.label}: </span>
                    {c.href ? (
                      <a
                        href={c.href}
                        className="text-green underline"
                        {...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        {c.value}
                      </a>
                    ) : (
                      c.value
                    )}
                  </li>
                ))}
              </ul>
            )}
            {s.p && <p>{s.p}</p>}
            {s.link && (
              <a href={s.link.href} className="inline-block mt-2 text-green underline">
                {s.link.label}
              </a>
            )}
          </section>
        ))}
      </div>

      <a href="/" className="inline-block mt-10 text-green underline text-sm">
        {t.back}
      </a>
    </main>
  );
}
