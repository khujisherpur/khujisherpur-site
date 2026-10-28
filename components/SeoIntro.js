// পেজের নিচে বাংলা লেখা + প্রশ্ন-উত্তর (FAQ) দেখায় এবং FAQPage schema (JSON-LD) বসায়।
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
    <section className="bg-white rounded-xl border border-ink/10 p-4">
      {heading && <h2 className="text-base font-semibold leading-snug">{heading}</h2>}
      {intro && <p className="text-sm text-ink/70 leading-relaxed mt-2">{intro}</p>}
      {faq.map((f) => (
        <div key={f.q} className="mt-4">
          <h3 className="text-sm font-medium leading-snug">{f.q}</h3>
          <p className="text-sm text-ink/65 leading-relaxed mt-1">{f.a}</p>
        </div>
      ))}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </section>
  );
}
