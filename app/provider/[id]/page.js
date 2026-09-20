export const runtime = 'edge';
import { supabase } from '../../../lib/supabaseClient';

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
    .select('id, name, area, phone, description, is_available, categories(name, slug)')
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

      <div className="bg-white border border-ink/10 p-6 mt-4">
        <h1 className="text-2xl font-semibold">{provider.name}</h1>
        <p className="text-ink/60 mt-1">{provider.categories?.name} · {provider.area}</p>

        {!provider.is_available && (
          <p className="text-sm text-red-500 mt-2">এই মুহূর্তে অনুপলব্ধ</p>
        )}

        <div className="mt-6 pt-6 border-t border-ink/10">
          <h2 className="font-medium mb-2">বিবরণ</h2>
          <p className="text-ink/70 text-sm">{provider.description || 'কোনো বিবরণ দেওয়া হয়নি।'}</p>
        </div>

        <a
          href={`tel:${provider.phone}`}
          className="block text-center mt-6 bg-marigold text-ink font-semibold py-2.5 hover:bg-marigold/90 transition-colors"
        >
          📞 {provider.phone}
        </a>
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
