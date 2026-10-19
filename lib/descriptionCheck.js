// সেবাদাতা/শিক্ষকের বিবরণ ঠিকঠাক লেখা হয়েছে কি না দেখে। ঠিক থাকলে null, নইলে বাংলা বার্তা।
export const MIN_DESCRIPTION_CHARS = 50;

export function checkDescription(text) {
  const t = (text || '').trim();
  if (t.length < MIN_DESCRIPTION_CHARS) {
    return `বিবরণ আরেকটু বড় করে লিখুন (কমপক্ষে ৫০ অক্ষর)। "নমুনা থেকে শুরু করুন" বোতাম চাপলে লেখার শুরুটা নিজে বসে যাবে`;
  }
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 8) {
    return 'বিবরণ কমপক্ষে ৮টা শব্দে লিখুন, যাতে দেখনেওয়ালারা আপনার সম্পর্কে বুঝতে পারেন';
  }
  if (/(.)\1{4,}/u.test(t)) {
    return 'একই অক্ষর বারবার না লিখে নিজের কাজের কথা লিখুন';
  }
  const unique = new Set(words.map((w) => w.toLowerCase()));
  if (unique.size < 6) {
    return 'একই শব্দ বারবার না লিখে নিজের কাজ, অভিজ্ঞতা ও এলাকার কথা লিখুন';
  }
  return null;
}
