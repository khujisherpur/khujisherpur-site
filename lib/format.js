const BN = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBn(v) {
  return String(v).replace(/[0-9]/g, (d) => BN[d]);
}

function toEn(s) {
  return String(s).replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
}

// "৮,০০০" / "8000" / "৳ 8000" -> 8000, অন্য কিছু হলে null
export function parsePrice(raw) {
  if (raw === null || raw === undefined) return null;
  const s = toEn(raw).replace(/[,\s৳]/g, '');
  return /^\d+$/.test(s) ? parseInt(s, 10) : null;
}

function groupBd(n) {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

export function formatPrice(raw, lang = 'bn') {
  const n = parsePrice(raw);
  if (n === null) return raw ? String(raw) : '';
  const out = groupBd(n);
  return `৳ ${lang === 'bn' ? toBn(out) : out}`;
}

export function timeAgo(dateStr, lang = 'bn') {
  if (!dateStr) return '';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  const f = (n) => (lang === 'bn' ? toBn(n) : n);
  if (mins < 1) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
  if (mins < 60) return lang === 'bn' ? `${f(mins)} মিনিট আগে` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'bn' ? `${f(hours)} ঘণ্টা আগে` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return lang === 'bn' ? `${f(days)} দিন আগে` : `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return lang === 'bn' ? `${f(months)} মাস আগে` : `${months}mo ago`;
  const years = Math.floor(months / 12);
  return lang === 'bn' ? `${f(years)} বছর আগে` : `${years}y ago`;
}

// বাংলা অঙ্কের নম্বরেও tel: লিংক যেন কাজ করে
export function cleanPhone(phone) {
  return toEn(phone || '').replace(/[^\d+]/g, '');
}

export function waLink(phone) {
  let d = toEn(phone || '').replace(/\D/g, '');
  if (d.startsWith('880')) {
    // ঠিক আছে
  } else if (d.startsWith('0')) {
    d = '88' + d;
  } else if (d.length === 10) {
    d = '880' + d;
  }
  return d.length === 13 ? `https://wa.me/${d}` : null;
}
// বাংলাদেশি মোবাইল নম্বর যাচাই (01XXXXXXXXX বা +8801XXXXXXXXX, বাংলা অঙ্কেও চলবে)
export function isValidBdPhone(raw) {
  const d = cleanPhone(raw).replace(/^\+/, '');
  return /^(88)?01[3-9]\d{8}$/.test(d);
}
