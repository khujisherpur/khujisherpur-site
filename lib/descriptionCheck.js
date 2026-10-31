// বিবরণ ঠিকঠাক লেখা হয়েছে কি না দেখে। ঠিক থাকলে null, নইলে বাংলা বার্তা।
// সেবাদাতা/শিক্ষকের জন্য কড়া (৫০ অক্ষর, ৮ শব্দ); ভাড়া, চাকরি ও কেনা-বেচার পোস্টের জন্য একটু হালকা।
// নিয়ম বদলাতে শুধু নিচের তিনটা তালিকা বদলান।
export const MIN_DESCRIPTION_CHARS = 50;
const MIN_CHARS = { rent: 30, 'buy-sell': 25, job: 40 };
const MIN_WORDS = { rent: 5, 'buy-sell': 4, job: 6 };

export function minCharsFor(kind) {
  return MIN_CHARS[kind] || MIN_DESCRIPTION_CHARS;
}

const toBn = (n) => Number(n).toLocaleString('bn-BD');

export function checkDescription(text, kind) {
  const t = (text || '').trim();
  const minChars = minCharsFor(kind);
  const minWords = MIN_WORDS[kind] || 8;
  if (t.length < minChars) {
    return `বিবরণ আরেকটু বড় করে লিখুন (কমপক্ষে ${toBn(minChars)} অক্ষর)। "নমুনা থেকে শুরু করুন" বোতাম চাপলে লেখার শুরুটা নিজে বসে যাবে`;
  }
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < minWords) {
    return `বিবরণ কমপক্ষে ${toBn(minWords)}টা শব্দে লিখুন, যাতে দেখনেওয়ালারা ভালোভাবে বুঝতে পারেন`;
  }
  if (/(.)\1{4,}/u.test(t)) {
    return 'একই অক্ষর বারবার না লিখে আসল কথা লিখুন';
  }
  const unique = new Set(words.map((w) => w.toLowerCase()));
  if (unique.size < Math.min(6, minWords)) {
    return 'একই শব্দ বারবার না লিখে একটু বিস্তারিত লিখুন';
  }
  return null;
}
