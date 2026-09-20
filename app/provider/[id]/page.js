export const runtime = 'edge';
import { supabase } from '../../../lib/supabaseClient';
import PhotoLightbox from '../../../components/PhotoLightbox';

export async function generateMetadata({ params }) {
  const { data: provider } = await supabase
    .from('providers')
    .select('name, area, description, categories(name)')
    .eq('id', params.id)
    .eq('status', 'approved')
    .single();

  if (!provider) {
    return { title: 'প্রোফাইল পাওয়া যায়নি | খুঁজি শেরপুর' };
  }

  const title = `${provider.name} - ${provider.categories?.name} ${provider.area} | খুঁজি শেরপুর`;
  const description = provider.description
    ? provider.description.slice(0, 150)
    : `শেরপুরের ${provider.area} এলাকায় বিশ্বস্ত ${provider.categories?.name}। যোগাযোগ করুন খুঁজি শেরপুরের মাধ্যমে।`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function ProviderDetailPage({ params }) {
  const { data: provider } = await supabase
    .from('providers')
    .select('id, name, area, phone, description, is_available, photo_url, categories(name, slug)')
    .eq('id', params.id)
    .eq('status', 'approved')
    .single();

  if (!provider) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">এই প্রোফাইলটি খুঁজে পাওয়া যায়নি।</p>
        <a href="/" className="text-green underline mt-2 inline-block">হোমপেজে ফিরে যান</a>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4">
      <header className="flex items-center justify-between py-6">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" /></a>
        <a href="/login" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">লগইন</a>
      </header>

      <a href={`/category/${provider.categories?.slug}`} className="text-sm text-ink/50 hover:text-ink">
        ← তালিকায় ফিরে যান
      </a>

      <div className="bg-white border border-ink/10 mt-4 overflow-hidden">
        {/* কভার-স্টাইল ব্যাকগ্রাউন্ড, উপরে */}
        <div className="h-20 bg-green/10" />

        <div className="px-6 pb-6">
          {/* প্রোফাইল ছবি — কভারের উপরে ওভারল্যাপ করে বসানো, ঠিক Facebook-এর মতো */}
          <div className="-mt-12 flex justify-center">
            {provider.photo_url ? (
              <div className="rounded-full border-4 border-white">
                <PhotoLightbox src={provider.photo_url} alt={provider.name} size="w-24 h-24" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-paper border-4 border-white flex items-center justify-center text-3xl text-ink/30">
                {provider.name?.charAt(0)}
              </div>
            )}
          </div>

          {/* নাম ও ট্যাগলাইন */}
          <div className="text-center mt-3">
            <h1 className="text-2xl font-semibold">{provider.name}</h1>
            <p className="text-ink/60 mt-1">{provider.categories?.name} · {provider.area}</p>
            {!provider.is_available && (
              <span className="inline-block mt-2 text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
                এই মুহূর্তে অনুপলব্ধ
              </span>
            )}
          </div>

          {/* বায়ো / বিবরণ */}
          <div className="mt-6 pt-6 border-t border-ink/10">
            <h2 className="font-medium mb-2 text-sm text-ink/50 uppercase tracking-wide">সম্পর্কে</h2>
            <p className="text-ink/80 text-sm leading-relaxed">
              {provider.description || 'কোনো বিবরণ দেওয়া হয়নি।'}
            </p>
          </div>

          {/* যোগাযোগ */}
          <a
            href={`tel:${provider.phone}`}
            className="block text-center mt-6 bg-marigold text-ink font-semibold py-2.5 hover:bg-marigold/90 transition-colors"
          >
            📞 {provider.phone}
          </a>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: provider.name,
            areaServed: provider.area,
            telephone: provider.phone,
            description: provider.description,
          }),
        }}
      />
    </main>
  );
}
