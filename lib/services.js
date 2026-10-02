import { supabase } from './supabaseClient';

export const subcategoryIcons = {
  electrician: '⚡', plumber: '🚰', 'ac-technician': '❄️', 'fridge-technician': '🧊',
  mechanic: '⚙️', carpenter: '🪚', mason: '🧱', painter: '🎨', cleaning: '🧹',
  'mobile-repair': '📱', 'computer-repair': '💻', cctv: '📹',
  'internet-wifi': '📶', driver: '🚗', 'transport-shifting': '🚚',
};

// providers: [{ id, primary_subcategory_id }]
// ফেরত দেয়: { [providerId]: [{ id, slug, icon, label, names:{bn,en}, primary }] } (প্রধান সেবা আগে)
export async function getServicesFor(providers, lang = 'bn') {
  const list = (providers || []).filter(Boolean);
  if (list.length === 0) return {};
  const ids = list.map((p) => p.id);

  const [{ data: subs }, { data: links }] = await Promise.all([
    supabase.from('subcategories').select('id, slug, name_bn, name_en'),
    supabase.from('provider_subcategories').select('provider_id, subcategory_id').in('provider_id', ids),
  ]);

  const byId = Object.fromEntries((subs || []).map((s) => [s.id, s]));
  const result = {};

  for (const p of list) {
    const subIds = new Set(
      (links || []).filter((l) => l.provider_id === p.id).map((l) => l.subcategory_id)
    );
    if (p.primary_subcategory_id) subIds.add(p.primary_subcategory_id);

    const arr = [...subIds]
      .map((id) => byId[id])
      .filter(Boolean)
      .map((s) => {
        const names = { bn: s.name_bn, en: s.name_en || s.name_bn };
        return {
          id: s.id,
          slug: s.slug,
          icon: subcategoryIcons[s.slug] || '🛠️',
          names,
          label: names[lang] || names.bn,
          primary: s.id === p.primary_subcategory_id,
        };
      })
      .sort((a, b) => Number(b.primary) - Number(a.primary));

    result[p.id] = arr;
  }
  return result;
}

// সুন্দর ঠিকানা (/electrician/rahim) থাকলে সেটা, নইলে /provider/আইডি
export function providerHref(p, services) {
  const primary = (services || []).find((s) => s.primary);
  return p.slug && primary ? `/${primary.slug}/${p.slug}` : `/provider/${p.id}`;
}
