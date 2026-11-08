// বসাবেন: app/verification/page.js
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { getLang } from '../../lib/getLang';
import LanguageToggle from '../../components/LanguageToggle';

const PHONE = '01600485274';
const EMAIL = 'asrafulhosen222002@gmail.com';

const content = {
  bn: {
    title: 'ভেরিফিকেশন নীতি',
    updated: 'সর্বশেষ হালনাগাদ: নভেম্বর ২০২৬',
    back: '← হোমপেজে ফিরে যান',
    sections: [
      {
        h: '✓ চিহ্নের অর্থ',
        p: 'সেবাদাতার নামের পাশে ✓ দেখলে বুঝবেন, খুঁজি শেরপুর তাঁর পরিচয় ও ফোন নম্বর নিজে যাচাই করেছে। এটি তাঁর কাজের মানের গ্যারান্টি নয়।',
      },
      {
        h: 'কীভাবে যাচাই হয়',
        ordered: [
          'ফোন যাচাই: প্রোফাইলের নম্বরে কল করে নিশ্চিত হই নম্বরটি তাঁর নিজের ও চালু।',
          'পরিচয়পত্র যাচাই: NID বা অন্য পরিচয়পত্রের ফটো দেখে নাম মিলিয়ে দেখি। নম্বর বা ছবি সন্দেহজনক হলে সংরক্ষণ করি না।',
        ],
      },
      {
        h: 'কী যাচাই হয় না',
        list: [
          'কাজের মান, দাম বা সময়মতো কাজ সারার সক্ষমতা।',
          'ডাক্তার, ইঞ্জিনিয়ার বা অন্য পেশাদার সনদ বা লাইসেন্স, যদি নিচে আলাদা করে লেখা না থাকে।',
          'পোস্ট বা সেবার সব দাবির সত্যতা।',
        ],
        p: 'ভেরিফাইড হওয়া সত্ত্বেও আপনি নিজে সতর্ক থাকুন: কাজের আগে দাম ও শর্ত স্পষ্ট করে নিন।',
      },
      {
        h: 'জবাবদিহিতা',
        list: [
          'প্রতিটি ✓ চিহ্নের পাশে যাচাইয়ের তারিখ রাখা হয়, তাই পুরনো ভেরিফিকেশন নির্দিষ্ট সময় পর নবায়ন করা হয় ১২ মাস পর পর।',
          'অভিযোগ পেলে আমরা কিছু দিনের মধ্যে তদন্ত করি। অভিযোগ সত্য হলে ✓ চিহ্ন সরিয়ে দেওয়া হয়, গুরুতর হলে প্রোফাইলও সরিয়ে দেওয়া হয়।',
          'নিচের কারণগুলোতে ✓ চিহ্ন সরানো হয়: ভুয়া তথ্য, টাকা নিয়ে প্রতারণা, ফোন নম্বর বন্ধ বা বদলে যাওয়া, বারবার বড় অভিযোগ।',
        ],
      },
    ],
    complaintTitle: 'অভিযোগ জানান',
  },
};

export async function generateMetadata() {
  return {
    title: 'ভেরিফিকেশন নীতি — খুঁজি শেরপুর',
    description:
      '✓ চিহ্নের অর্থ কী, কীভাবে সেবাদাতাকে যাচাই করা হয় এবং কী যাচাই করা হয় না।',
    alternates: { canonical: '/verification' },
  };
}

export default function VerificationPage() {
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
            {s.ordered && (
              <ol className="list-decimal pl-5 space-y-1.5 mb-2">
                {s.ordered.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            )}
            {s.list && (
              <ul className="list-disc pl-5 space-y-1.5 mb-2">
                {s.list.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
            {s.p && <p>{s.p}</p>}
          </section>
        ))}

        <section>
          <h2 className="font-semibold text-ink mb-2">{t.complaintTitle}</h2>
          <p>
            কোনো ✓ চিহ্নিত সেবাদাতার বিরুদ্ধে সমস্যা হলে পোস্টের "রিপোর্ট করুন" বাটন চাপুন, অথবা{' '}
            <a href={`tel:${PHONE}`} className="text-green underline">{PHONE}</a> বা{' '}
            <a href={`mailto:${EMAIL}`} className="text-green underline">{EMAIL}</a>-এ জানান।
            আপনার নাম ও সম্পর্ক গোপন রাখা হবে যতটা সম্ভব।
          </p>
        </section>
      </div>

      <a href="/" className="inline-block mt-10 text-green underline text-sm">
        {t.back}
      </a>
    </main>
  );
}
