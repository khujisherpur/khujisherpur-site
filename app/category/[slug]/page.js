export const runtime = 'edge';

const categoryData = {
  'house-rent': { name: 'বাসা ভাড়া', icon: '🏠', type: 'listing' },
  'mess-rent': { name: 'মেস ভাড়া', icon: '🛏️', type: 'listing' },
  'job': { name: 'চাকরি বিজ্ঞপ্তি', icon: '💼', type: 'listing' },
  'electrician': { name: 'ইলেকট্রিশিয়ান', icon: '⚡', type: 'service' },
  'sanitary-mistri': { name: 'প্লাম্বার', icon: '🚰', type: 'service' },
};

const dummyListings = [
  { id: '1', title: '২ বেডরুম বাসা, শেরপুর সদর', area: 'শেরপুর সদর', price: '৮,০০০ টাকা/মাস' },
  { id: '2', title: '১ বেডরুম বাসা, নালিতাবাড়ী রোড', area: 'নালিতাবাড়ী', price: '৫,৫০০ টাকা/মাস' },
  { id: '3', title: 'সিঙ্গেল রুম মেস, কলেজ রোড', area: 'শেরপুর সদর', price: '২,৫০০ টাকা/মাস' },
];

const dummyProviders = [
  { id: '1', name: 'রহিম উদ্দিন', area: 'শেরপুর সদর', rating: 4.8, reviews: 23 },
  { id: '2', name: 'করিম মিয়া', area: 'নালিতাবাড়ী', rating: 4.5, reviews: 15 },
  { id: '3', name: 'জসিম উদ্দিন', area: 'শ্রীবরদী', rating: 4.9, reviews: 31 },
];

export default function CategoryPage({ params }) {
  const category = categoryData[params.slug];

  if (!category) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">এই ক্যাটাগরি খুঁজে পাওয়া যায়নি।</p>
        <a href="/" className="text-green underline mt-2 inline-block">হোমপেজে ফিরে যান</a>
      </main>
    );
  }

  const isService = category.type === 'service';
  const items = isService ? dummyProviders : dummyListings;

  return (
    <main className="max-w-4xl mx-auto px-4">
      <header className="flex items-center justify-between py-6">
        <a href="/" className="flex items-center">
          <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" />
        </a>
        <a href="/login" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white transition-colors">
          লগইন
        </a>
      </header>

      <div className="py-6">
        <a href="/" className="text-sm text-ink/50 hover:text-ink">← হোমপেজ</a>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-3xl">{category.icon}</span>
          <h1 className="text-2xl md:text-3xl font-semibold">{category.name}</h1>
        </div>
        <a
          href={`/post/new?category=${params.slug}`}
          className="inline-block mt-4 bg-marigold text-ink font-semibold px-5 py-2.5 hover:bg-marigold/90 transition-colors"
        >
          {isService ? '+ আপনার প্রোফাইল যুক্ত করুন' : '+ নতুন পোস্ট দিন'}
        </a>
      </div>

      <section className="pb-16 space-y-3">
        {isService
          ? dummyProviders.map((p) => (
              <a
                key={p.id}
                href={`/provider/${p.id}`}
                className="block bg-white p-4 border border-ink/10 hover:border-green transition-colors"
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-ink/60 mt-1">{p.area}</p>
                <p className="text-sm text-marigold mt-1">★ {p.rating} ({p.reviews} রিভিউ)</p>
              </a>
            ))
          : dummyListings.map((l) => (
              <a
                key={l.id}
                href={`/listing/${l.id}`}
                className="block bg-white p-4 border border-ink/10 hover:border-green transition-colors"
              >
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-ink/60 mt-1">{l.area}</p>
                <p className="text-sm text-green font-medium mt-1">{l.price}</p>
              </a>
            ))}
      </section>
    </main>
  );
}
