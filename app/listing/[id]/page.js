export const runtime = 'edge';
import { supabase } from '../../../lib/supabaseClient';

export default async function ListingDetailPage({ params }) {
  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, area, price_or_salary, description, categories(name, slug)')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (!listing) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-ink/70">এই পোস্টটি খুঁজে পাওয়া যায়নি বা মেয়াদ শেষ হয়ে গেছে।</p>
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

      <a href={`/category/${listing.categories?.slug}`} className="text-sm text-ink/50 hover:text-ink">
        ← তালিকায় ফিরে যান
      </a>

      <div className="bg-white border border-ink/10 p-6 mt-4">
        <h1 className="text-xl font-semibold">{listing.title}</h1>
        <p className="text-ink/60 mt-1">{listing.categories?.name} · {listing.area}</p>
        <p className="text-green font-semibold text-lg mt-2">{listing.price_or_salary}</p>

        <div className="mt-6 pt-6 border-t border-ink/10">
          <h2 className="font-medium mb-2">বিবরণ</h2>
          <p className="text-ink/70 text-sm">{listing.description || 'কোনো বিবরণ দেওয়া হয়নি।'}</p>
        </div>
      </div>
    </main>
  );
}
