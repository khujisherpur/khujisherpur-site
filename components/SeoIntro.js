// পেজের নিচে বাংলা লেখা + প্রশ্ন-উত্তর (FAQ) দেখায় এবং FAQPage schema (JSON-LD) বসায়।
// FAQ-এর স্টাইল ব্লাড পেজের মতো: সাদা বক্স, ট্যাপ করলে খোলে (<details>), ডানে ＋ চিহ্ন।
// content না থাকলে বা ভাষা বাংলা না হলে কিছুই দেখায় না।
export default function SeoIntro({ content, lang }) {
  if (!content || lang !== 'bn') return null;
  const { heading, intro, faq = [] } = content;

  const jsonLd = faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <>
      {(heading || intro) && (
        <section className="bg-white rounded-xl border border-ink/10 p-4 mb-6">
          {heading && <h2 className="text-base font-semibold leading-snug">{heading}</h2>}
          {intro && <p className="text-sm text-ink/70 leading-relaxed mt-2">{intro}</p>}
        </section>
      )}

      {faq.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">সাধারণ প্রশ্ন</h2>
          <div className="space-y-2">
            {faq.map((f) => (
              <details key={f.q} className="group bg-white border border-ink/10 rounded-lg">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
                  <span>{f.q}</span>
                  <span className="text-ink/40 transition-transform group-open:rotate-45 flex-shrink-0">＋</span>
                </summary>
                <p className="px-4 pb-4 text-sm text-ink/70 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </>
  );
}
