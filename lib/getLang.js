import { cookies } from 'next/headers';

export function getLang() {
  const store = cookies();
  const value = store.get('lang')?.value;
  return value === 'en' ? 'en' : 'bn';
}
