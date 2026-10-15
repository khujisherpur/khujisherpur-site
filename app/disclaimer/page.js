export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { getLang } from '../../lib/getLang';
import { SITE_NAME, DEFAULT_OG_IMAGE } from '../../lib/site';
import LanguageToggle from '../../components/LanguageToggle';

const content = {
  bn: {
    title: 'দায়বদ্ধতা সংক্রান্ত ঘোষণা',
    updated: 'সর্বশেষ হালনাগাদ: সেপ্টেম্বর ২০২৬',
    intro: 'খুঁজি শেরপুর একটি তথ্য-মাধ্যম মাত্র। এখানে প্রকাশিত বাসা ভাড়া, মেস ভাড়া, চাকরি বিজ্ঞপ্তি, ও সেবাদাতাদের তথ্য ব্যবহারকারীরাই নিজেরা পোস্ট করেন।',
    notGuaranteeTitle: 'আমরা যা নিশ্চিত করি না',
    notGuarantee: [
      'পোস্ট করা তথ্যের সম্পূর্ণ সত্যতা',
      'সেবাদাতাদের দক্ষতা বা কাজের মান',
      'বাসা/মেসের প্রকৃত অবস্থা বা মালিকানা',
      'চাকরির বিজ্ঞপ্তির বৈধতা',
    ],
    safetyTitle: 'নিরাপত্তার জন্য পরামর্শ',
    safety: [
      'বাসা দেখতে বা টাকা দেওয়ার আগে সরাসরি গিয়ে যাচাই করুন',
      'অগ্রিম টাকা পাঠানোর আগে সতর্ক থাকুন',
      'সেবাদাতা নিয়োগের আগে পরিচয়পত্র ও রেফারেন্স চেক করুন',
      'সন্দেহজনক কিছু মনে হলে সাথে সাথে রিপোর্ট করুন',
    ],
    outro: 'কোনো ব্যবহারকারীর মধ্যে হওয়া লেনদেন, চুক্তি, বা বিরোধে খুঁজি শেরপুর কোনো পক্ষ নয় এবং এ সংক্রান্ত কোনো ক্ষতির জন্য দায়ী থাকবে না।',
    back: '← হোমপেজে ফিরে যান',
  },
  en: {
    title: 'Disclaimer',
    updated: 'Last updated: September 2026',
    intro: 'Khuji Sherpur is only an information platform. House rentals, mess rentals, job listings, and service provider information published here are posted by users themselves.',
    notGuaranteeTitle: 'What We Do Not Guarantee',
    notGuarantee: [
      'The full accuracy of posted information',
      'The skill or quality of work of service providers',
      'The actual condition or ownership of a house/mess',
      'The legitimacy of job listings',
    ],
    safetyTitle: 'Safety Recommendations',
    safety: [
      'Visit and verify in person before viewing a home or paying money',
      'Be cautious before sending any advance payment',
      'Check ID and references before hiring a service provider',
      'Report immediately if something seems suspicious',
    ],
    outro: 'Khuji Sherpur is not a party to any transaction, agreement, or dispute between users, and is not liable for any resulting damages.',
    back: '← Back to Home',
  },
};

export async function generateMetadata() {
  const lang = getLang();

  const title =
    lang === 'bn'
      ? 'দায়বদ্ধতা সংক্রান্ত ঘোষণা | খুঁজি শেরপুর'
      : 'Disclaimer | Khuji Sherpur';
  const description =
    lang === 'bn'
      ? 'খুঁজি শেরপুর একটি তথ্য-মাধ্যম। পোস্ট করা তথ্যের সত্যতা আমরা নিশ্চিত করি না, বাসা ভাড়া, চাকরি বা সেবাদাতা নেওয়ার আগে নিজে যাচাই করুন।'
      : 'Khuji Sherpur is an information platform. We do not guarantee the accuracy of user posts, so verify rentals, jobs and service providers yourself.';

  return {
    title,
    description,
    alternates: { canonical: '/disclaimer' },
    openGraph: {
      title,
      description,
      url: '/disclaimer',
      siteName: SITE_NAME,
      type: 'website',
      locale: lang === 'bn' ? 'bn_BD' : 'en_US',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_OG_IMAGE] },
  };
}

export default function DisclaimerPage() {
  const lang = getLang();
  const t = content[lang];

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <header className="flex items-center justify-between mb-8">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-9 w-auto" /></a>
        <LanguageToggle lang={lang} />
      </header>

      <h1 className="text-2xl font-semibold mb-2">{t.title}</h1>
      <p className="text-sm text-ink/50 mb-8">{t.updated}</p>

      <div className="space-y-6 text-sm text-ink/80 leading-relaxed">
        <p>{t.intro}</p>

        <section>
          <h2 className="font-semibold text-ink mb-2">{t.notGuaranteeTitle}</h2>
          <ul className="list-disc pl-5 space-y-1">
            {t.notGuarantee.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-ink mb-2">{t.safetyTitle}</h2>
          <ul className="list-disc pl-5 space-y-1">
            {t.safety.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <p>{t.outro}</p>
      </div>

      <a href="/" className="inline-block mt-10 text-green underline text-sm">
        {t.back}
      </a>
    </main>
  );
}
