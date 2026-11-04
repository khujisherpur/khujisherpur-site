export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../lib/supabaseClient';
import { getLang } from '../../lib/getLang';
import { toBn, timeAgo } from '../../lib/format';
import { formatBloodDate } from '../../lib/bloodFormat';
import { SITE_NAME, categoryOgImage } from '../../lib/site';
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
    heroBadge: 'রক্তদাতা নেটওয়ার্ক',
    heroSub: 'শেরপুরের স্বেচ্ছাসেবী রক্তদাতা আর জরুরি অনুরোধ — সব এক জায়গায়।',
    statDonors: 'রক্তদাতা', statRequests: 'সক্রিয় অনুরোধ',
    reqTitle: 'রক্তের অনুরোধ', reqDesc: 'গ্রুপ, ব্যাগ ও হাসপাতাল জানান। মিলে যাওয়া ডোনাররা নোটিফিকেশন পাবেন।', reqBtn: 'অনুরোধ করুন',
    regTitle: 'ডোনার নিবন্ধন', regDesc: 'রক্ত দিতে চাইলে যুক্ত হন। প্রয়োজনে আপনাকে জানানো হবে।', regBtn: 'নিবন্ধন করুন',
    listTitle: 'ডোনার তালিকা', listDesc: 'গ্রুপ ও এলাকা দিয়ে খুঁজে সরাসরি যোগাযোগ করুন।', listBtn: 'তালিকা দেখুন',
    topTitle: 'সেরা রক্তদাতা', topDesc: 'শেরপুর জেলার সর্বাধিক রক্তদানকারীদের তালিকা, উপজেলা অনুযায়ী।', topBtn: 'দেখুন',
    quickGroup: 'গ্রুপ অনুযায়ী রক্তদাতা খুঁজুন', latestDonors: 'সদ্য যুক্ত রক্তদাতা', seeAll: 'সব দেখুন',
    ready: 'প্রস্তুত',
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
    heroBadge: 'Donor network',
    heroSub: 'Volunteer blood donors and urgent requests in Sherpur, all in one place.',
    statDonors: 'Donors', statRequests: 'Active requests',
    reqTitle: 'Blood Request', reqDesc: 'Share the group, bags and hospital. Matching donors get notified.', reqBtn: 'Request Now',
    regTitle: 'Donor Registration', regDesc: 'Join to give blood. You will be notified when needed.', regBtn: 'Register',
    listTitle: 'Donor List', listDesc: 'Search by group and area and contact directly.', listBtn: 'Browse List',
    topTitle: 'Top Donors', topDesc: 'Sherpur district\'s most frequent donors, by upazila.', topBtn: 'View',
    quickGroup: 'Find donors by blood group', latestDonors: 'Recently joined donors', seeAll: 'See all',
    ready: 'Ready',
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

  // এই পাতার নিজস্ব শেয়ার-ছবি (public/og/blood.jpg)
  const ogImage = categoryOgImage('blood');

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
      images: [ogImage],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

// JSON-LD নিরাপদ করা: '<' চিহ্ন এস্কেপ, যাতে </script> ঢোকানো না যায়
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ICONS = {
  drop: 'M12 2.5c3.2 4 6 7.2 6 10.5a6 6 0 1 1-12 0c0-3.3 2.8-6.5 6-10.5z',
  heart: 'M12 21s-7.5-4.6-9.5-9.2C1 8 3.2 4.5 6.7 4.5c2 0 3.5 1 5.3 3 1.8-2 3.3-3 5.3-3 3.5 0 5.7 3.5 4.2 7.3C19.5 16.4 12 21 12 21z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6H2zm14.5-5.8c3 .3 5.5 2.3 5.5 5.8h-4.2c0-2.2-.5-4-1.3-5.8z',
};

function Icon({ name, className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export default async function BloodPage() {
  const lang = getLang();
  const t = text[lang];
  const faqList = faqs[lang];
  const num = (n) => (lang === 'bn' ? toBn(n) : n);

  const [{ data: requests }, { count: donorCount }, { data: latest }, { data: totalDonorsRaw }] = await Promise.all([
    supabase
      .from('blood_requests')
      .select('id, title, blood_group, bags_needed, hospital_or_area, hemoglobin, donation_date, created_at')
      .eq('status', 'active')
      .gte('created_at', sinceISO())
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('blood_donors')
      .select('id', { count: 'exact', head: true })
      .eq('is_public', true)
      .eq('is_active', true),
    supabase
      .from('blood_donors')
      .select('id, slug, name, blood_group, area')
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.rpc('donor_total_count'),
  ]);
  const totalDonors = typeof totalDonorsRaw === 'number' ? totalDonorsRaw : donorCount || 0;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const actions = [
    { href: '/blood/request', icon: 'drop', title: t.reqTitle, desc: t.reqDesc, btn: t.reqBtn, tone: 'from-[#B91C1C] to-[#EF4444]' },
    { href: '/blood/donor', icon: 'heart', title: t.regTitle, desc: t.regDesc, btn: t.regBtn, tone: 'from-[#0E5C33] to-[#1C8A4C]' },
    { href: '/blood/donors', icon: 'users', title: t.listTitle, desc: t.listDesc, btn: t.listBtn, tone: 'from-[#1B2A4A] to-[#33497A]' },
    { href: '/blood/leaderboard', icon: 'heart', title: t.topTitle, desc: t.topDesc, btn: t.topBtn, tone: 'from-[#B45309] to-[#F59E0B]' },
  ];

  return (
    <>
    <SiteHeader lang={lang} />

    {/* হিরো */}
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3B0A12] via-[#7F1D1D] to-[#C62828] text-white">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="absolute -right-10 -top-6 w-64 h-64 text-white/[0.07] rotate-12">
        <path d={ICONS.drop} />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="absolute -left-12 bottom-0 w-44 h-44 text-white/[0.05] -rotate-12">
        <path d={ICONS.drop} />
      </svg>
      <div className="relative max-w-2xl mx-auto px-4 pt-5 pb-16">
        <a href="/" className="inline-block text-sm text-white/70 hover:text-white">{t.home}</a>
        <span className="mt-4 inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1 text-xs font-medium">
          <Icon name="drop" className="w-3.5 h-3.5 text-red-200" /> {t.heroBadge}
        </span>
        <h1 className="mt-3 text-2xl md:text-4xl font-bold leading-snug">{t.title}</h1>
        <p className="mt-2 text-sm md:text-base text-white/80 max-w-md">{t.heroSub}</p>

        <div className="mt-5 flex gap-3">
          <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 min-w-[110px]">
            <p className="text-2xl font-bold leading-none">{num(totalDonors)}</p>
            <p className="text-[11px] text-white/70 mt-1">{t.statDonors}</p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 min-w-[110px]">
            <p className="text-2xl font-bold leading-none">{num((requests || []).length)}</p>
            <p className="text-[11px] text-white/70 mt-1">{t.statRequests}</p>
          </div>
        </div>
      </div>
    </section>

    <main className="max-w-2xl mx-auto px-4">
      {/* তিন প্রবেশপথ */}
      <div className="-mt-10 relative grid grid-cols-1 gap-3">
        {actions.map((a) => (
          <a
            key={a.href}
            href={a.href}
            className="group flex items-center gap-4 bg-white rounded-2xl border border-ink/10 shadow-sm p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <span className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.tone} text-white flex items-center justify-center flex-shrink-0 shadow-md`}>
              <Icon name={a.icon} className="w-7 h-7" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-base">{a.title}</span>
              <span className="block text-xs text-ink/60 mt-0.5 leading-relaxed">{a.desc}</span>
            </span>
            <span className={`bg-gradient-to-br ${a.tone} text-white text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0 group-hover:opacity-90`}>
              {a.btn} →
            </span>
          </a>
        ))}
      </div>

      {/* গ্রুপ অনুযায়ী খোঁজা */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink/70 mb-2.5">{t.quickGroup}</h2>
        <div className="grid grid-cols-4 gap-2">
          {GROUPS.map((g) => (
            <a
              key={g}
              href={`/blood/donors?group=${encodeURIComponent(g)}`}
              className="text-center bg-white border border-red-100 text-red-600 font-bold py-2.5 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            >
              {g}
            </a>
          ))}
        </div>
      </section>

      {/* সদ্য যুক্ত রক্তদাতা */}
      {latest && latest.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t.latestDonors}</h2>
            <a href="/blood/donors" className="text-sm text-red-600 font-medium">{t.seeAll} →</a>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {latest.map((d) => (
              <a
                key={d.id}
                href={`/blood/donors/${d.slug || d.id}`}
                className="snap-start flex-shrink-0 w-40 bg-white border border-ink/10 rounded-2xl p-3 hover:shadow-md transition-shadow"
              >
                <span className="w-11 h-11 rounded-full bg-gradient-to-br from-[#B91C1C] to-[#EF4444] text-white font-bold flex items-center justify-center text-sm shadow">
                  {d.blood_group}
                </span>
                <p className="font-semibold text-sm mt-2 truncate">{d.name}</p>
                <p className="text-xs text-ink/55 truncate">📍 {d.area || '—'}</p>
                <span className="inline-block text-[10px] bg-green/10 text-green px-1.5 py-0.5 rounded-full mt-1.5">● {t.ready}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* সক্রিয় অনুরোধ */}
      <section className="mt-8 pb-10">
        <h2 className="text-lg font-semibold mb-3">{t.activeRequests}</h2>
        {(!requests || requests.length === 0) && (
          <div className="bg-white border border-dashed border-ink/20 rounded-2xl py-10 text-center">
            <span className="inline-flex w-12 h-12 rounded-full bg-red-50 text-red-300 items-center justify-center mb-2">
              <Icon name="heart" className="w-6 h-6" />
            </span>
            <p className="text-ink/50 text-sm">{t.noRequests}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {(requests || []).map((r) => (
            <a
              key={r.id}
              href={`/blood/${r.id}`}
              className="block bg-white rounded-2xl border border-red-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="bg-gradient-to-r from-[#B91C1C] to-[#EF4444] px-3 py-1.5">
                <span className="text-[11px] font-semibold text-white">
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
