const categories = [
  { name: 'বাসা ভাড়া', slug: 'house-rent', icon: '🏠', desc: 'শেরপুরে ভাড়া বাসা খুঁজুন', type: 'listing' },
  { name: 'মেস ভাড়া', slug: 'mess-rent', icon: '🛏️', desc: 'ছাত্র ও চাকরিজীবীদের মেস', type: 'listing' },
  { name: 'চাকরি বিজ্ঞপ্তি', slug: 'job', icon: '💼', desc: 'শেরপুরের সর্বশেষ চাকরির খবর', type: 'listing' },
  { name: 'ইলেকট্রিশিয়ান', slug: 'electrician', icon: '⚡', desc: 'বিশ্বস্ত ইলেকট্রিশিয়ান খুঁজুন', type: 'service' },
  { name: 'প্লাম্বার', slug: 'sanitary-mistri', icon: '🚰', desc: 'পানি ও স্যানেটারি মেরামত', type: 'service' },
];

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-4">
      <header className="flex items-center justify-between py-6">
        <a href="/" className="flex items-center">
          <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" />
        </a>
        <a
          href="/login"
          className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white transition-colors"
        >
          লগইন
        </a>
      </header>

      <section className="py-10 md:py-16">
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight text-ink max-w-xl">
          শেরপুরে যা খুঁজছেন, এক জায়গায় খুঁজে নিন
        </h1>
        <p className="mt-4 text-ink/70 max-w-md">
          বাসা ভাড়া, চাকরি, নাকি বিশ্বস্ত মিস্ত্রি — যা দরকার সবই পাবেন এখানে।
        </p>

        <form className="mt-8 flex gap-2 max-w-xl bg-white border-2 border-ink/10 p-2">
          <input
            type="text"
            placeholder="যেমন: বাসা ভাড়া, ইলেকট্রিশিয়ান..."
            className="flex-1 bg-transparent outline-none px-3 py-2 text-base placeholder:text-ink/40"
          />
          <button
            type="submit"
            className="bg-marigold text-ink font-semibold px-5 py-2 hover:bg-marigold/90 transition-colors"
          >
            খুঁজুন
          </button>
        </form>
      </section>

      <section className="pb-16">
        <h2 className="text-xl font-semibold mb-4">কী খুঁজছেন?</h2>
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
        <div className="flex gap-4">
          <a href="/terms" className="hover:text-ink">শর্তাবলি</a>
          <a href="/privacy" className="hover:text-ink">প্রাইভেসি পলিসি</a>
        </div>
        <p>© ২০২৬ খুঁজি শেরপুর</p>
      </footer>
    </main>
  );
}
