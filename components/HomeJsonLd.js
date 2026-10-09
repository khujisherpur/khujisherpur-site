import { SITE_URL, SITE_NAME } from '../lib/site';

export default function HomeJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: 'Khuji Sherpur',
        inLanguage: ['bn', 'en'],
        description: 'শেরপুর জেলায় বাসা ভাড়া, চাকরি, সেবাদাতা, রক্তদাতা ও জরুরি সেবা — সব এক জায়গায়।',
        publisher: { '@id': `${SITE_URL}/#org` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo-full.png`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
