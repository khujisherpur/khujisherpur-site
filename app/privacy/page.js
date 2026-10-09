export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { getLang } from '../../lib/getLang';
import LanguageToggle from '../../components/LanguageToggle';

const content = {
  bn: {
    title: 'প্রাইভেসি পলিসি',
    updated: 'সর্বশেষ হালনাগাদ: অক্টোবর ২০২৬',
    back: '← হোমপেজে ফিরে যান',
    sections: [
      {
        h: '১. আমরা কী তথ্য সংগ্রহ করি',
        p: 'অ্যাকাউন্ট তৈরি করলে আমরা সংগ্রহ করি: আপনার নাম, ইমেইল, এবং (যদি Google দিয়ে লগইন করেন) Google থেকে পাওয়া প্রোফাইল তথ্য। পোস্ট বা প্রোফাইল তৈরি করলে আপনার দেওয়া ফোন নম্বর, এলাকা, ও বিবরণও সংরক্ষণ করা হয়। রক্তদাতা হিসেবে নিবন্ধন করলে নাম, রক্তের গ্রুপ, ফোন নম্বর ও এলাকা সংরক্ষণ করা হয়।',
      },
      {
        h: '২. তথ্য কীভাবে ব্যবহার হয়',
        p: 'আপনার তথ্য শুধুমাত্র সাইটের কার্যক্রম পরিচালনার জন্য ব্যবহার হয় — যেমন আপনার অ্যাকাউন্ট চেনা, আপনার পোস্ট/প্রোফাইল অন্যদের দেখানো, এবং জরুরি নোটিফিকেশন পাঠানো। প্রোভাইডার প্রোফাইল ও পোস্টে দেওয়া ফোন নম্বর সবার জন্য প্রকাশ্য থাকে, কারণ এটাই যোগাযোগের মূল মাধ্যম।',
      },
      {
        h: '৩. রক্তদাতা ও রক্তের অনুরোধ',
        p: 'রক্তদাতার নাম, ফোন নম্বর ও এলাকা সবার জন্য প্রকাশ্য নয়; এগুলো শুধু মিলে যাওয়া রক্তের অনুরোধের নোটিফিকেশন পাঠাতে ব্যবহার হয়। রক্তের অনুরোধ সক্রিয় থাকা অবস্থায় তাতে দেওয়া হাসপাতাল, যোগাযোগ নম্বর, আবেদনকারী ও রোগীর নাম সবার জন্য দৃশ্যমান থাকে, যাতে ডোনাররা যোগাযোগ করতে পারেন। অনুরোধ করার ৩ দিন পর, অথবা প্রয়োজনীয় রক্ত পাওয়া গেলে, অনুরোধটি স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়। কোনো ডোনার রক্ত দিয়েছেন, এই রেকর্ড (তারিখসহ) অনুরোধ মুছে গেলেও সংরক্ষিত থাকে।',
      },
      {
        h: '৪. তথ্য বিক্রি বা শেয়ার',
        p: 'আমরা আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি করি না। আপনার ইমেইল ও লগইন তথ্য নিরাপদে Supabase-এর মাধ্যমে সংরক্ষিত হয়।',
      },
      {
        h: '৫. আপনার নিয়ন্ত্রণ',
        p: 'আপনি যে কোনো সময় ড্যাশবোর্ড থেকে নিজের পোস্ট বা প্রোফাইল এডিট বা ডিলিট করতে পারবেন। সম্পূর্ণ অ্যাকাউন্ট মুছে ফেলতে চাইলে আমাদের সাথে যোগাযোগ করুন।',
      },
      {
        h: '৬. যোগাযোগ',
        p: 'প্রাইভেসি সংক্রান্ত কোনো প্রশ্ন থাকলে আমাদের ইমেইল করুন: khujisherpur@gmail.com',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: October 2026',
    back: '← Back to Home',
    sections: [
      {
        h: '1. What We Collect',
        p: 'When you create an account, we collect your name, email, and (if you sign in with Google) profile information from Google. When you create a post or profile, we also store the phone number, area, and description you provide. If you register as a blood donor, we store your name, blood group, phone number and area.',
      },
      {
        h: '2. How We Use It',
        p: 'Your information is used only to operate the site — recognizing your account, showing your posts/profiles to others, and sending important notifications. Phone numbers on provider profiles and posts are public, since they are the main way to make contact.',
      },
      {
        h: '3. Blood Donors & Blood Requests',
        p: 'A donor\'s name, phone number and area are not public; they are used only to send notifications about matching blood requests. While a blood request is active, the hospital, contact number, and the applicant\'s and patient\'s names shown on it are visible to everyone so donors can get in touch. A request is deleted automatically 3 days after it is made, or once the required blood has been given. The record that a donor gave blood (with its date) is kept even after the request is deleted.',
      },
      {
        h: '4. Sharing & Sale of Data',
        p: 'We do not sell your personal information to any third party. Your email and login data is securely stored via Supabase.',
      },
      {
        h: '5. Your Control',
        p: 'You can edit or delete your own posts or profiles from your dashboard at any time. Contact us if you wish to delete your entire account.',
      },
      {
        h: '6. Contact',
        p: 'For any privacy-related questions, email us at: khujisherpur@gmail.com',
      },
    ],
  },
};

export async function generateMetadata() {
  const lang = getLang();
  return {
    title: lang === 'bn' ? 'প্রাইভেসি পলিসি — খুঁজি শেরপুর' : 'Privacy Policy — Khuji Sherpur',
    description:
      lang === 'bn'
        ? 'খুঁজি শেরপুর কী তথ্য সংগ্রহ করে, কীভাবে ব্যবহার করে এবং রক্তদাতার তথ্য কীভাবে সুরক্ষিত থাকে।'
        : 'What information Khuji Sherpur collects, how it is used, and how blood donor data is protected.',
  };
}

export default function PrivacyPage() {
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
        {t.sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-semibold text-ink mb-2">{s.h}</h2>
            <p>{s.p}</p>
          </section>
        ))}
      </div>

      <a href="/" className="inline-block mt-10 text-green underline text-sm">
        {t.back}
      </a>
    </main>
  );
}
