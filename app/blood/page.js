export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { supabase } from '../../lib/supabaseClient';
import { getLang } from '../../lib/getLang';
import LanguageToggle from '../../components/LanguageToggle';

const text = {
  bn: {
    title: 'ব্লাড', login: 'লগইন', home: '← হোমপেজ',
    needBlood: '🆘 রক্তের প্রয়োজন?', needBloodDesc: 'অনুরোধ পোস্ট করুন, ম্যাচিং ডোনাররা নোটিফিকেশন পাবেন',
    requestBtn: 'অনুরোধ করুন',
    becomeDonor: '❤️ ডোনার হতে চান?', becomeDonorDesc: 'নিবন্ধন করুন, কারো প্রয়োজন হলে নোটিফিকেশন পাবেন',
    donorBtn: 'নিবন্ধন করুন',
    activeRequests: 'সক্রিয় রক্তের অনুরোধ',
    noRequests: 'এই মুহূর্তে কোনো সক্রিয় অনুরোধ নেই।',
    bags: 'ব্যাগ',
  },
  en: {
    title: 'Blood', login: 'Login', home: '← Home',
    needBlood: '🆘 Need Blood?', needBloodDesc: 'Post a request, matching donors get notified',
    requestBtn: 'Request Now',
    becomeDonor: '❤️ Want to be a Donor?', becomeDonorDesc: 'Register and get notified when needed',
    donorBtn: 'Register',
    activeRequests: 'Active Blood Requests',
    noRequests: 'No active requests right now.',
    bags: 'bags',
  },
};

export default async function BloodPage() {
  const lang = getLang();
  const t = text[lang];

  const { data: requests } = await supabase
    .from('blood_requests')
    .select('id, blood_group, bags_needed, hospital_or_area, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-4">
      <header className="flex items-center justify-between py-6 flex-wrap gap-3">
        <a href="/"><img src="/logo-full.png" alt="খুঁজি শেরপুর" className="h-10 w-auto" /></a>
        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} />
          <a href="/login" className="text-sm border border-ink/20 rounded-full px-4 py-1.5 hover:bg-white">{t.login}</a>
        </div>
      </header>

      <a href="/" className="text-sm text-ink/50 hover:text-ink">{t.home}</a>

      <div className="flex items-center gap-3 mt-3 mb-8">
        <span className="text-3xl">🩸</span>
        <h1 className="text-2xl md:text-3xl font-semibold">{t.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-white border-2 border-red-200 p-5">
          <p className="font-semibold">{t.needBlood}</p>
          <p className="text-sm text-ink/60 mt-1 mb-4">{t.needBloodDesc}</p>
          <a
            href="/blood/request"
            className="block text-center bg-red-500 text-white font-semibold py-2.5 hover:bg-red-600 transition-colors"
          >
            {t.requestBtn}
          </a>
        </div>
        <div className="bg-white border-2 border-green/30 p-5">
          <p className="font-semibold">{t.becomeDonor}</p>
          <p className="text-sm text-ink/60 mt-1 mb-4">{t.becomeDonorDesc}</p>
          <a
            href="/blood/donor"
            className="block text-center bg-green text-white font-semibold py-2.5 hover:bg-green-dark transition-colors"
          >
            {t.donorBtn}
          </a>
        </div>
      </div>

      <section className="pb-16">
        <h2 className="text-lg font-semibold mb-3">{t.activeRequests}</h2>
        {(!requests || requests.length === 0) && (
          <p className="text-ink/50 text-sm py-6 text-center">{t.noRequests}</p>
        )}
        <div className="space-y-3">
          {(requests || []).map((r) => (
            <a
              key={r.id}
              href={`/blood/${r.id}`}
              className="flex items-center gap-4 bg-white p-4 border-l-4 border-red-400 hover:bg-paper transition-colors"
            >
              <span className="text-2xl font-bold text-red-500 flex-shrink-0">{r.blood_group}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.hospital_or_area}</p>
                <p className="text-sm text-ink/60">{r.bags_needed} {t.bags}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
