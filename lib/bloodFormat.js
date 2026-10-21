import { toBn } from './format';

const BN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatBloodDate(value, lang = 'bn') {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  if (lang === 'bn') return `${toBn(d)} ${BN[m - 1]} ${toBn(y)}`;
  return `${d} ${EN[m - 1]} ${y}`;
}
