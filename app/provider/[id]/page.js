export const runtime = 'edge';
export default function ProviderDetailPage({ params }) {
  return (
    <main className="max-w-2xl mx-auto px-4">
      <header className="flex items-center justify-between py-6">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" /></a>
        <a href="/login" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">লগইন</a>
      </header>

      <a href="/category/electrician" className="text-sm text-ink/50 hover:text-ink">← তালিকায় ফিরে যান</a>

      <div className="bg-white border border-ink/10 p-6 mt-4">
        <h1 className="text-2xl font-semibold">রহিম উদ্দিন</h1>
        <p className="text-ink/60 mt-1">ইলেকট্রিশিয়ান · শেরপুর সদর</p>
        <p className="text-marigold mt-2">★ 4.8 (23 রিভিউ)</p>

        <div className="mt-6 pt-6 border-t border-ink/10">
          <h2 className="font-medium mb-2">বিবরণ</h2>
          <p className="text-ink/70 text-sm">
            ১০ বছরের অভিজ্ঞতা সম্পন্ন ইলেকট্রিশিয়ান। বাসাবাড়ি ও দোকানের ওয়্যারিং, ফ্যান-লাইট মেরামত, মিটার সংযোগ — সব ধরনের কাজ করা হয়।
          </p>
        </div>

        <a
          href="tel:+8801XXXXXXXXX"
          className="block text-center mt-6 bg-marigold text-ink font-semibold py-2.5 hover:bg-marigold/90 transition-colors"
        >
          📞 কল করুন
        </a>
      </div>

      <p className="text-xs text-ink/40 mt-4 text-center">
        (এটা এখনো ডামি ডাটা — পরের ধাপে Supabase থেকে আসল প্রোফাইল দেখানো হবে)
      </p>
    </main>
  );
}
