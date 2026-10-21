export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../lib/supabaseClient';
import { getLang } from '../../lib/getLang';
import { toBn, timeAgo } from '../../lib/format';
import { formatBloodDate } from '../../lib/bloodFormat';
import { SITE_NAME, DEFAULT_OG_IMAGE } from '../../lib/site';
import SiteHeader from '../../components/SiteHeader';

// ৩ দিনের পুরোনো অনুরোধ আর দেখানো হবে না (ডাটাবেসও মুছে ফেলে)
const EXPIRY_DAYS = 3;
const sinceISO = () => new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

const text = {
  bn: {
    title: 'শেরপুরে রক্তদাতা ও জরুরি রক্তের অনুরোধ', login: 'লগইন', home: '← হোমপেজ',
    needBlood: '🆘 রক্তের প্রয়োজন?', needBloodDesc: 'অনুরোধ পোস্ট করুন, ম্যাচিং ডোনাররা নোটিফিকেশন পাবেন',
    requestBtn: 'অনুরোধ করুন',
    becomeDonor: '❤️ ডোনার হতে চান?', becomeDonorDesc: 'নিবন্ধন করুন, কারো প্রয়োজন হলে নোটিফিকেশন পাবেন',
    donorBtn: 'নিবন্ধন করুন',
    activeRequests: 'সক্রিয় রক্তের অনুরোধ',
    noRequests: 'এই মুহূর্তে কোনো সক্রিয় অনুরোধ নেই।',
    bags: 'ব্যাগ',
    faqTitle: 'সাধারণ প্রশ্ন',
  },
  en: {
    title: 'Blood Donors & Urgent Blood Requests in Sherpur', login: 'Login', home: '← Home',
    needBlood: '🆘 Need Blood?', needBloodDesc: 'Post a request, matching donors get notified',
    requestBtn: 'Request Now',
    becomeDonor: '❤️ Want to be a Donor?', becomeDonorDesc: 'Register and get notified when needed',
    donorBtn: 'Register',
    activeRequests: 'Active Blood Requests',
    noRequests: 'No active requests right now.',
    bags: 'bags',
    faqTitle: 'Frequently asked questions',
  },
};

const faqs = {
  bn: [
    {
      q: 'শেরপুরে রক্তদাতা ও রক্তের অনুরোধ এখানে কীভাবে কাজ করে?',
      a: 'শেরপুরে জরুরি রক্ত লাগলে এখানে অনুরোধ জমা দিন। A+, A-, B+, B-, O+, O-, AB+, AB- যেকোনো গ্রুপের রক্ত লাগলে গ্রুপ মিলে যাওয়া রক্তদাতারা নোটিফিকেশন পান। আপনি রক্ত দিতে চাইলে ডোনার হিসেবে নিবন্ধন করুন।',
    },
    {
      q: 'শেরপুরে জরুরি রক্ত লাগলে কী করব?',
      a: 'এই পাতার "অনুরোধ করুন" বোতাম চেপে রক্তের গ্রুপ, কত ব্যাগ লাগবে আর হাসপাতাল বা এলাকার নাম দিয়ে অনুরোধ জমা দিন। গ্রুপ মিলে যাওয়া রক্তদাতারা নোটিফিকেশন পান, আর অনুরোধটি এই পাতাতেও সবার সামনে দেখা যায়।',
    },
    {
      q: 'শেরপুরে A+ বা অন্য গ্রুপের রক্ত কোথায় পাব?',
      a: 'এই পাতায় সক্রিয় রক্তের অনুরোধগুলো দেখা যায়, আর আপনার প্রয়োজনের গ্রুপ উল্লেখ করে অনুরোধ করলে সেই গ্রুপের নিবন্ধিত রক্তদাতারা জানতে পারেন। খুঁজি শেরপুর নিজে রক্ত সংরক্ষণ বা সরবরাহ করে না, আমরা শুধু রোগীর পরিবার আর রক্তদাতাকে যুক্ত করার মাধ্যম।',
    },
    {
      q: 'রক্তদাতা হতে কী করতে হবে?',
      a: 'লগইন করে "নিবন্ধন করুন" বোতাম থেকে আপনার রক্তের গ্রুপসহ ডোনার হিসেবে নিবন্ধন করুন। এরপর আপনার গ্রুপের কারো প্রয়োজন হলে নোটিফিকেশন পাবেন। সাধারণত সুস্থ ও প্রাপ্তবয়স্ক ব্যক্তিরা রক্ত দিতে পারেন এবং দুই রক্তদানের মাঝে কয়েক মাস বিরতি লাগে, নিশ্চিত হতে চিকিৎসকের পরামর্শ নিন।',
    },
    {
      q: 'রক্তের অনুরোধ কত দিন পর্যন্ত দেখা যায়?',
      a: 'অনুরোধ জমা দেওয়ার ৩ দিন পর এটি সাইট থেকে সরে যায়। এর আগেই রক্ত পেয়ে গেলে ড্যাশবোর্ডের "আমার রক্তের অনুরোধ" থেকে "রক্ত পেয়েছি" চাপুন, তাহলে অনুরোধটি সবার তালিকা থেকে সরে যাবে।',
    },
    {
      q: 'রক্ত নেওয়ার আগে কী মনে রাখব?',
      a: 'রক্ত নেওয়ার আগে হাসপাতালে রক্তের গ্রুপ ও প্রয়োজনীয় পরীক্ষা মিলিয়ে নিন। খুঁজি শেরপুর ব্যবহারকারীদের দেওয়া তথ্যের সত্যতা যাচাই করে না, তাই রক্তদাতা ও রোগীর পরিবার উভয়েরই নিজ দায়িত্বে যাচাই করা উচিত।',
    },
  ],
  en: [
    {
      q: 'How do blood donors and requests work on Khuji Sherpur?',
      a: 'If you urgently need blood in Sherpur, post a request here. Donors with a matching blood group (A+, A-, B+, B-, O+, O-, AB+, AB-) get notified. If you want to give blood, register as a donor.',
    },
    {
      q: 'What should I do if I urgently need blood in Sherpur?',
      a: 'Tap "Request Now" on this page and submit the blood group, number of bags needed and the hospital or area. Donors with a matching blood group get notified, and the request is also shown publicly on this page.',
    },
    {
      q: 'Where can I find A+ or another blood group in Sherpur?',
      a: 'Active blood requests are listed on this page, and when you post a request with your required group, registered donors of that group can see it. Khuji Sherpur does not store or supply blood itself; we only connect patients\' families with donors.',
    },
    {
      q: 'How do I become a blood donor?',
      a: 'Log in and use the "Register" button to sign up as a donor with your blood group. You will be notified when someone with your group needs blood. Generally healthy adults can donate, with a gap of a few months between donations; check with a doctor to be sure.',
    },
    {
      q: 'How long does a blood request stay visible?',
      a: 'A request is removed from the site 3 days after it is posted. If you receive blood earlier, open "My Blood Requests" in your dashboard and tap "Received blood" so it disappears from everyone\'s list.',
    },
    {
      q: 'What should I keep in mind before receiving blood?',
      a: 'Verify the blood group and required tests at the hospital. Khuji Sherpur does not verify information posted by users, so both donors and patients\' families should check independently.',
    },
  ],
};

export async function generateMetadata() {
  const lang = getLang();

  let n = 0;
  if (lang === 'bn') {
    const { count } = await supabase
      .from('blood_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', sinceISO());
    n = count || 0;
  }

  const title =
    lang === 'bn'
      ? 'শেরপুরে রক্ত লাগবে? রক্তদাতা ও জরুরি রক্তের অনুরোধ | খুঁজি শেরপুর'
      : 'Need Blood in Sherpur? Donors & Urgent Requests | Khuji Sherpur';
  const description =
    lang === 'bn'
      ? n > 0
        ? `এখন ${toBn(n)}টি জরুরি রক্তের অনুরোধ সক্রিয়। শেরপুরে A+, B+, O+ সহ যেকোনো গ্রুপের রক্ত লাগলে অনুরোধ করুন, রক্তদাতা হতে নিবন্ধন করুন।`
        : 'শেরপুরে A+, B+, O+ সহ যেকোনো গ্রুপের রক্ত লাগলে অনুরোধ পোস্ট করুন, রক্তদাতা হতে নিবন্ধন করুন — মিলে যাওয়া ডোনাররা নোটিফিকেশন পান।'
      : 'Post an urgent blood request in Sherpur or register as a donor. Matching donors get notified.';

  return {
    title,
    description,
    alternates: { canonical: '/blood' },
    openGraph: {
      title,
      description,
      url: '/blood',
      siteName: SITE_NAME,
      type: 'website',
      locale: lang === 'bn' ? 'bn_BD' : 'en_US',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [DEFAULT_OG_IMAGE] },
  };
}

// JSON-LD নিরাপদ করা: '<' চিহ্ন এস্কেপ, যাতে </script> ঢোকানো না যায়
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

export default async function BloodPage() {
  const lang = getLang();
  const t = text[lang];
  const faqList = faqs[lang];
  const num = (n) => (lang === 'bn' ? toBn(n) : n);

  const { data: requests } = await supabase
    .from('blood_requests')
    .select('id, title, blood_group, bags_needed, hospital_or_area, hemoglobin, donation_date, created_at')
    .eq('status', 'active')
    .gte('created_at', sinceISO())
    .order('created_at', { ascending: false })
    .limit(50);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
    <SiteHeader lang={lang} />
    <main className="max-w-2xl mx-auto px-4">
      <a href="/" className="inline-block mt-5 text-sm text-ink/50 hover:text-ink">{t.home}</a>

      <div className="flex items-center gap-3 mt-3 mb-8">
        <span className="text-3xl">🩸</span>
        <h1 className="text-xl md:text-3xl font-semibold leading-snug">{t.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-white border-2 border-red-200 p-5">
          <p className="font-semibold">{t.needBlood}</p>
          <p className="text-sm text-ink/60 mt-1 mb-4">{t.needBloodDesc}</p>
          <a
            href="/blood/request"
            className="block text-center bg-red-500 text-white font-semibold py-2.5 hover:bg-red-600 transition-colors"
          >
            {t.requestBtn}
          </a>
        </div>
        <div className="bg-white border-2 border-green/30 p-5">
          <p className="font-semibold">{t.becomeDonor}</p>
          <p className="text-sm text-ink/60 mt-1 mb-4">{t.becomeDonorDesc}</p>
          <a
            href="/blood/donor"
            className="block text-center bg-green text-white font-semibold py-2.5 hover:bg-green-dark transition-colors"
          >
            {t.donorBtn}
          </a>
        </div>
      </div>

      <section className="pb-10">
        <h2 className="text-lg font-semibold mb-3">{t.activeRequests}</h2>
        {(!requests || requests.length === 0) && (
          <p className="text-ink/50 text-sm py-6 text-center">{t.noRequests}</p>
        )}
                <div className="grid grid-cols-2 gap-3">
          {(requests || []).map((r) => (
            <a
              key={r.id}
              href={`/blood/${r.id}`}
              className="block bg-white rounded-xl border-2 border-red-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="bg-red-50 px-3 py-1.5">
                <span className="text-[11px] font-semibold text-red-600">
                  🩸 {lang === 'bn' ? 'জরুরি রক্তের অনুরোধ' : 'Urgent Blood Request'}
                </span>
              </div>
              <div className="p-3">
                {r.title && (
                  <p className="text-sm font-semibold leading-snug line-clamp-2 mb-1.5">{r.title}</p>
                )}
                <p className="text-3xl font-bold text-red-500 leading-none">{r.blood_group}</p>
                <p className="text-xs text-ink/70 mt-2">
                  {lang === 'bn' ? 'ব্যাগ' : 'Bags'}: <span className="font-semibold">{num(r.bags_needed)}</span>
                </p>
                {r.hemoglobin && (
                  <p className="text-xs text-ink/70 mt-0.5">
                    {lang === 'bn' ? 'হিমোগ্লোবিন' : 'Hb'}: <span className="font-semibold">{r.hemoglobin}</span>
                  </p>
                )}
                <p className="text-xs text-ink/70 mt-0.5 line-clamp-1">📍 {r.hospital_or_area}</p>
                {r.donation_date && (
                  <p className="text-xs text-ink/70 mt-0.5">📅 {formatBloodDate(r.donation_date, lang)}</p>
                )}
                <p className="text-[10px] text-ink/30 mt-1.5">{timeAgo(r.created_at, lang)}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <h2 className="text-lg font-semibold mb-3">{t.faqTitle}</h2>
        <div className="space-y-2">
          {faqList.map((f) => (
            <details key={f.q} className="group bg-white border border-ink/10 rounded-lg">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
                <span>{f.q}</span>
                <span className="text-ink/40 transition-transform group-open:rotate-45 flex-shrink-0">＋</span>
              </summary>
              <p className="px-4 pb-4 text-sm text-ink/70 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
    </main>
    </>
  );
}
