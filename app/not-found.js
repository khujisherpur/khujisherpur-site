// কোনো লিংক বা পোস্ট না পাওয়া গেলে এই পেজ দেখায়
export const metadata = {
  title: 'পাতা পাওয়া যায়নি | খুঁজি শেরপুর',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full text-center">
        <img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto mx-auto mb-6" />
        <p className="text-6xl font-bold text-green font-numeric leading-none">৪০৪</p>
        <h1 className="text-xl font-semibold mt-4">পাতাটি পাওয়া যায়নি</h1>
        <p className="text-sm text-ink/60 mt-2 leading-relaxed">
          লিংকটি ভুল হতে পারে, অথবা পোস্ট বা প্রোফাইলটি সরিয়ে ফেলা হয়েছে বা মেয়াদ শেষ হয়ে গেছে।
        </p>
        <p className="text-xs text-ink/40 mt-1">Page not found. The link may be wrong or the post has expired.</p>
        <div className="flex flex-col gap-2.5 mt-6">
          <a href="/" className="bg-green text-white font-semibold text-sm py-3 rounded-xl">
            হোমপেজে যান
          </a>
          <a href="/search" className="border border-green/40 text-green font-semibold text-sm py-3 rounded-xl">
            🔍 খুঁজে দেখুন
          </a>
        </div>
      </div>
    </main>
  );
}
