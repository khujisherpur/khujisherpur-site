export const REST_DAYS = 90;

export const BADGES = [
  { min: 10, name: 'জীবনরক্ষক', en: 'Lifesaver', icon: '🏆' },
  { min: 5, name: 'রক্তবীর', en: 'Blood Hero', icon: '🦸' },
  { min: 3, name: 'নিয়মিত রক্তদাতা', en: 'Regular Donor', icon: '⭐' },
  { min: 0, name: 'নবীন রক্তদাতা', en: 'New Donor', icon: '🌱' },
];

export function badgeFor(count) {
  const n = Number(count) || 0;
  return BADGES.find((b) => n >= b.min);
}

// সর্বশেষ দান থেকে ৯০ দিন পরের তারিখ; দান না থাকলে null
export function readyDate(lastDonatedAt) {
  if (!lastDonatedAt) return null;
  return new Date(new Date(lastDonatedAt).getTime() + REST_DAYS * 86400000);
}

export function isResting(lastDonatedAt) {
  const r = readyDate(lastDonatedAt);
  return !!r && r.getTime() > Date.now();
}

export function fmtBnDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}
