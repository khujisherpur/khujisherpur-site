export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../lib/supabaseClient';
import { getLang } from '../../lib/getLang';
import LanguageToggle from '../../components/LanguageToggle';

const groupOrder = ['national', 'fire', 'police', 'government', 'pourashava', 'health', 'family_planning'];

const groupLabels = {
  bn: {
    national: '🚨 জাতীয় হেল্পলাইন',
    fire: '🔥 ফায়ার সার্ভিস',
    police: '👮 থানা ও পুলিশ',
    government: '🏛️ সরকারি প্রশাসন',
    pourashava: '🏢 পৌরসভা',
    health: '🏥 স্বাস্থ্য অফিস',
    family_planning: '👨‍👩‍👧 পরিবার পরিকল্পনা',
  },
  en: {
    national: '🚨 National Helplines',
    fire: '🔥 Fire Service',
    police: '👮 Police Stations',
    government: '🏛️ Government Offices',
    pourashava: '🏢 Municipality',
    health: '🏥 Health Offices',
    family_planning: '👨‍👩‍👧 Family Planning',
  },
};

const text = {
  bn: { title: 'জরুরি সেবা', login: 'লগইন', home: '← হোমপেজ', call: 'কল করুন' },
  en: { title: 'Emergency Services', login: 'Login', home: '← Home', call: 'Call' },
};

export default async function EmergencyPage() {
  const lang = getLang();
  const t = text[lang];
  const labels = groupLabels[lang];

  const { data } = await supabase
    .from('emergency_services')
    .select('id, category, name, phone, address, upazila, map_url')
    .order('display_order', { ascending: true });

  const grouped = {};
  (data || []).forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  return (
    <main className="max-w-4xl mx-auto px-4">
      <header className="flex items-center justify-between py-6 flex-wrap gap-3">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" /></a>
        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} />
          <a href="/login" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">{t.login}</a>
        </div>
      </header>

      <a href="/" className="text-sm text-ink/50 hover:text-ink">{t.home}</a>

      <div className="flex items-center gap-3 mt-3 mb-8">
        <span className="text-3xl">🚨</span>
        <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
      </div>

      {groupOrder.map((groupKey) => {
        const items = grouped[groupKey];
        if (!items || items.length === 0) return null;
        return (
          <section key={groupKey} className="mb-10">
            <h2 className="text-lg font-semibold mb-3">{labels[groupKey]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.id} className="bg-white border border-ink/10 p-4">
                  <p className="font-medium">{item.name}</p>
                  {item.upazila && <p className="text-xs text-ink/50 mt-0.5">{item.upazila}</p>}
                  {item.address && <p className="text-sm text-ink/60 mt-1">{item.address}</p>}
                  {item.phone && (
                    <a
                      href={`tel:${item.phone}`}
                      className="block text-center mt-3 bg-green text-white font-medium py-2 text-sm hover:bg-green-dark transition-colors"
                    >
                      📞 {t.call}: <span className="font-numeric">{item.phone}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
