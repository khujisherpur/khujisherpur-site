// "লোড হচ্ছে..." লেখার বদলে পেজের আকারের ধূসর ঢাঁচা
export default function PageSkeleton() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-5 animate-pulse" aria-busy="true">
      <div className="h-4 w-28 bg-ink/10 rounded mb-4" />
      <div className="h-40 bg-ink/10 rounded-2xl" />
      <div className="h-16 bg-ink/10 rounded-xl mt-4" />
      <div className="h-5 w-40 bg-ink/10 rounded mt-8 mb-3" />
      <div className="space-y-3">
        <div className="h-24 bg-ink/10 rounded-xl" />
        <div className="h-24 bg-ink/10 rounded-xl" />
      </div>
    </main>
  );
}
