// ডোমেইন বসানোর সময় শুধু এই এক লাইন বদলাবেন
export const SITE_URL = 'https://khujisherpur.com';
export const SITE_NAME = 'খুঁজি শেরপুর';

// শেয়ার-ছবি: public/og-image.jpg (১২০০×৬৩০)
export const DEFAULT_OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'খুঁজি শেরপুর — শেরপুরে যা খুঁজছেন, এক জায়গায় খুঁজুন',
};

// ক্যাটাগরি ও রক্তদাতা পাতার আলাদা শেয়ার-ছবি: public/og/<slug>.jpg (১২০০×৬৩০)
// নতুন ছবি public/og/-এ রাখার পর শুধু এই তালিকায় তার slug যোগ করবেন।
// তালিকায় না থাকলে ডিফল্ট ছবি যায়, ছবির লিংক ভাঙে না।
const CATEGORY_OG = {
  rent: 'শেরপুরে বাসা ও দোকান ভাড়া খুঁজুন — খুঁজি শেরপুর',
  job: 'শেরপুরে চাকরির খবর ও জব বিজ্ঞপ্তি — খুঁজি শেরপুর',
  'agri-product': 'শেরপুরে কৃষিপণ্য কেনাবেচা — খুঁজি শেরপুর',
  teacher: 'শেরপুরে প্রাইভেট টিউটর ও টিউশন শিক্ষক — খুঁজি শেরপুর',
  'tutor-wanted': 'শেরপুরে টিউশন ও গৃহশিক্ষক খুঁজুন — খুঁজি শেরপুর',
  venue: 'শেরপুরে কমিউনিটি সেন্টার ও ভেন্যু ভাড়া — খুঁজি শেরপুর',
  ambulance: 'শেরপুরে অ্যাম্বুলেন্স সেবা — খুঁজি শেরপুর',
  'service-provider': 'শেরপুরের সেবাদাতা — ইলেকট্রিশিয়ান, প্লাম্বারসহ — খুঁজি শেরপুর',
  'buy-sell': 'শেরপুরে নতুন ও পুরোনো পণ্য কেনাবেচা — খুঁজি শেরপুর',
  blood: 'শেরপুরে রক্তদাতা ও জরুরি রক্তের অনুরোধ — খুঁজি শেরপুর',
  'amar-sherpur': 'আমার শেরপুর — শেরপুরের কয়টি জায়গা ঘুরেছেন? — খুঁজি শেরপুর',
};

export function categoryOgImage(slug) {
  const alt = Object.prototype.hasOwnProperty.call(CATEGORY_OG, slug) ? CATEGORY_OG[slug] : null;
  if (!alt) return DEFAULT_OG_IMAGE;
  return { url: `/og/${slug}.jpg`, width: 1200, height: 630, alt };
}
