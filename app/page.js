export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { getLang } from '../lib/getLang';
import { categoryLabels } from '../lib/categoryLabels';
import LanguageToggle from '../components/LanguageToggle';

const text = {
  bn: {
    login: 'লগইন',
    heroTitle: 'শেরপুরে যা খুঁজছেন, এক জায়গায় খুঁজে নিন',
    heroSub: 'বাসা ভাড়া, চাকরি, নাকি বিশ্বস্ত মিস্ত্রি — যা দরকার সবই পাবেন এখানে।',
    searchPlaceholder: 'যেমন: বাসা ভাড়া, ইলেকট্রিশিয়ান...',
    searchButton: 'খুঁজুন',
    whatLooking: 'কী খুঁজছেন?',
    terms: 'শর্তাবলি',
    privacy: 'প্রাইভেসি পলিসি',
    disclaimer: 'দায়বদ্ধতা',
    footer: '© ২০২৬ খুঁজি শেরপুর',
    credit: 'Developed by ASRAFUL',
  },
  en: {
    login: 'Login',
    heroTitle: 'Find what you\u2019re looking for in Sherpur, all in one place',
    heroSub: 'House rent, jobs, or a trusted repairman — get everything you need here.',
    searchPlaceholder: 'e.g. house rent, electrician...',
    searchButton: 'Search',
    whatLooking: 'What are you looking for?',
    terms: 'Terms',
    privacy: 'Privacy Policy',
    disclaimer: 'Disclaimer',
    footer: '© 2026 Khuji Sherpur',
    credit: 'Developed by ASRAFUL',
  },
};

export default function HomePage() {
  const lang = getLang();
  const t = text[lang];
  const categories = Object.entries(categoryLabels).map(([slug, c]) => ({
    slug,
    icon: c.icon,
    type: c.type,
    name: c[lang].name,
    desc: c[lang].desc,
  }));

  return (
    <main className="max-w-4xl mx-auto px-4">
      <header className="flex items-center justify-between py-6 flex-wrap gap-3">
        <a href="/" className="flex items-center">
          <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" />
        </a>
        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} />
          <a
            href="/login"
            className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white transition-colors"
          >
            {t.login}
          </a>
        </div>
      </header>

      <section className="py-10 md:py-16">
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight text-ink max-w-xl">
          {t.heroTitle}
        </h1>
        <p className="mt-4 text-ink/70 max-w-md">{t.heroSub}</p>

        <form action="/search" method="GET" className="mt-8 flex gap-2 max-w-xl bg-white border-2 border-ink/10 p-2">
          <input
            type="text"
            name="q"
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent outline-none px-3 py-2 text-base placeholder:text-ink/40"
          />
          <button
            type="submit"
            className="bg-marigold text-ink font-semibold px-5 py-2 hover:bg-marigold/90 transition-colors"
          >
            {t.searchButton}
          </button>
        </form>
      </section>

      <section className="pb-16">
        <h2 className="text-xl font-semibold mb-4">{t.whatLooking}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <a
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`block bg-white p-4 border-l-4 hover:bg-paper transition-colors ${
                cat.type === 'service' ? 'border-green' : 'border-marigold'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <p className="font-medium mt-2">{cat.name}</p>
              <p className="text-sm text-ink/60 mt-1">{cat.desc}</p>
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink/10 py-6 text-sm text-ink/60 flex flex-col items-center gap-2">
        <div className="flex gap-4 flex-wrap justify-center">
          <a href="/terms" className="hover:text-ink">{t.terms}</a>
          <a href="/privacy" className="hover:text-ink">{t.privacy}</a>
          <a href="/disclaimer" className="hover:text-ink">{t.disclaimer}</a>
        </div>
        <p>{t.footer}</p>
        <a
          href="https://www.facebook.com/share/1CDYwoqn57/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink/40 hover:text-ink"
        >
          {t.credit}
        </a>
      </footer>
    </main>
  );
}
